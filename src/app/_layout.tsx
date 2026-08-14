import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrateDatabase } from '@/db/migrate';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="language_engine.db" onInit={migrateDatabase}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </SQLiteProvider>
  );
}
