import fs from 'node:fs/promises';
import path from 'node:path';
import { marathiCurriculum } from '../src/content/marathi-curriculum';
import { getCourse } from '../src/content/course-catalog';
import { phrasebook } from '../src/content/phrasebook';
import type { ScriptUnit } from '../src/models';

type Clip = {
  file: string;
  id: string;
  text: string;
  transcript: string;
  textKey?: string;
  unitId?: string;
};

type GeneratedManifest = Record<string, { generatedAt: string; model: string; transcript?: string; voice?: string }>;

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, 'assets', 'audio', 'mr-IN');
const manifestPath = path.join(projectRoot, 'assets', 'audio', '.gemini-generated.json');
const generatedModulePath = path.join(projectRoot, 'src', 'content', 'marathi-audio.generated.ts');
const model = 'gemini-3.1-flash-tts-preview';
const voice = 'Erinome';

const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=') || 'true'];
}));
const force = args.has('force');
const planOnly = args.has('plan');
const manifestOnly = args.has('manifest-only');
const limit = Math.max(0, Number(args.get('limit') ?? Number.POSITIVE_INFINITY));
const delayMs = Math.max(500, Number(args.get('delay') ?? 1_600));

function nativeExample(unit: ScriptUnit) {
  const example = unit.example?.split('·')[0].trim() ?? '';
  return /[\u0900-\u097F]/u.test(example) ? example : '';
}

function unitTranscript(unit: ScriptUnit) {
  const symbolLength = [...unit.symbol.replace(/[\s।.?!]/g, '')].length;
  const example = nativeExample(unit);
  if (symbolLength <= 4) return `${unit.symbol}. [short pause] ${unit.symbol}.${example ? ` ${example}.` : ''} ${unit.symbol}.`;
  return `${unit.symbol} [short pause] ${unit.symbol}`;
}

const course = getCourse('mr');
if (!course) throw new Error('Marathi course is missing');

const unitClips: Clip[] = marathiCurriculum.flatMap((lesson) => lesson.units.map((unit) => ({
  file: `${unit.id}.wav`,
  id: unit.id,
  text: unit.symbol,
  transcript: unitTranscript(unit),
  unitId: unit.id,
})));
const phraseClips: Clip[] = (phrasebook.mr ?? []).map((phrase, index) => ({
  file: `mr-phrase-${index + 1}.wav`,
  id: `mr-phrase-${index + 1}`,
  text: phrase.native,
  textKey: phrase.native,
  transcript: phrase.native.replace(/_{2,}/g, '[short pause]'),
}));
const vocabularyClips: Clip[] = course.vocabulary.map((entry) => ({
  file: `mr-vocabulary-${entry.concept}.wav`,
  id: `mr-vocabulary-${entry.concept}`,
  text: entry.native,
  textKey: entry.native,
  transcript: `${entry.native}. [short pause] ${entry.native}.`,
}));
const feedbackClips: Clip[] = [
  { file: 'mr-feedback-correct.wav', id: 'mr-feedback-correct', text: 'बरोबर! छान केले!', textKey: 'बरोबर! छान केले!', transcript: 'बरोबर! छान केले!' },
  { file: 'mr-feedback-try-again.wav', id: 'mr-feedback-try-again', text: 'पुन्हा प्रयत्न करा', textKey: 'पुन्हा प्रयत्न करा', transcript: 'पुन्हा प्रयत्न करा.' },
];
const clips = [...unitClips, ...phraseClips, ...vocabularyClips, ...feedbackClips];

async function readEnvironment() {
  const envText = await fs.readFile(path.join(projectRoot, 'server', '.env'), 'utf8');
  return Object.fromEntries(envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator).trim().toUpperCase(), line.slice(separator + 1).trim()];
    }));
}

async function readManifest(): Promise<GeneratedManifest> {
  try {
    return JSON.parse(await fs.readFile(manifestPath, 'utf8')) as GeneratedManifest;
  } catch {
    return {};
  }
}

