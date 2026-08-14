import type { SQLiteDatabase } from 'expo-sqlite';

export interface LearnerProfileRow {
  id: string;
  display_name: string;
  avatar_emoji: string;
  teacher_language_id: string;
  onboarding_completed_at: string | null;
  created_at: string;
}

export async function getProfiles(db: SQLiteDatabase) {
  return db.getAllAsync<LearnerProfileRow>(
    'SELECT id, display_name, avatar_emoji, teacher_language_id, onboarding_completed_at, created_at FROM local_user ORDER BY created_at',
  );
}

export async function getActiveProfileId(db: SQLiteDatabase) {
  const setting = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'active_user_id'");
  if (setting?.value) return setting.value;
  const first = await db.getFirstAsync<{ id: string }>('SELECT id FROM local_user ORDER BY created_at LIMIT 1');
  return first?.id ?? null;
}

export async function setActiveProfile(db: SQLiteDatabase, userId: string) {
  const exists = await db.getFirstAsync<{ id: string }>('SELECT id FROM local_user WHERE id = ?', userId);
  if (!exists) throw new Error('Learner profile not found');
  await db.runAsync(
    "INSERT INTO app_settings (key, value, updated_at) VALUES ('active_user_id', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    userId,
    new Date().toISOString(),
  );
}

export async function createProfile(db: SQLiteDatabase, displayName: string, teacherLanguageId: string) {
  const now = new Date().toISOString();
  const id = `learner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const avatars = ['🌱', '🦊', '🐼', '🦉', '🐯', '🌻'];
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM local_user');
  const avatar = avatars[(count?.count ?? 0) % avatars.length];
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO local_user (id, teacher_language_id, onboarding_completed_at, created_at, updated_at, display_name, avatar_emoji) VALUES (?, ?, NULL, ?, ?, ?, ?)',
      id,
      teacherLanguageId,
      now,
      now,
      displayName.trim() || 'Learner',
      avatar,
    );
    await db.runAsync(
      "INSERT INTO app_settings (key, value, updated_at) VALUES ('active_user_id', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      id,
      now,
    );
  });
  return id;
}

export async function updateProfile(db: SQLiteDatabase, userId: string, displayName: string, avatarEmoji: string) {
  await db.runAsync(
    'UPDATE local_user SET display_name = ?, avatar_emoji = ?, updated_at = ? WHERE id = ?',
    displayName.trim() || 'Learner',
    avatarEmoji || '🌱',
    new Date().toISOString(),
    userId,
  );
}
