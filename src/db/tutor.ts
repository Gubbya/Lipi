import type { SQLiteDatabase } from 'expo-sqlite';

export interface TutorMessageRow {
  id: string;
  language_id: string;
  role: 'learner' | 'tutor';
  message: string;
  romanization: string | null;
  translation: string | null;
  created_at: string;
}

export async function saveTutorMessage(
  db: SQLiteDatabase,
  userId: string,
  languageId: string,
  role: TutorMessageRow['role'],
  message: string,
  romanization: string | null = null,
  translation: string | null = null,
) {
  await db.runAsync(
    'INSERT INTO tutor_messages (id, user_id, language_id, role, message, romanization, translation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    languageId,
    role,
    message,
    romanization,
    translation,
    new Date().toISOString(),
  );
}

export async function getTutorMessages(db: SQLiteDatabase, userId: string, languageId: string, limit = 30) {
  return db.getAllAsync<TutorMessageRow>(
    `SELECT id, language_id, role, message, romanization, translation, created_at FROM (
       SELECT id, language_id, role, message, romanization, translation, created_at
       FROM tutor_messages WHERE user_id = ? AND language_id = ? ORDER BY created_at DESC LIMIT ?
     ) ORDER BY created_at`,
    userId,
    languageId,
    limit,
  );
}

export async function clearTutorMessages(db: SQLiteDatabase, userId: string, languageId: string) {
  await db.runAsync('DELETE FROM tutor_messages WHERE user_id = ? AND language_id = ?', userId, languageId);
}
