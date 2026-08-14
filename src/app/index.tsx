import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { colors } from '@/features/onboarding/theme';

export default function AppEntry() {
  const db = useSQLiteContext();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function routeFromSavedState() {
      try {
        const user = await getLocalUser(db);
        if (!active) return;
        if (!user) return router.replace('/(onboarding)/teacher-language');
        if (user.onboarding_completed_at) return router.replace('/(tabs)/learn');
        const languages = await getSelectedLanguages(db, user.id);
        if (!active) return;
        if (languages.length === 0) return router.replace('/(onboarding)/target-languages');
        return router.replace('/(onboarding)/pronunciation');
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to open Lipi');
      }
    }
    routeFromSavedState();
    return () => { active = false; };
  }, [db]);

  return (
    <View style={styles.container}>
      <View style={styles.mark}><Text style={styles.markText}>लि</Text></View>
      <Text style={styles.logo}>Lipi</Text>
      <Text style={styles.tagline}>Language, made familiar.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.ink} style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  mark: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  markText: { color: '#fff', fontSize: 33, fontWeight: '800' },
  logo: { marginTop: 18, color: colors.ink, fontSize: 38, fontWeight: '800', letterSpacing: -1.5 },
  tagline: { marginTop: 5, color: colors.muted, fontSize: 15 },
  loader: { marginTop: 30 },
  error: { marginTop: 24, color: '#A43B31', paddingHorizontal: 30, textAlign: 'center' },
});
