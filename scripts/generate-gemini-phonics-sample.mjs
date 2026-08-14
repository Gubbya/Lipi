import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const envText = await fs.readFile(path.join(projectRoot, 'server', '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
);

const geminiApiKey = Object.entries(env).find(([key]) => key.toUpperCase() === 'GEMINI_API_KEY')?.[1];

if (!geminiApiKey || geminiApiKey.includes('YOUR_')) {
  throw new Error('GEMINI_API_KEY is not configured in server/.env');
}

const model = 'gemini-3.1-flash-tts-preview';
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: 'Speak as a warm, lively female phonics teacher for young children. Use a clear rhythmic call-and-response cadence, happy energy, careful articulation, and a gentle sing-song quality. Keep it original and do not imitate any real performer. Say: A! A says ah, ah, ah. A is for apple. Apple! A! Now you say it: ah, ah, apple!',
        }],
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Leda' } },
        },
      },
    }),
  },
);

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Gemini speech generation failed (${response.status}): ${body.slice(0, 500)}`);
}

const result = await response.json();
const inlineData = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
if (!inlineData?.data) throw new Error('Gemini returned no audio data');

const pcm = Buffer.from(inlineData.data, 'base64');
const rateMatch = String(inlineData.mimeType ?? '').match(/rate=(\d+)/i);
const sampleRate = Number(rateMatch?.[1] ?? 24000);

function createWavHeader(dataLength) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

const outputDirectory = path.join(projectRoot, 'assets', 'audio', 'samples');
await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, 'phonics-teacher-a.wav');
const audio = String(inlineData.mimeType).includes('wav') ? pcm : Buffer.concat([createWavHeader(pcm.length), pcm]);
await fs.writeFile(outputPath, audio);
console.log(`Created ${path.relative(projectRoot, outputPath)} (${sampleRate} Hz)`);
