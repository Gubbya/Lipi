import type { SQLiteDatabase } from 'expo-sqlite';
import { migration001 } from './migrations/001_initial';
import { migration002 } from './migrations/002_lesson_completions';
import { migration003 } from './migrations/003_practice_sessions';

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((result?.user_version ?? 0) < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration001);
      await db.execAsync('PRAGMA user_version = 1');
    });
  }
  if ((result?.user_version ?? 0) < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration002);
      await db.execAsync('PRAGMA user_version = 2');
    });
  }
  if ((result?.user_version ?? 0) < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration003);
      await db.execAsync('PRAGMA user_version = 3');
    });
  }
}
