import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContentPackage } from '@/content';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { colors } from '@/features/onboarding/theme';

const content = getContentPackage('en');

export default function LearnScreen() {
  const db = useSQLiteContext();
  const [variant, setVariant] = useState('English');

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const user = await getLocalUser(db);
      if (!user?.onboarding_completed_at) return router.replace('/');
      const languages = await getSelectedLanguages(db, user.id);
      const selectedVariant = content.language.pronunciationVariants.find((item) => item.id === languages[0]?.pronunciation_variant_id);
      if (active) setVariant(selectedVariant?.name ?? content.language.name);
    })();
    return () => { active = false; };
  }, [db]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.kicker}>LISTEN • REPEAT • RECOGNIZE</Text><Text style={styles.title}>Build English from its sounds.</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>लि</Text></View>
        </View>

        <View style={styles.courseCard}>
          <View style={styles.courseTop}><View style={styles.languagePill}><Text style={styles.languagePillText}>EN</Text></View><Text style={styles.courseLabel}>YOUR ACTIVE COURSE</Text></View>
          <Text style={styles.courseTitle}>{variant}</Text>
          <Text style={styles.courseSub}>{content.levels.length} lessons · {content.units.length} letters and sound patterns</Text>
          <View style={styles.progress}><View style={styles.progressFill} /></View>
        </View>

        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Phonics path</Text><Text style={styles.count}>{content.levels.length} lessons</Text></View>
        <View style={styles.lessonList}>
          {content.levels.map((level, index) => {
            const preview = level.unitIds.slice(0, 4).map((id) => content.units.find((unit) => unit.id === id)?.symbol.split(' ')[0]).join('  ');
            return (
              <Pressable
                key={level.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/(tabs)/lesson/[levelId]', params: { levelId: level.id } })}
                style={({ pressed }) => [styles.lessonCard, pressed && styles.buttonPressed]}
              >
                <View style={[styles.lessonNumber, index > 4 && styles.lessonNumberPhonics]}><Text style={styles.lessonNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                <View style={styles.lessonCopyWrap}>
                  <Text style={styles.lessonFocus}>{level.focus}</Text>
                  <Text style={styles.lessonTitle}>{level.title}</Text>
                  <Text style={styles.lessonCopy}>{level.description}</Text>
                  <Text style={styles.preview}>{preview}{level.unitIds.length > 4 ? '  …' : ''}</Text>
                </View>
                <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.offline}><Text style={styles.offlineIcon}>⌁</Text><View><Text style={styles.offlineTitle}>Audio-ready on this device</Text><Text style={styles.offlineCopy}>Tap the speaker in a lesson to hear every sound and example.</Text></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 24, paddingBottom: 45 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 14 }, kicker: { color: colors.mintDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { marginTop: 8, maxWidth: 280, color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '4deg' }] }, avatarText: { color: '#fff', fontSize: 19, fontWeight: '800' },
  courseCard: { marginTop: 30, padding: 22, borderRadius: 26, backgroundColor: colors.ink }, courseTop: { flexDirection: 'row', alignItems: 'center' },
  languagePill: { width: 35, height: 26, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }, languagePillText: { color: colors.ink, fontSize: 11, fontWeight: '900' }, courseLabel: { marginLeft: 10, color: '#BBD1C9', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  courseTitle: { marginTop: 20, color: '#fff', fontSize: 25, fontWeight: '800' }, courseSub: { marginTop: 5, color: '#BBD1C9', fontSize: 13 }, progress: { height: 6, marginTop: 22, borderRadius: 3, backgroundColor: '#34534D' }, progressFill: { width: '3%', height: 6, borderRadius: 3, backgroundColor: colors.coral },
  sectionRow: { marginTop: 30, marginBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' }, count: { color: colors.muted, fontSize: 12, fontWeight: '600' }, lessonList: { gap: 12 },
  lessonCard: { minHeight: 126, flexDirection: 'row', alignItems: 'center', padding: 17, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' }, lessonNumber: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint }, lessonNumberPhonics: { backgroundColor: colors.coralSoft }, lessonNumberText: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  lessonCopyWrap: { flex: 1, marginHorizontal: 14 }, lessonFocus: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }, lessonTitle: { marginTop: 4, color: colors.ink, fontSize: 17, fontWeight: '800' }, lessonCopy: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 16 }, preview: { marginTop: 7, color: colors.mintDark, fontSize: 13, fontWeight: '800' },
  play: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft }, playText: { marginLeft: 2, color: colors.coral, fontSize: 12 }, buttonPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  offline: { marginTop: 18, padding: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 19, backgroundColor: '#F1EBDD' }, offlineIcon: { width: 34, color: colors.mintDark, fontSize: 28 }, offlineTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, offlineCopy: { maxWidth: 285, marginTop: 2, color: colors.muted, fontSize: 11, lineHeight: 16 },
});
