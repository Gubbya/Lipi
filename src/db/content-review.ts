import type { SQLiteDatabase } from 'expo-sqlite';

export type ContentReviewStatus = 'needs-review' | 'in-review' | 'approved';

export interface ContentReviewRow {
  language_id: string;
  status: ContentReviewStatus;
  notes: string;
  updated_at: string;
}

export async function getContentReview(db: SQLiteDatabase, userId: string, languageId: string) {
  return db.getFirstAsync<ContentReviewRow>(
    'SELECT language_id, status, notes, updated_at FROM content_reviews WHERE user_id = ? AND language_id = ?',
    userId,
    languageId,
  );
}

export async function saveContentReview(db: SQLiteDatabase, userId: string, languageId: string, status: ContentReviewStatus, notes: string) {
  await db.runAsync(
    `INSERT INTO content_reviews (user_id, language_id, status, notes, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, language_id) DO UPDATE SET status = excluded.status, notes = excluded.notes, updated_at = excluded.updated_at`,
    userId,
    languageId,
    status,
    notes,
    new Date().toISOString(),
  );
}
