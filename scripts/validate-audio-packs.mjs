import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const audioRoot = path.join(projectRoot, 'assets', 'audio');
const failures = [];

async function validateDirectory(locale) {
  const directory = path.join(audioRoot, locale);
  let files = [];
  try {
    files = (await fs.readdir(directory)).filter((file) => file.endsWith('.wav'));
  } catch {
    failures.push(`${locale}: directory missing`);
    return { bytes: 0, count: 0 };
  }
  let bytes = 0;
  for (const file of files) {
    const filePath = path.join(directory, file);
    const data = await fs.readFile(filePath);
    bytes += data.length;
    if (data.length < 48 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WAVE') failures.push(`${locale}/${file}: invalid WAV`);
  }
  return { bytes, count: files.length };
}

for (const locale of ['en-US', 'en-GB', 'mr-IN']) {
  const result = await validateDirectory(locale);
  console.log(`${locale}: ${result.count} WAV files, ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
}

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

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Audio pack validation passed.');
}
