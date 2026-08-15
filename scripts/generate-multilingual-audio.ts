import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { courseCatalog } from '../src/content/course-catalog';
import { phrasebook } from '../src/content/phrasebook';
import type { LanguageCourse } from '../src/models';

type Provider = { kind: 'edge'; voice: string } | { kind: 'gtts'; language: string; voice: string };
type Clip = {
  course: LanguageCourse;
  file: string;
  text: string;
  transcript: string;
  fallbackTranscript?: string;
  textKey?: string;
  unitId?: string;
};
type GeneratedManifest = Record<string, { generatedAt: string; model: string; transcript: string; voice: string }>;

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();
const audioRoot = path.join(projectRoot, 'assets', 'audio');
const manifestPath = path.join(audioRoot, '.multilingual-generated.json');
const generatedModulePath = path.join(projectRoot, 'src', 'content', 'multilingual-audio.generated.ts');

const providers: Record<string, Provider> = {
  hi: { kind: 'edge', voice: 'hi-IN-SwaraNeural' },
  fr: { kind: 'edge', voice: 'fr-FR-DeniseNeural' },
  es: { kind: 'edge', voice: 'es-ES-ElviraNeural' },
  it: { kind: 'edge', voice: 'it-IT-ElsaNeural' },
  de: { kind: 'edge', voice: 'de-DE-KatjaNeural' },
  ru: { kind: 'edge', voice: 'ru-RU-SvetlanaNeural' },
  ar: { kind: 'edge', voice: 'ar-SA-ZariyahNeural' },
  zh: { kind: 'edge', voice: 'zh-CN-XiaoxiaoNeural' },
  ja: { kind: 'edge', voice: 'ja-JP-NanamiNeural' },
  ko: { kind: 'edge', voice: 'ko-KR-SunHiNeural' },
  kn: { kind: 'edge', voice: 'kn-IN-SapnaNeural' },
  pa: { kind: 'gtts', language: 'pa', voice: 'Google Punjabi' },
  gu: { kind: 'edge', voice: 'gu-IN-DhwaniNeural' },
  te: { kind: 'edge', voice: 'te-IN-ShrutiNeural' },
  // No dedicated Sanskrit voice is exposed by either provider. Swara reads
  // Devanagari clearly, but this pack still requires native-teacher review.
  sa: { kind: 'edge', voice: 'hi-IN-SwaraNeural' },
};

const feedback: Record<string, { correct: string; tryAgain: string }> = {
  hi: { correct: 'सही!', tryAgain: 'फिर से कोशिश करें।' },
  fr: { correct: 'Correct !', tryAgain: 'Essayez encore.' },
  es: { correct: '¡Correcto!', tryAgain: 'Inténtalo de nuevo.' },
  it: { correct: 'Corretto!', tryAgain: 'Prova di nuovo.' },
  de: { correct: 'Richtig!', tryAgain: 'Versuche es noch einmal.' },
  ru: { correct: 'Правильно!', tryAgain: 'Попробуйте ещё раз.' },
  ar: { correct: 'صحيح!', tryAgain: 'حاول مرة أخرى.' },
  zh: { correct: '正确！', tryAgain: '再试一次。' },
  ja: { correct: '正解です！', tryAgain: 'もう一度やってみましょう。' },
  ko: { correct: '맞아요!', tryAgain: '다시 해 보세요.' },
  kn: { correct: 'ಸರಿಯಾಗಿದೆ!', tryAgain: 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.' },
  pa: { correct: 'ਸਹੀ!', tryAgain: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' },
  gu: { correct: 'સાચું!', tryAgain: 'ફરીથી પ્રયત્ન કરો.' },
  te: { correct: 'సరైనది!', tryAgain: 'మళ్లీ ప్రయత్నించండి.' },
  sa: { correct: 'समीचीनम्!', tryAgain: 'पुनः प्रयत्नं कुरु।' },
};

// Standalone Pinyin letters are inconsistently handled by neural TTS. These
// short native examples begin or end with the intended sound and reliably
// produce clear Mandarin audio instead of English letter names.
const mandarinSoundExamples: Record<string, string> = {
  b: '波', p: '坡', m: '摸', f: '佛', d: '得', t: '特', n: '呢', l: '勒',
  g: '哥', k: '科', h: '喝', j: '鸡', q: '七', x: '西', zh: '知', ch: '吃',
  sh: '诗', r: '日', z: '资', c: '次', s: '思', y: '衣', w: '屋',
  a: '啊', o: '哦', e: '鹅', i: '衣', u: '乌', ü: '鱼', ai: '哀', ei: '欸',
  ao: '凹', ou: '欧', ia: '呀', ie: '耶', ua: '蛙', uo: '窝', an: '安', en: '恩',
  in: '音', un: '温', ün: '云', ang: '昂', eng: '鞥', ing: '英', ong: '翁',
  ian: '烟', uan: '弯', uang: '汪',
};

const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=') || 'true'];
}));
const force = args.has('force');
const planOnly = args.has('plan');
const selectedLanguage = args.get('language');
const limit = Math.max(0, Number(args.get('limit') ?? Number.POSITIVE_INFINITY));
const concurrency = Math.max(1, Math.min(8, Number(args.get('concurrency') ?? 8)));
const delayMs = Math.max(250, Number(args.get('delay') ?? 400));

