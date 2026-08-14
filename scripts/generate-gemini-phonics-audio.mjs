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
      return [line.slice(0, separator).trim().toUpperCase(), line.slice(separator + 1).trim()];
    }),
);

const apiKey = env.GEMINI_API_KEY;
if (!apiKey || apiKey.includes('YOUR_')) throw new Error('GEMINI_API_KEY is not configured in server/.env');

const content = JSON.parse(await fs.readFile(path.join(projectRoot, 'src', 'content', 'packages', 'english.json'), 'utf8'));
const model = 'gemini-3.1-flash-tts-preview';
const manifestPath = path.join(projectRoot, 'assets', 'audio', '.gemini-generated.json');
let generatedManifest = {};
try {
  generatedManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
} catch {
  generatedManifest = {};
}
const variants = [
  { directory: 'en-US', accent: 'General American English' },
  { directory: 'en-GB', accent: 'Modern standard British English' },
];

const clips = [
  ...content.units.map((unit) => ({ file: `${unit.id}.wav`, text: unit.speechCue ?? unit.displayName, kind: 'teaching' })),
  ...content.activities.map((activity) => ({ file: `${activity.id}-prompt.wav`, text: activity.prompt, kind: 'question' })),
  { file: 'feedback-correct.wav', text: 'Correct! Well done!', kind: 'feedback' },
  { file: 'feedback-try-again.wav', text: 'Listen once more, and try again.', kind: 'feedback' },
];

function wavHeader(dataLength, sampleRate) {
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

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function generateClip(variant, clip, attempt = 1) {
  const direction = clip.kind === 'teaching'
    ? `Use clear rhythmic repetition and a gentle sing-song cadence. Make the letter sound and example words especially distinct.`
    : clip.kind === 'question'
      ? `Ask the question slowly, brightly, and clearly, then leave a natural pause for the child to answer.`
      : `Use short, encouraging, positive classroom feedback.`;
  const prompt = `Speak as a warm, lively female phonics teacher for young children in ${variant.accent}. Use happy energy and careful articulation. ${direction} Keep the performance original and do not imitate any real person or copyrighted song. Say exactly this learning content: ${clip.text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Leda' } } },
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < 7) {
      const delay = Math.min(60_000, 4_000 * (2 ** (attempt - 1)));
      console.log(`Retrying ${variant.directory}/${clip.file} in ${delay / 1000}s (${response.status})`);
      await wait(delay);
      return generateClip(variant, clip, attempt + 1);
    }
    throw new Error(`${variant.directory}/${clip.file} failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  const result = await response.json();
  const inlineData = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
  if (!inlineData?.data) {
    if (attempt < 7) {
      const delay = Math.min(60_000, 4_000 * (2 ** (attempt - 1)));
      console.log(`Retrying ${variant.directory}/${clip.file} in ${delay / 1000}s (empty audio)`);
      await wait(delay);
      return generateClip(variant, clip, attempt + 1);
    }
    throw new Error(`${variant.directory}/${clip.file} returned no audio after ${attempt} attempts`);
  }
  const pcm = Buffer.from(inlineData.data, 'base64');
  const rateMatch = String(inlineData.mimeType ?? '').match(/rate=(\d+)/i);
  const sampleRate = Number(rateMatch?.[1] ?? 24000);
  const audio = String(inlineData.mimeType).includes('wav') ? pcm : Buffer.concat([wavHeader(pcm.length, sampleRate), pcm]);
  const outputPath = path.join(projectRoot, 'assets', 'audio', variant.directory, clip.file);
  await fs.writeFile(outputPath, audio);
  generatedManifest[`${variant.directory}/${clip.file}`] = { model, generatedAt: new Date().toISOString() };
  await fs.writeFile(manifestPath, `${JSON.stringify(generatedManifest, null, 2)}\n`);
  console.log(`Generated ${variant.directory}/${clip.file}`);
}

const jobs = variants.flatMap((variant) => clips.map((clip) => ({ variant, clip })));
let nextJob = 0;
let completed = 0;

async function worker() {
  while (nextJob < jobs.length) {
    const job = jobs[nextJob++];
    const manifestKey = `${job.variant.directory}/${job.clip.file}`;
    if (generatedManifest[manifestKey]) {
      completed += 1;
      console.log(`Already generated ${manifestKey} (${completed}/${jobs.length})`);
      continue;
    }
    await generateClip(job.variant, job.clip);
    completed += 1;
    console.log(`Progress ${completed}/${jobs.length}`);
    await wait(1_500);
  }
}

await worker();
console.log(`Finished ${jobs.length} expressive offline phonics recordings.`);
