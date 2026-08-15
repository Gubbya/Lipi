import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const audioRoot = path.join(projectRoot, 'assets', 'audio');
const failures = [];
const expectedCounts = {
  'en-US': 70, 'en-GB': 70, 'mr-IN': 712,
  'hi-IN': 131, 'fr-FR': 108, 'es-ES': 106, 'it-IT': 105, 'de-DE': 110,
  'ru-RU': 112, 'ar-SA': 110, 'zh-CN': 142, 'ja-JP': 181, 'ko-KR': 121,
  'kn-IN': 133, 'pa-IN': 115, 'gu-IN': 130, 'te-IN': 135, 'sa-IN': 135,
};

async function validateDirectory(locale) {
  const directory = path.join(audioRoot, locale);
  let files = [];
  try {
    files = (await fs.readdir(directory)).filter((file) => /\.(wav|mp3)$/i.test(file));
  } catch {
    failures.push(`${locale}: directory missing`);
    return { bytes: 0, count: 0 };
  }
  let bytes = 0;
  for (const file of files) {
    const filePath = path.join(directory, file);
    const data = await fs.readFile(filePath);
    bytes += data.length;
    if (file.endsWith('.wav')) {
      if (data.length < 48 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WAVE') failures.push(`${locale}/${file}: invalid WAV`);
    } else {
      const hasId3 = data.toString('ascii', 0, 3) === 'ID3';
      const hasFrameSync = data[0] === 0xff && (data[1] & 0xe0) === 0xe0;
      if (data.length < 1_024 || (!hasId3 && !hasFrameSync)) failures.push(`${locale}/${file}: invalid MP3`);
    }
  }
  return { bytes, count: files.length };
}

let totalFiles = 0;
for (const [locale, expectedCount] of Object.entries(expectedCounts)) {
  const result = await validateDirectory(locale);
  totalFiles += result.count;
  console.log(`${locale}: ${result.count} audio files, ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
  if (result.count !== expectedCount) failures.push(`${locale}: expected ${expectedCount} files, found ${result.count}`);
}
console.log(`All locale packs: ${totalFiles} audio files`);

const generatedModule = await fs.readFile(path.join(projectRoot, 'src', 'content', 'marathi-audio.generated.ts'), 'utf8');
const requires = [...generatedModule.matchAll(/require\('\.\.\/\.\.\/assets\/audio\/mr-IN\/([^']+)'\)/g)].map((match) => match[1]);
for (const file of requires) {
  try {
    await fs.access(path.join(audioRoot, 'mr-IN', file));
  } catch {
    failures.push(`Generated manifest points to missing mr-IN/${file}`);
  }
}
console.log(`Marathi static mappings: ${requires.length}`);
if (requires.length !== 712) failures.push(`Marathi static mappings: expected 712, found ${requires.length}`);

for (const [moduleName, expectedMappings] of [['multilingual-audio.generated.ts', 1874], ['english-content-audio.generated.ts', 18]]) {
  const moduleSource = await fs.readFile(path.join(projectRoot, 'src', 'content', moduleName), 'utf8');
  const moduleRequires = [...moduleSource.matchAll(/require\('\.\.\/\.\.\/assets\/audio\/([^/]+)\/([^']+)'\)/g)];
  for (const match of moduleRequires) {
    try {
      await fs.access(path.join(audioRoot, match[1], match[2]));
    } catch {
      failures.push(`${moduleName} points to missing ${match[1]}/${match[2]}`);
    }
  }
  console.log(`${moduleName}: ${moduleRequires.length} static mappings`);
  if (moduleRequires.length !== expectedMappings) failures.push(`${moduleName}: expected ${expectedMappings} mappings, found ${moduleRequires.length}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Audio pack validation passed.');
}