const courses = courseCatalog.filter((course) => providers[course.id] && (!selectedLanguage || course.id === selectedLanguage));

function cleanTranscript(text: string) {
  return text.replace(/_{2,}/g, ',').replace(/\s*\+\s*/g, ' ').replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function clipsForCourse(course: LanguageCourse): Clip[] {
  const unitClips = course.lessons.flatMap((lesson) => lesson.units.map((unit): Clip => {
    const spokenExample = course.id === 'zh' ? mandarinSoundExamples[unit.symbol] ?? unit.symbol : unit.symbol;
    return {
      course,
      file: `${unit.id}.mp3`,
      text: unit.symbol,
      transcript: `${cleanTranscript(spokenExample)}. ${cleanTranscript(spokenExample)}.`,
      fallbackTranscript: `${cleanTranscript(unit.romanization)}. ${cleanTranscript(unit.soundHint)}.`,
      unitId: unit.id,
    };
  }));
  const phraseClips = (phrasebook[course.id] ?? []).map((phrase, index): Clip => ({
    course,
    file: `${course.id}-phrase-${index + 1}.mp3`,
    text: phrase.native,
    transcript: cleanTranscript(phrase.native),
    textKey: phrase.native,
  }));
  const vocabularyClips = course.vocabulary.map((entry): Clip => ({
    course,
    file: `${course.id}-vocabulary-${entry.concept}.mp3`,
    text: entry.native,
    transcript: `${cleanTranscript(entry.native)}. ${cleanTranscript(entry.native)}.`,
    textKey: entry.native,
  }));
  const courseFeedback = feedback[course.id];
  const feedbackClips: Clip[] = [
    { course, file: `${course.id}-feedback-correct.mp3`, text: 'Correct!', transcript: courseFeedback.correct, textKey: 'Correct!' },
    { course, file: `${course.id}-feedback-try-again.mp3`, text: 'Try again', transcript: courseFeedback.tryAgain, textKey: 'Try again' },
  ];
  return [...unitClips, ...phraseClips, ...vocabularyClips, ...feedbackClips];
}

const allCourses = courseCatalog.filter((course) => providers[course.id]);
const allClips = allCourses.flatMap(clipsForCourse);
const selectedClips = courses.flatMap(clipsForCourse);

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readManifest(): Promise<GeneratedManifest> {
  try {
    return JSON.parse(await fs.readFile(manifestPath, 'utf8')) as GeneratedManifest;
  } catch {
    return {};
  }
}

async function writeManifest(manifest: GeneratedManifest, attempt = 1): Promise<void> {
  try {
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  } catch (error) {
    if (attempt >= 6) throw error;
    await wait(250 * attempt);
    await writeManifest(manifest, attempt + 1);
  }
}

function manifestKey(clip: Clip) {
  return `${clip.course.locale}/${clip.file}`;
}

async function clipAvailable(manifest: GeneratedManifest, clip: Clip) {
  return Boolean(manifest[manifestKey(clip)] && await fileExists(path.join(audioRoot, clip.course.locale, clip.file)));
}

async function writeGeneratedModule(manifest: GeneratedManifest) {
  const unitLines: string[] = [];
  const textLines: string[] = [];
  let count = 0;
  for (const clip of allClips) {
    if (!await clipAvailable(manifest, clip)) continue;
    const asset = `require('../../assets/audio/${clip.course.locale}/${clip.file}')`;
    if (clip.unitId) unitLines.push(`  ${JSON.stringify(`${clip.course.id}:${clip.unitId}`)}: ${asset},`);
    if (clip.textKey) textLines.push(`  ${JSON.stringify(`${clip.course.id}:${clip.textKey.trim()}`)}: ${asset},`);
    count += 1;
  }
  const source = `import type { AudioSource } from 'expo-audio';\n\n// Generated by scripts/generate-multilingual-audio.ts. Do not edit by hand.\nconst unitAudio: Record<string, AudioSource> = {\n${unitLines.join('\n')}\n};\nconst textAudio: Record<string, AudioSource> = {\n${textLines.join('\n')}\n};\n\nexport function getMultilingualUnitAudio(languageId: string, unitId: string): AudioSource | null {\n  return unitAudio[\`\${languageId}:\${unitId}\`] ?? null;\n}\n\nexport function getMultilingualTextAudio(languageId: string, text: string): AudioSource | null {\n  return textAudio[\`\${languageId}:\${text.trim()}\`] ?? null;\n}\n\nexport const multilingualRecordingCount = ${count};\n`;
  await fs.writeFile(generatedModulePath, source);
  return count;
}

async function validateMp3(filePath: string) {
  const data = await fs.readFile(filePath);
  const hasId3 = data.toString('ascii', 0, 3) === 'ID3';
  const hasFrameSync = data[0] === 0xff && (data[1] & 0xe0) === 0xe0;
  if (data.length < 1_024 || (!hasId3 && !hasFrameSync)) throw new Error('provider returned invalid MP3 audio');
}

async function generateClip(clip: Clip, attempt = 1): Promise<void> {
  const provider = providers[clip.course.id];
  const outputDirectory = path.join(audioRoot, clip.course.locale);
  const filePath = path.join(outputDirectory, clip.file);
  await fs.mkdir(outputDirectory, { recursive: true });
  try {
    const transcript = attempt >= 3 && clip.fallbackTranscript ? clip.fallbackTranscript : clip.transcript;
    if (provider.kind === 'edge') {
      await execFileAsync('python', [
        '-m', 'edge_tts', '--voice', provider.voice, '--rate=-8%', '--pitch=+0Hz',
        '--text', transcript, '--write-media', filePath,
      ], { windowsHide: true, timeout: 90_000 });
    } else {
      await execFileAsync('gtts-cli', [transcript, '--lang', provider.language, '--output', filePath], { windowsHide: true, timeout: 90_000 });
    }
    await validateMp3(filePath);
  } catch (error) {
    await fs.rm(filePath, { force: true });
    if (attempt < 5) {
      await wait(Math.min(30_000, 2_000 * (2 ** (attempt - 1))));
      return generateClip(clip, attempt + 1);
    }
    throw new Error(`${clip.course.id}/${clip.file} failed after ${attempt} attempts: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  const manifest = await readManifest();
  const pending: Clip[] = [];
  for (const clip of selectedClips) if (force || !await clipAvailable(manifest, clip)) pending.push(clip);
  console.log(`Multilingual pack: ${selectedClips.length} clips across ${courses.length} courses.`);
  console.log(`Already generated: ${selectedClips.length - pending.length}. Pending: ${pending.length}.`);
  for (const course of courses) {
    const courseClips = clipsForCourse(course);
    const ready = (await Promise.all(courseClips.map((clip) => clipAvailable(manifest, clip)))).filter(Boolean).length;
    console.log(`${course.id} (${course.locale}): ${ready}/${courseClips.length} · ${providers[course.id].voice}`);
  }

  if (planOnly) {
    const mapped = await writeGeneratedModule(manifest);
    console.log(`Generated TypeScript manifest with ${mapped}/${allClips.length} available recordings.`);
    return;
  }

  try {
    await execFileAsync('python', ['-m', 'edge_tts', '--version'], { windowsHide: true, timeout: 15_000 });
    await execFileAsync('gtts-cli', ['--version'], { windowsHide: true, timeout: 15_000 });
  } catch {
    throw new Error('Audio helpers are missing. Run: python -m pip install -r scripts/requirements-audio.txt');
  }

  const jobs = pending.slice(0, limit);
  let completed = 0;
  for (let offset = 0; offset < jobs.length; offset += concurrency) {
    const batch = jobs.slice(offset, offset + concurrency);
    await Promise.all(batch.map(generateClip));
    for (const clip of batch) {
      const provider = providers[clip.course.id];
      manifest[manifestKey(clip)] = {
        generatedAt: new Date().toISOString(),
        model: provider.kind === 'edge' ? 'edge-neural-tts' : 'google-translate-tts',
        transcript: clip.transcript,
        voice: provider.voice,
      };
    }
    completed += batch.length;
    await writeManifest(manifest);
    if (completed % 40 === 0 || completed === jobs.length) await writeGeneratedModule(manifest);
    console.log(`Generated ${completed}/${jobs.length} recordings`);
    if (completed < jobs.length) await wait(delayMs);
  }
  const mapped = await writeGeneratedModule(manifest);
  console.log(`Finished ${completed} new recordings. ${mapped}/${allClips.length} multilingual clips are bundled and mapped.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
