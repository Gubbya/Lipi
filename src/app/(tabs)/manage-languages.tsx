import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { courseCatalog } from '@/content/course-catalog';
import { getLocalUser, getSelectedLanguages, replaceTargetLanguages } from '@/db/onboarding';
import { colors } from '@/features/onboarding/theme';

export default function ManageLanguagesScreen() {
  const db = useSQLiteContext();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const user = await getLocalUser(db);
      if (!user) return;
      const languages = await getSelectedLanguages(db, user.id);
      setSelected(new Set(languages.map((item) => item.language_id)));
    })();
  }, [db]));

  function toggle(languageId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(languageId)) next.delete(languageId);
      else next.add(languageId);
      return next;
    });
  }

  async function save() {
    if (!selected.size) return;
    setSaving(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/');
      await replaceTargetLanguages(db, user.id, [...selected]);
      router.back();
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe}><View style={styles.page}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>{selected.size} SELECTED</Text><Text style={styles.title}>Your language shelf</Text></View></View>
      <Text style={styles.subtitle}>Select as many as you like. Learn them separately and combine them in Puzzles.</Text>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {courseCatalog.map((course) => {
          const active = selected.has(course.id);
          return <Pressable key={course.id} onPress={() => toggle(course.id)} style={({ pressed }) => [styles.card, active && { borderColor: course.accentColor, backgroundColor: course.color }, pressed && styles.pressed]}><View style={[styles.mark, { backgroundColor: course.accentColor }]}><Text style={styles.markText}>{course.preview.split(' ')[0]}</Text></View><View style={styles.copy}><Text style={styles.name}>{course.name} <Text style={styles.native}>{course.nativeName !== course.name ? course.nativeName : ''}</Text></Text><Text style={styles.detail}>{course.scriptName}</Text></View><View style={[styles.check, active && { borderColor: course.accentColor, backgroundColor: course.accentColor }]}><Text style={styles.checkText}>{active ? '✓' : ''}</Text></View></Pressable>;
        })}
      </ScrollView>
      <View style={styles.footer}><Pressable disabled={!selected.size || saving} onPress={save} style={[styles.saveButton, (!selected.size || saving) && styles.disabled]}><Text style={styles.saveText}>{saving ? 'Saving…' : `Save ${selected.size} languages`}</Text><Text style={styles.saveArrow}>→</Text></Pressable></View>
    </View></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { flex: 1, paddingHorizontal: 24 }, header: { marginTop: 16, flexDirection: 'row', alignItems: 'center' }, close: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EBDD' }, closeText: { color: colors.ink, fontSize: 29, lineHeight: 31 }, headerCopy: { marginLeft: 14 }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, title: { marginTop: 3, color: colors.ink, fontSize: 25, fontWeight: '800' }, subtitle: { marginTop: 17, color: colors.muted, fontSize: 14, lineHeight: 21 }, list: { gap: 10, paddingTop: 20, paddingBottom: 22 },
  card: { minHeight: 76, padding: 12, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' }, mark: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, markText: { color: '#fff', fontSize: 18, fontWeight: '900' }, copy: { flex: 1, marginLeft: 13 }, name: { color: colors.ink, fontSize: 16, fontWeight: '800' }, native: { color: colors.muted, fontSize: 14, fontWeight: '600' }, detail: { marginTop: 4, color: colors.muted, fontSize: 11 }, check: { width: 23, height: 23, borderRadius: 8, borderWidth: 2, borderColor: '#C8CEC9', alignItems: 'center', justifyContent: 'center' }, checkText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  footer: { paddingTop: 11, paddingBottom: 22 }, saveButton: { height: 57, borderRadius: 18, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontSize: 15, fontWeight: '800' }, saveArrow: { marginLeft: 9, color: colors.gold, fontSize: 20 }, disabled: { opacity: 0.35 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
