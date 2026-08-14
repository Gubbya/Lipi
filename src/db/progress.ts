import type { SQLiteDatabase } from 'expo-sqlite';
import { assertContentReference } from '@/content';
import type { Attempt, UnitMastery } from '@/models';

export async function recordAttempt(db: SQLiteDatabase, attempt: Attempt) {
  assertContentReference(attempt.languageId, attempt.unitId, attempt.activityId);
  await db.runAsync(
    `INSERT INTO attempts (id, user_id, activity_id, language_id, unit_id, skill, correct, score, user_answer, expected_answer, duration_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    attempt.id, attempt.userId, attempt.activityId, attempt.languageId, attempt.unitId, attempt.skill,
    attempt.correct ? 1 : 0, attempt.score, attempt.userAnswer, attempt.expectedAnswer, attempt.durationMs, attempt.createdAt,
  );
}

export async function saveUnitMastery(db: SQLiteDatabase, languageId: string, mastery: UnitMastery) {
  assertContentReference(languageId, mastery.unitId);
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO unit_mastery (user_id, unit_id, recognition, listening, pronunciation, writing, recall, total_attempts, correct_attempts, streak_correct, last_reviewed_at, next_review_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, unit_id) DO UPDATE SET recognition=excluded.recognition, listening=excluded.listening, pronunciation=excluded.pronunciation, writing=excluded.writing, recall=excluded.recall, total_attempts=excluded.total_attempts, correct_attempts=excluded.correct_attempts, streak_correct=excluded.streak_correct, last_reviewed_at=excluded.last_reviewed_at, next_review_at=excluded.next_review_at, updated_at=excluded.updated_at`,
    mastery.userId, mastery.unitId, mastery.recognition, mastery.listening, mastery.pronunciation, mastery.writing,
    mastery.recall, mastery.totalAttempts, mastery.correctAttempts, mastery.streakCorrect, mastery.lastReviewedAt, mastery.nextReviewAt, updatedAt,
  );
}
