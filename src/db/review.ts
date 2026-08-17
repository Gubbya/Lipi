import type { SQLiteDatabase } from 'expo-sqlite';
import type { Skill } from '@/models';

export interface ReviewCardRow {
  user_id: string;
  language_id: string;
  unit_id: string;
  skill: Skill;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  due_at: string;
  last_score: number | null;
  last_reviewed_at: string | null;
}

function nextSchedule(card: ReviewCardRow | null, score: number) {
  const learningIntervals = [1, 3, 7, 14, 30];
  const quality = Math.max(0, Math.min(5, Math.round(score / 20)));
  const previousEase = card?.ease_factor ?? 2.5;
  const ease = Math.max(1.3, previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  let repetitions = card?.repetition_count ?? 0;
  let interval = card?.interval_days ?? 0;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    interval = learningIntervals[repetitions - 1] ?? Math.max(1, Math.round(interval * ease));
  }
  return { ease, repetitions, interval };
}

export async function scheduleReview(db: SQLiteDatabase, userId: string, languageId: string, unitId: string, skill: Skill, score: number) {
  const current = await db.getFirstAsync<ReviewCardRow>(
    'SELECT * FROM review_cards WHERE user_id = ? AND unit_id = ? AND skill = ?',
    userId,
    unitId,
    skill,
  );
  const schedule = nextSchedule(current, score);
  const now = new Date();
  const dueAt = new Date(now.getTime() + schedule.interval * 86_400_000).toISOString();
  await db.runAsync(
    `INSERT INTO review_cards (user_id, language_id, unit_id, skill, ease_factor, interval_days, repetition_count, due_at, last_score, last_reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, unit_id, skill) DO UPDATE SET language_id = excluded.language_id, ease_factor = excluded.ease_factor, interval_days = excluded.interval_days, repetition_count = excluded.repetition_count, due_at = excluded.due_at, last_score = excluded.last_score, last_reviewed_at = excluded.last_reviewed_at`,
    userId,
    languageId,
    unitId,
    skill,
    schedule.ease,
    schedule.interval,
    schedule.repetitions,
    dueAt,
    score,
    now.toISOString(),
  );
}

export async function seedReviewCard(db: SQLiteDatabase, userId: string, languageId: string, unitId: string, skill: Skill = 'recognition') {
  await db.runAsync(
    `INSERT OR IGNORE INTO review_cards (user_id, language_id, unit_id, skill, due_at)
     VALUES (?, ?, ?, ?, ?)`,
    userId,
    languageId,
    unitId,
    skill,
    new Date().toISOString(),
  );
}

export async function getDueReviews(db: SQLiteDatabase, userId: string, limit = 20, skills: Skill[] = []) {
  const skillFilter = skills.length ? ` AND skill IN (${skills.map(() => '?').join(', ')})` : '';
  return db.getAllAsync<ReviewCardRow>(
    `SELECT * FROM review_cards WHERE user_id = ? AND due_at <= ?${skillFilter} ORDER BY due_at LIMIT ?`,
    userId,
    new Date().toISOString(),
    ...skills,
    limit,
  );
}

export async function getReviewSummary(db: SQLiteDatabase, userId: string) {
  const now = new Date().toISOString();
  const due = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM review_cards WHERE user_id = ? AND due_at <= ?', userId, now);
  const total = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM review_cards WHERE user_id = ?', userId);
  return { due: due?.count ?? 0, total: total?.count ?? 0 };
}
