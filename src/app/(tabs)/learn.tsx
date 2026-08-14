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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={styles.kicker}>GOOD TO SEE YOU</Text><Text style={styles.title}>Let’s learn, one sound at a time.</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>लि</Text></View></View>
        <View style={styles.courseCard}>
          <View style={styles.courseTop}><View style={styles.languagePill}><Text style={styles.languagePillText}>EN</Text></View><Text style={styles.courseLabel}>YOUR ACTIVE COURSE</Text></View>
          <Text style={styles.courseTitle}>{variant}</Text><Text style={styles.courseSub}>English Foundations · 0% complete</Text>
          <View style={styles.progress}><View style={styles.progressFill} /></View>
        </View>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Start here</Text><Text style={styles.count}>{content.units.length} letters</Text></View>
        <View style={styles.lessonCard}>
          <View style={styles.letterStack}>{content.units.map((unit, index) => <View key={unit.id} style={[styles.letter, { marginLeft: index ? -8 : 0 }]}><Text style={styles.letterText}>{unit.symbol}</Text></View>)}</View>
          <Text style={styles.lessonEyebrow}>LESSON 01</Text><Text style={styles.lessonTitle}>Meet your first letters</Text><Text style={styles.lessonCopy}>See them, hear them, and make them stick.</Text>
          <Pressable style={styles.startButton}><Text style={styles.startText}>Begin lesson</Text><Text style={styles.startArrow}>→</Text></Pressable>
        </View>
        <View style={styles.offline}><Text style={styles.offlineIcon}>⌁</Text><View><Text style={styles.offlineTitle}>Ready wherever you are</Text><Text style={styles.offlineCopy}>Your course and progress live on this device.</Text></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 24, paddingBottom: 45 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 14 },
  kicker: { color: colors.mintDark, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 8, maxWidth: 270, color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '4deg' }] }, avatarText: { color: '#fff', fontSize: 19, fontWeight: '800' },
  courseCard: { marginTop: 30, padding: 22, borderRadius: 26, backgroundColor: colors.ink },
  courseTop: { flexDirection: 'row', alignItems: 'center' }, languagePill: { width: 35, height: 26, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }, languagePillText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  courseLabel: { marginLeft: 10, color: '#BBD1C9', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  courseTitle: { marginTop: 20, color: '#fff', fontSize: 25, fontWeight: '800' }, courseSub: { marginTop: 5, color: '#BBD1C9', fontSize: 13 },
  progress: { height: 6, marginTop: 22, borderRadius: 3, backgroundColor: '#34534D' }, progressFill: { width: '4%', height: 6, borderRadius: 3, backgroundColor: colors.coral },
  sectionRow: { marginTop: 30, marginBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' }, count: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  lessonCard: { padding: 21, borderRadius: 26, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  letterStack: { flexDirection: 'row', marginBottom: 22 }, letter: { width: 50, height: 50, borderRadius: 16, borderWidth: 2, borderColor: '#fff', backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, letterText: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  lessonEyebrow: { color: colors.coral, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }, lessonTitle: { marginTop: 7, color: colors.ink, fontSize: 22, fontWeight: '800' }, lessonCopy: { marginTop: 6, color: colors.muted, fontSize: 14, lineHeight: 21 },
  startButton: { marginTop: 20, height: 50, borderRadius: 16, backgroundColor: colors.coralSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, startText: { color: colors.coral, fontWeight: '800', fontSize: 15 }, startArrow: { marginLeft: 8, color: colors.coral, fontSize: 19, fontWeight: '800' },
  offline: { marginTop: 18, padding: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 19, backgroundColor: '#F1EBDD' }, offlineIcon: { width: 34, color: colors.mintDark, fontSize: 28 }, offlineTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, offlineCopy: { marginTop: 2, color: colors.muted, fontSize: 11 },
});
