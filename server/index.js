const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function envValue(name, fallback = '') {
  const key = Object.keys(process.env).find((item) => item.toUpperCase() === name.toUpperCase());
  return key ? process.env[key] : fallback;
}

const port = Number(envValue('PORT', '4100'));
const mongoUri = envValue('MONGODB_URI');
const databaseName = envValue('MONGODB_DB', 'lipi');
const geminiApiKey = envValue('GEMINI_API_KEY');
const geminiModel = envValue('GEMINI_MODEL', 'gemini-3.1-flash-lite-preview');
const apiToken = envValue('AI_API_TOKEN');
const hasApiToken = Boolean(apiToken && !apiToken.includes('REPLACE_'));

if (!mongoUri || mongoUri.includes('YOUR_')) throw new Error('MONGODB_URI is not configured in server/.env');
if (databaseName !== 'lipi') throw new Error(`Refusing to start with MONGODB_DB=${databaseName}. Lipi must use the lipi database.`);

const client = new MongoClient(mongoUri, { appName: 'Lipi', serverSelectionTimeoutMS: 10_000 });
let databasePromise;

async function database() {
  if (!databasePromise) {
    databasePromise = (async () => {
      await client.connect();
      const db = client.db(databaseName);
      await Promise.all([
        db.collection('progress_snapshots').createIndex({ deviceUserId: 1 }, { unique: true }),
        db.collection('ai_sessions').createIndex({ deviceUserId: 1, createdAt: -1 }),
        db.collection('content_reviews').createIndex({ languageId: 1 }, { unique: true }),
        db.collection('pronunciation_assessments').createIndex({ deviceUserId: 1, createdAt: -1 }),
      ]);
      return db;
    })().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function isLoopback(address = '') {
  return address === '127.0.0.1' || address === '::1' || address.endsWith('127.0.0.1');
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(left ?? '');
  const rightBuffer = Buffer.from(right ?? '');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function requireApiAccess(req, res, next) {
  if (!hasApiToken) {
    if (isLoopback(req.socket.remoteAddress)) return next();
    return res.status(503).json({ error: 'Set AI_API_TOKEN before using the server over a network.' });
  }
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const supplied = req.headers['x-ai-api-token'] || bearer;
  if (!secureEqual(String(supplied ?? ''), apiToken)) return res.status(401).json({ error: 'Unauthorized' });
  return next();
}

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '8mb' }));

app.get('/health', async (_req, res) => {
  try {
    const db = await database();
    await db.command({ ping: 1 });
    res.json({ ok: true, database: databaseName, aiConfigured: Boolean(geminiApiKey && !geminiApiKey.includes('YOUR_')) });
  } catch (error) {
    res.status(503).json({ ok: false, error: error instanceof Error ? error.message : 'Database unavailable' });
  }
});

app.use('/api', requireApiAccess);

