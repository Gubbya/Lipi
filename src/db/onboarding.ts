import type { SQLiteDatabase } from 'expo-sqlite';

export interface LocalUserRow {
  id: string;
  teacher_language_id: string;
  onboarding_completed_at: string | null;
}

export interface UserLanguageRow {
  language_id: string;
  pronunciation_variant_id: string | null;
  current_level_id: string | null;
}

export async function getLocalUser(db: SQLiteDatabase) {
  return db.getFirstAsync<LocalUserRow>('SELECT id, teacher_language_id, onboarding_completed_at FROM local_user LIMIT 1');
}

export async function getSelectedLanguages(db: SQLiteDatabase, userId: string) {
  return db.getAllAsync<UserLanguageRow>('SELECT language_id, pronunciation_variant_id, current_level_id FROM user_languages WHERE user_id = ? AND status = ?', userId, 'active');
}

export async function saveTeacherLanguage(db: SQLiteDatabase, teacherLanguageId: string) {
  const existing = await getLocalUser(db);
  const now = new Date().toISOString();
  const id = existing?.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  if (existing) {
    await db.runAsync('UPDATE local_user SET teacher_language_id = ?, updated_at = ? WHERE id = ?', teacherLanguageId, now, id);
  } else {
    await db.runAsync('INSERT INTO local_user (id, teacher_language_id, created_at, updated_at) VALUES (?, ?, ?, ?)', id, teacherLanguageId, now, now);
  }
  return id;
}

export async function saveTargetLanguages(db: SQLiteDatabase, userId: string, languageIds: string[]) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const [priority, languageId] of languageIds.entries()) {
      await db.runAsync(
        `INSERT INTO user_languages (user_id, language_id, status, priority, added_at)
         VALUES (?, ?, 'active', ?, ?)
         ON CONFLICT(user_id, language_id) DO UPDATE SET status = 'active', priority = excluded.priority`,
        userId, languageId, priority, now,
      );
    }
  });
}

export async function finishOnboarding(db: SQLiteDatabase, userId: string, languageId: string, variantId: string, levelId: string) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE user_languages SET pronunciation_variant_id = ?, current_level_id = ? WHERE user_id = ? AND language_id = ?', variantId, levelId, userId, languageId);
    await db.runAsync('UPDATE local_user SET onboarding_completed_at = ?, updated_at = ? WHERE id = ?', now, now, userId);
  });
}
