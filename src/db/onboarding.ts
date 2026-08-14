import type { SQLiteDatabase } from 'expo-sqlite';

export interface LocalUserRow {
  id: string;
  teacher_language_id: string;
  onboarding_completed_at: string | null;
  display_name: string;
  avatar_emoji: string;
}

export interface UserLanguageRow {
  language_id: string;
  pronunciation_variant_id: string | null;
  current_level_id: string | null;
}

export async function getLocalUser(db: SQLiteDatabase) {
  const active = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'active_user_id'");
  if (active?.value) {
    const profile = await db.getFirstAsync<LocalUserRow>(
      'SELECT id, teacher_language_id, onboarding_completed_at, display_name, avatar_emoji FROM local_user WHERE id = ?',
      active.value,
    );
    if (profile) return profile;
  }
  return db.getFirstAsync<LocalUserRow>(
    'SELECT id, teacher_language_id, onboarding_completed_at, display_name, avatar_emoji FROM local_user ORDER BY created_at LIMIT 1',
  );
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
    await db.withTransactionAsync(async () => {
      await db.runAsync('INSERT INTO local_user (id, teacher_language_id, created_at, updated_at, display_name, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?)', id, teacherLanguageId, now, now, 'Learner', '🌱');
      await db.runAsync(
        "INSERT INTO app_settings (key, value, updated_at) VALUES ('active_user_id', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        id,
        now,
      );
    });
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

export interface OnboardingCourseSelection {
  languageId: string;
  pronunciationVariantId: string | null;
  currentLevelId: string | null;
}

export async function replaceTargetLanguages(db: SQLiteDatabase, userId: string, languageIds: string[]) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE user_languages SET status = 'inactive' WHERE user_id = ?", userId);
    for (const [priority, languageId] of languageIds.entries()) {
      await db.runAsync(
        `INSERT INTO user_languages (user_id, language_id, status, priority, added_at)
         VALUES (?, ?, 'active', ?, ?)
         ON CONFLICT(user_id, language_id) DO UPDATE SET status = 'active', priority = excluded.priority`,
        userId, languageId, priority, now,
      );
    }
    await db.runAsync('UPDATE local_user SET updated_at = ? WHERE id = ?', now, userId);
  });
}

export async function finishOnboarding(db: SQLiteDatabase, userId: string, selections: OnboardingCourseSelection[]) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const selection of selections) {
      await db.runAsync(
        'UPDATE user_languages SET pronunciation_variant_id = ?, current_level_id = ? WHERE user_id = ? AND language_id = ?',
        selection.pronunciationVariantId, selection.currentLevelId, userId, selection.languageId,
      );
    }
    await db.runAsync('UPDATE local_user SET onboarding_completed_at = ?, updated_at = ? WHERE id = ?', now, now, userId);
  });
}