app.put('/api/progress/:deviceUserId', async (req, res) => {
  const deviceUserId = String(req.params.deviceUserId ?? '').trim();
  if (!deviceUserId || deviceUserId.length > 120) return res.status(400).json({ error: 'Invalid device user id' });
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return res.status(400).json({ error: 'Progress payload must be an object' });
  const db = await database();
  const now = new Date();
  await db.collection('progress_snapshots').updateOne(
    { deviceUserId },
    { $set: { payload, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  res.json({ ok: true, database: databaseName, updatedAt: now.toISOString() });
});

app.get('/api/progress/:deviceUserId', async (req, res) => {
  const db = await database();
  const snapshot = await db.collection('progress_snapshots').findOne(
    { deviceUserId: String(req.params.deviceUserId) },
    { projection: { _id: 0 } },
  );
  if (!snapshot) return res.status(404).json({ error: 'No cloud snapshot found' });
  return res.json(snapshot);
});

app.get('/api/content-review/:languageId', async (req, res) => {
  const languageId = String(req.params.languageId ?? '').trim().toLowerCase();
  if (!/^[a-z]{2,3}$/.test(languageId)) return res.status(400).json({ error: 'Invalid language id' });
  const db = await database();
  const review = await db.collection('content_reviews').findOne({ languageId }, { projection: { _id: 0 } });
  return res.json(review ?? { languageId, status: 'needs-review', notes: '', updatedAt: null });
});

app.put('/api/content-review/:languageId', async (req, res) => {
  const languageId = String(req.params.languageId ?? '').trim().toLowerCase();
  const status = String(req.body?.status ?? 'needs-review');
  const notes = String(req.body?.notes ?? '').slice(0, 10_000);
  const summary = req.body?.summary;
  if (!/^[a-z]{2,3}$/.test(languageId)) return res.status(400).json({ error: 'Invalid language id' });
  if (!['needs-review', 'in-review', 'approved'].includes(status)) return res.status(400).json({ error: 'Invalid review status' });
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return res.status(400).json({ error: 'Content summary is required' });
  const db = await database();
  const now = new Date();
  await db.collection('content_reviews').updateOne(
    { languageId },
    { $set: { languageId, status, notes, summary, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  return res.json({ ok: true, database: databaseName, languageId, status, updatedAt: now.toISOString() });
});

app.post('/api/tutor', async (req, res) => {
  if (!geminiApiKey || geminiApiKey.includes('YOUR_')) return res.status(503).json({ error: 'Gemini is not configured' });
  const { deviceUserId, teacherLanguage = 'English', targetLanguage, level = 'beginner', topic = 'daily life', learnerAnswer = '' } = req.body ?? {};
  if (!targetLanguage) return res.status(400).json({ error: 'targetLanguage is required' });
  const prompt = `You are Lipi, a careful language tutor. Teacher language: ${teacherLanguage}. Target language: ${targetLanguage}. Learner level: ${level}. Topic: ${topic}. Learner answer: ${learnerAnswer || 'none yet'}. Return JSON with keys explanation, targetText, romanization, translation, correction, choices (array of 3 short strings), and encouragement. Keep content culturally neutral, age-appropriate, and concise. Never claim pronunciation scoring from text alone.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.5 } }),
  });
  if (!response.ok) return res.status(502).json({ error: 'AI provider error', status: response.status });
  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '{}';
  let lesson;
  try { lesson = JSON.parse(text); } catch { lesson = { explanation: text }; }
  try {
    const db = await database();
    await db.collection('ai_sessions').insertOne({ deviceUserId: String(deviceUserId ?? 'anonymous'), targetLanguage, level, topic, lesson, createdAt: new Date() });
  } catch (error) {
    console.warn('Tutor response was not logged to MongoDB:', error instanceof Error ? error.message : error);
  }
  res.json(lesson);
});

app.post('/api/pronunciation', async (req, res) => {
  if (!geminiApiKey || geminiApiKey.includes('YOUR_')) return res.status(503).json({ error: 'Gemini is not configured' });
  const { deviceUserId, language, targetText, audioBase64, mimeType = 'audio/mp4' } = req.body ?? {};
  if (!language || !targetText || !audioBase64) return res.status(400).json({ error: 'language, targetText, and audioBase64 are required' });
  if (String(targetText).length > 240) return res.status(400).json({ error: 'Target text is too long' });
  if (!/^audio\/[a-z0-9.+-]+$/i.test(String(mimeType))) return res.status(400).json({ error: 'Invalid audio MIME type' });
  if (String(audioBase64).length > 7_000_000) return res.status(413).json({ error: 'Recording is too large' });
  const prompt = `Act as a supportive pronunciation coach for ${language}. The learner was asked to say: "${targetText}". Listen to the attached recording. Return JSON with transcript (what you heard), score (integer 0-100), feedback (two short sentences), strengths (array of up to 2 strings), and practiceTip (one short actionable tip). If the audio is silent or unclear, score below 30 and say so. This is a coaching estimate, not a clinical or certified assessment.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: audioBase64 } }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
  if (!response.ok) return res.status(502).json({ error: 'AI pronunciation service error', status: response.status });
  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '{}';
  let assessment;
  try { assessment = JSON.parse(responseText); } catch { assessment = { transcript: '', score: 0, feedback: responseText, strengths: [], practiceTip: 'Listen and try again slowly.' }; }
  assessment.score = Math.max(0, Math.min(100, Number(assessment.score) || 0));
  try {
    const db = await database();
    await db.collection('pronunciation_assessments').insertOne({
      deviceUserId: String(deviceUserId ?? 'anonymous'), language, targetText, assessment, createdAt: new Date(),
    });
  } catch (error) {
    console.warn('Pronunciation result was not logged to MongoDB:', error instanceof Error ? error.message : error);
  }
  return res.json(assessment);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error' });
});

const host = hasApiToken ? '0.0.0.0' : '127.0.0.1';
const server = app.listen(port, host, () => {
  console.log(`Lipi backend listening on http://${host}:${port} using MongoDB database ${databaseName}`);
});

async function shutdown() {
  server.close();
  await client.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
