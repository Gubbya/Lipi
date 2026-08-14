import type { SQLiteDatabase } from 'expo-sqlite';
import { assertContentReference } from '@/content';
import type { Attempt, UnitMastery } from '@/models';

export interface LessonCompletionRow {
  level_id: string;
  completion_count: number;
  best_score: number;
  last_completed_at: string;
}

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
     ON CONFLICT(user_id, unit_id) DO UPDATE SET recognition=MIN(100, unit_mastery.recognition + excluded.recognition), listening=MIN(100, unit_mastery.listening + excluded.listening), pronunciation=MIN(100, unit_mastery.pronunciation + excluded.pronunciation), writing=MIN(100, unit_mastery.writing + excluded.writing), recall=MIN(100, unit_mastery.recall + excluded.recall), total_attempts=unit_mastery.total_attempts + excluded.total_attempts, correct_attempts=unit_mastery.correct_attempts + excluded.correct_attempts, streak_correct=unit_mastery.streak_correct + excluded.streak_correct, last_reviewed_at=excluded.last_reviewed_at, next_review_at=excluded.next_review_at, updated_at=excluded.updated_at`,
    mastery.userId, mastery.unitId, mastery.recognition, mastery.listening, mastery.pronunciation, mastery.writing,
    mastery.recall, mastery.totalAttempts, mastery.correctAttempts, mastery.streakCorrect, mastery.lastReviewedAt, mastery.nextReviewAt, updatedAt,
  );
}

export async function recordLessonCompletion(db: SQLiteDatabase, userId: string, levelId: string, score: number) {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO lesson_completions (user_id, level_id, completion_count, best_score, first_completed_at, last_completed_at)
     VALUES (?, ?, 1, ?, ?, ?)
     ON CONFLICT(user_id, level_id) DO UPDATE SET
       completion_count = lesson_completions.completion_count + 1,
       best_score = MAX(lesson_completions.best_score, excluded.best_score),
       last_completed_at = excluded.last_completed_at`,
    userId, levelId, score, now, now,
  );
}

export async function getLessonCompletions(db: SQLiteDatabase, userId: string) {
  return db.getAllAsync<LessonCompletionRow>(
    'SELECT level_id, completion_count, best_score, last_completed_at FROM lesson_completions WHERE user_id = ?',
    userId,
  );
}

export async function recordPracticeSession(db: SQLiteDatabase, userId: string, languageIds: string[], score: number, total: number) {
  await db.runAsync(
    'INSERT INTO practice_sessions (id, user_id, mode, language_ids, score, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    `practice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId, 'mixed-vocabulary', JSON.stringify(languageIds), score, total, new Date().toISOString(),
  );
}
