import type { SQLiteDatabase } from 'expo-sqlite';
import { migration001 } from './migrations/001_initial';

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((result?.user_version ?? 0) < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration001);
      await db.execAsync('PRAGMA user_version = 1');
    });
  }
}
