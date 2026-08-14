import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const files = [
  'src/db/migrations/001_initial.ts',
  'src/db/migrations/002_lesson_completions.ts',
  'src/db/migrations/003_practice_sessions.ts',
  'src/db/migrations/004_learning_system.ts',
  'src/db/migrations/005_content_reviews.ts',
];

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const sql = source.match(/`([\s\S]*?)`;/)?.[1];
  if (!sql) throw new Error(`Could not read SQL from ${file}`);
  database.exec(sql);
}

const expectedTables = [
  'app_settings',
  'attempts',
  'content_reviews',
  'lesson_completions',
  'local_user',
  'practice_sessions',
  'pronunciation_attempts',
  'review_cards',
  'sync_history',
  'tutor_messages',
  'unit_mastery',
  'user_languages',
];
const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map((row) => row.name);
for (const table of expectedTables) {
  if (!tables.includes(table)) throw new Error(`Migration did not create ${table}`);
}

const now = new Date().toISOString();
database.prepare('INSERT INTO local_user (id, teacher_language_id, onboarding_completed_at, created_at, updated_at, display_name, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?, ?)')
  .run('test-user', 'en', now, now, now, 'Test learner', '🌱');
database.prepare('INSERT INTO review_cards (user_id, language_id, unit_id, skill, due_at) VALUES (?, ?, ?, ?, ?)')
  .run('test-user', 'en', 'en-letter-a', 'recognition', now);
database.prepare('INSERT INTO content_reviews (user_id, language_id, status, notes, updated_at) VALUES (?, ?, ?, ?, ?)')
  .run('test-user', 'en', 'in-review', 'test', now);

console.log(`Validated ${files.length} migrations and ${expectedTables.length} learning tables.`);
database.close();
