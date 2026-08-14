import type { SQLiteDatabase } from 'expo-sqlite';
import { authorizedFetch } from './app-config';

const syncTables = [
  'user_languages',
  'unit_mastery',
  'attempts',
  'lesson_completions',
  'practice_sessions',
  'review_cards',
  'pronunciation_attempts',
  'tutor_messages',
  'content_reviews',
] as const;

export interface ProgressSnapshot {
  schemaVersion: 1;
  exportedAt: string;
  profile: Record<string, unknown> | null;
  tables: Record<(typeof syncTables)[number], Record<string, unknown>[]>;
}

export async function exportProgressSnapshot(db: SQLiteDatabase, userId: string): Promise<ProgressSnapshot> {
  const profile = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT id, teacher_language_id, onboarding_completed_at, created_at, updated_at, display_name, avatar_emoji FROM local_user WHERE id = ?',
    userId,
  );
  const entries = await Promise.all(syncTables.map(async (table) => {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} WHERE user_id = ?`, userId);
    if (table === 'pronunciation_attempts') rows.forEach((row) => { delete row.recording_uri; });
    return [table, rows] as const;
  }));
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: profile ?? null,
    tables: Object.fromEntries(entries) as ProgressSnapshot['tables'],
  };
}

async function insertRows(db: SQLiteDatabase, table: string, rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const columns = Object.keys(row);
    if (!columns.length) continue;
    const placeholders = columns.map(() => '?').join(', ');
    const updates = columns.filter((column) => !['id', 'user_id', 'language_id', 'unit_id', 'skill', 'level_id'].includes(column))
      .map((column) => `${column} = excluded.${column}`).join(', ');
    const conflict = updates ? ` ON CONFLICT DO UPDATE SET ${updates}` : ' ON CONFLICT DO NOTHING';
    await db.runAsync(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})${conflict}`,
      ...columns.map((column) => row[column] as string | number | null),
    );
  }
}

export async function importProgressSnapshot(db: SQLiteDatabase, userId: string, snapshot: ProgressSnapshot) {
  if (snapshot?.schemaVersion !== 1 || !snapshot.tables) throw new Error('Unsupported cloud snapshot');
  await db.withTransactionAsync(async () => {
    if (snapshot.profile?.id === userId) {
      await db.runAsync(
        'UPDATE local_user SET teacher_language_id = ?, onboarding_completed_at = ?, display_name = ?, avatar_emoji = ?, updated_at = ? WHERE id = ?',
        String(snapshot.profile.teacher_language_id ?? 'en'),
        snapshot.profile.onboarding_completed_at as string | null,
        String(snapshot.profile.display_name ?? 'Learner'),
        String(snapshot.profile.avatar_emoji ?? '🌱'),
        new Date().toISOString(),
        userId,
      );
    }
    for (const table of syncTables) {
      const safeRows = (snapshot.tables[table] ?? []).filter((row) => row.user_id === userId);
      await insertRows(db, table, safeRows);
    }
  });
}

async function logSync(db: SQLiteDatabase, userId: string, direction: 'upload' | 'download', status: 'success' | 'failed', detail: string) {
  await db.runAsync(
    'INSERT INTO sync_history (id, user_id, direction, status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    direction,
    status,
    detail,
    new Date().toISOString(),
  );
}

export async function uploadProgress(db: SQLiteDatabase, userId: string) {
  try {
    const snapshot = await exportProgressSnapshot(db, userId);
    const result = await authorizedFetch(`/api/progress/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify(snapshot) });
    await logSync(db, userId, 'upload', 'success', result.updatedAt ?? 'Uploaded');
    return result;
  } catch (error) {
    await logSync(db, userId, 'upload', 'failed', error instanceof Error ? error.message : 'Upload failed');
    throw error;
  }
}

export async function downloadProgress(db: SQLiteDatabase, userId: string) {
  try {
    const result = await authorizedFetch(`/api/progress/${encodeURIComponent(userId)}`);
    const snapshot = result.payload as ProgressSnapshot;
    await importProgressSnapshot(db, userId, snapshot);
    await logSync(db, userId, 'download', 'success', result.updatedAt ?? 'Downloaded');
    return result;
  } catch (error) {
    await logSync(db, userId, 'download', 'failed', error instanceof Error ? error.message : 'Download failed');
    throw error;
  }
}

export async function getLastSync(db: SQLiteDatabase, userId: string) {
  return db.getFirstAsync<{ direction: string; status: string; detail: string | null; created_at: string }>(
    'SELECT direction, status, detail, created_at FROM sync_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    userId,
  );
}
