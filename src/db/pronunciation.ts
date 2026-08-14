import type { SQLiteDatabase } from 'expo-sqlite';

export interface PronunciationAttemptInput {
  userId: string;
  languageId: string;
  unitId: string | null;
  targetText: string;
  recordingUri: string | null;
  durationMs: number | null;
  selfScore: number | null;
  aiScore?: number | null;
  transcript?: string | null;
  feedback?: string | null;
}

export async function savePronunciationAttempt(db: SQLiteDatabase, input: PronunciationAttemptInput) {
  const id = `pronunciation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.runAsync(
    `INSERT INTO pronunciation_attempts (id, user_id, language_id, unit_id, target_text, recording_uri, duration_ms, self_score, ai_score, transcript, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.userId,
    input.languageId,
    input.unitId,
    input.targetText,
    input.recordingUri,
    input.durationMs,
    input.selfScore,
    input.aiScore ?? null,
    input.transcript ?? null,
    input.feedback ?? null,
    new Date().toISOString(),
  );
  return id;
}

export async function getPronunciationStats(db: SQLiteDatabase, userId: string) {
  const row = await db.getFirstAsync<{ attempts: number; average_score: number | null }>(
    'SELECT COUNT(*) AS attempts, AVG(COALESCE(ai_score, self_score)) AS average_score FROM pronunciation_attempts WHERE user_id = ?',
    userId,
  );
  return { attempts: row?.attempts ?? 0, averageScore: row?.average_score ?? null };
}
