import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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
const edgeVoice = 'mr-IN-AarohiNeural';
const execFileAsync = promisify(execFile);

const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=') || 'true'];
}));
const force = args.has('force');
const planOnly = args.has('plan');
const manifestOnly = args.has('manifest-only');
const provider = args.get('provider') === 'edge' ? 'edge' : 'gemini';
const limit = Math.max(0, Number(args.get('limit') ?? Number.POSITIVE_INFINITY));
const delayMs = Math.max(500, Number(args.get('delay') ?? 1_600));
const concurrency = Math.max(1, Math.min(8, Number(args.get('concurrency') ?? 4)));

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

function candidateFiles(clip: Clip) {
  return [clip.file, clip.file.replace(/\.wav$/i, '.mp3')];
}

async function availableFile(manifest: GeneratedManifest, clip: Clip) {
  for (const file of candidateFiles(clip)) {
    if (manifest[`mr-IN/${file}`] && await fileExists(path.join(outputDirectory, file))) return file;
  }
  return null;
}

async function writeGeneratedModule(manifest: GeneratedManifest) {
  const available: { clip: Clip; file: string }[] = [];
  for (const clip of clips) {
    const file = await availableFile(manifest, clip);
    if (file) available.push({ clip, file });
  }

  const unitLines = available
    .filter(({ clip }) => clip.unitId)
    .map(({ clip, file }) => `  ${JSON.stringify(clip.unitId)}: ${JSON.stringify(`mr-IN/${file}`)},`);
  const textLines = available
    .filter(({ clip }) => clip.textKey)
    .map(({ clip, file }) => `  ${JSON.stringify(clip.textKey)}: ${JSON.stringify(`mr-IN/${file}`)},`);
  const source = `// Generated by the Marathi audio pack script. Do not edit by hand.\n// Paths are downloaded on demand so recordings do not inflate the mobile binary.\nconst unitAudio: Record<string, string> = {\n${unitLines.join('\n')}\n};\nconst textAudio: Record<string, string> = {\n${textLines.join('\n')}\n};\n\nexport function getMarathiUnitAudioPath(unitId: string): string | null {\n  return unitAudio[unitId] ?? null;\n}\n\nexport function getMarathiTextAudioPath(text: string): string | null {\n  return textAudio[text.trim()] ?? null;\n}\n\nexport const marathiRecordingCount = ${available.length};\n`;
  await fs.writeFile(generatedModulePath, source);
  return available.length;
}

async function validateMp3(filePath: string) {
  const data = await fs.readFile(filePath);
  const hasId3 = data.toString('ascii', 0, 3) === 'ID3';
  const hasFrameSync = data[0] === 0xff && (data[1] & 0xe0) === 0xe0;
  if (data.length < 1_024 || (!hasId3 && !hasFrameSync)) throw new Error('neural voice returned invalid MP3 audio');
}

async function generateEdgeClip(clip: Clip, attempt = 1): Promise<string> {
  const file = clip.file.replace(/\.wav$/i, '.mp3');
  const filePath = path.join(outputDirectory, file);
  const transcript = clip.transcript.replace(/\[short pause\]/gi, ',').replace(/\s+/g, ' ').trim();
  try {
    await execFileAsync('python', [
      '-m', 'edge_tts',
      '--voice', edgeVoice,
      '--rate=-8%',
      '--pitch=+0Hz',
      '--text', transcript,
      '--write-media', filePath,
    ], { windowsHide: true, timeout: 90_000 });
    await validateMp3(filePath);
    return file;
  } catch (error) {
    await fs.rm(filePath, { force: true });
    if (attempt < 5) {
      await wait(Math.min(30_000, 2_000 * (2 ** (attempt - 1))));
      return generateEdgeClip(clip, attempt + 1);
    }
    throw new Error(`${file} failed after ${attempt} attempts: ${error instanceof Error ? error.message : error}`);
  }
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
    if (force || !await availableFile(manifest, clip)) pending.push(clip);
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

  if (provider === 'edge') {
    try {
      await execFileAsync('python', ['-m', 'edge_tts', '--version'], { windowsHide: true, timeout: 15_000 });
    } catch {
      throw new Error('The Edge neural voice helper is missing. Run: python -m pip install -r scripts/requirements-audio.txt');
    }

    const jobs = pending.slice(0, limit);
    let completed = 0;
    for (let offset = 0; offset < jobs.length; offset += concurrency) {
      const batch = jobs.slice(offset, offset + concurrency);
      const files = await Promise.all(batch.map((clip) => generateEdgeClip(clip)));
      batch.forEach((clip, index) => {
        const file = files[index];
        manifest[`mr-IN/${file}`] = {
          generatedAt: new Date().toISOString(),
          model: 'edge-neural-tts',
          transcript: clip.transcript,
          voice: edgeVoice,
        };
      });
      completed += batch.length;
      await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      if (completed % 20 === 0 || completed === jobs.length) await writeGeneratedModule(manifest);
      console.log(`Generated ${completed}/${jobs.length} fallback recordings`);
      if (completed < jobs.length) await wait(delayMs);
    }
    const mapped = await writeGeneratedModule(manifest);
    console.log(`Finished ${completed} new recordings. ${mapped}/${clips.length} Marathi clips are bundled and mapped.`);
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