function wavHeader(dataLength: number, sampleRate: number) {
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

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeGeneratedModule(manifest: GeneratedManifest) {
  const available: Clip[] = [];
  for (const clip of clips) {
    const manifestKey = `mr-IN/${clip.file}`;
    if (manifest[manifestKey] && await fileExists(path.join(outputDirectory, clip.file))) available.push(clip);
  }

  const unitLines = available
    .filter((clip) => clip.unitId)
    .map((clip) => `  ${JSON.stringify(clip.unitId)}: require('../../assets/audio/mr-IN/${clip.file}'),`);
  const textLines = available
    .filter((clip) => clip.textKey)
    .map((clip) => `  ${JSON.stringify(clip.textKey)}: require('../../assets/audio/mr-IN/${clip.file}'),`);
  const source = `import type { AudioSource } from 'expo-audio';\n\n// Generated by scripts/generate-gemini-marathi-audio.ts. Do not edit by hand.\nconst unitAudio: Record<string, AudioSource> = {\n${unitLines.join('\n')}\n};\nconst textAudio: Record<string, AudioSource> = {\n${textLines.join('\n')}\n};\n\nexport function getMarathiUnitAudio(unitId: string): AudioSource | null {\n  return unitAudio[unitId] ?? null;\n}\n\nexport function getMarathiTextAudio(text: string): AudioSource | null {\n  return textAudio[text.trim()] ?? null;\n}\n\nexport const marathiRecordingCount = ${available.length};\n`;
  await fs.writeFile(generatedModulePath, source);
  return available.length;
}

async function generateClip(apiKey: string, clip: Clip, attempt = 1): Promise<Buffer> {
  const prompt = [
    'Audio profile: a warm, clear native Marathi woman who teaches primary-school reading.',
    'Scene: a quiet recording studio with no music, effects, echo, or background noise.',
    'Director notes: use standard educated Marathi pronunciation, a steady teaching rhythm, precise vowels and aspiration, and short clean pauses. Do not translate, explain, spell punctuation, or add an introduction. Say only the transcript.',
    `Transcript: ${clip.transcript}`,
  ].join('\n');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < 8) {
      const retryDelay = Math.min(90_000, 4_000 * (2 ** (attempt - 1)));
      console.log(`Retrying ${clip.file} in ${retryDelay / 1000}s (${response.status})`);
      await wait(retryDelay);
      return generateClip(apiKey, clip, attempt + 1);
    }
    throw new Error(`${clip.file} failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const result = await response.json() as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] };
  const inlineData = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
  if (!inlineData?.data) {
    if (attempt < 8) {
      await wait(Math.min(90_000, 4_000 * (2 ** (attempt - 1))));
      return generateClip(apiKey, clip, attempt + 1);
    }
    throw new Error(`${clip.file} returned no audio after ${attempt} attempts`);
  }
  const pcm = Buffer.from(inlineData.data, 'base64');
  const rateMatch = String(inlineData.mimeType ?? '').match(/rate=(\d+)/i);
  const sampleRate = Number(rateMatch?.[1] ?? 24_000);
  return String(inlineData.mimeType).includes('wav') ? pcm : Buffer.concat([wavHeader(pcm.length, sampleRate), pcm]);
}

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });
  const manifest = await readManifest();
  const pending: Clip[] = [];
  for (const clip of clips) {
    if (force || !manifest[`mr-IN/${clip.file}`] || !await fileExists(path.join(outputDirectory, clip.file))) pending.push(clip);
  }
  const generatedCount = clips.length - pending.length;
  console.log(`Marathi pack: ${clips.length} clips (${unitClips.length} lesson units, ${phraseClips.length} phrases, ${vocabularyClips.length} vocabulary, ${feedbackClips.length} feedback).`);
  console.log(`Already generated: ${generatedCount}. Pending: ${pending.length}.`);
  console.log('Estimated paid-tier output cost for all clips is usually below US$2; free-tier output is free, subject to its rate limits.');

  if (planOnly || manifestOnly) {
    const mapped = await writeGeneratedModule(manifest);
    console.log(`Generated TypeScript manifest with ${mapped} available recordings.`);
    return;
  }

  const env = await readEnvironment();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_')) throw new Error('GEMINI_API_KEY is not configured in server/.env');

  const jobs = pending.slice(0, limit);
  let completed = 0;
  for (const clip of jobs) {
    const audio = await generateClip(apiKey, clip);
    await fs.writeFile(path.join(outputDirectory, clip.file), audio);
    manifest[`mr-IN/${clip.file}`] = { generatedAt: new Date().toISOString(), model, transcript: clip.transcript, voice };
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    completed += 1;
    console.log(`Generated ${clip.file} (${completed}/${jobs.length})`);
    if (completed % 10 === 0) await writeGeneratedModule(manifest);
    if (completed < jobs.length) await wait(delayMs);
  }
  const mapped = await writeGeneratedModule(manifest);
  console.log(`Finished ${completed} new recordings. ${mapped}/${clips.length} Marathi clips are bundled and mapped.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
