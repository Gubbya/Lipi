import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContentPackage } from '@/content';
import { courseCatalog } from '@/content/course-catalog';
import { phrasebook } from '@/content/phrasebook';
import { getContentReview, saveContentReview, type ContentReviewStatus } from '@/db/content-review';
import { getLocalUser } from '@/db/onboarding';
import { authorizedFetch } from '@/services/app-config';
import { colors } from '@/features/onboarding/theme';

const statuses: { id: ContentReviewStatus; label: string }[] = [
  { id: 'needs-review', label: 'Needs review' },
  { id: 'in-review', label: 'In review' },
  { id: 'approved', label: 'Approved' },
];

export default function AdminScreen() {
  const db = useSQLiteContext();
  const [courseIndex, setCourseIndex] = useState(0);
  const [status, setStatus] = useState<ContentReviewStatus>('needs-review');
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const course = courseCatalog[courseIndex];
  const english = getContentPackage('en');
  const lessonCount = course.id === 'en' ? english.levels.length : course.lessons.length;
  const unitCount = course.id === 'en' ? english.units.length : course.lessons.reduce((total, lesson) => total + lesson.units.length, 0);

  useEffect(() => {
    (async () => {
      const user = await getLocalUser(db);
      if (!user) return;
      const review = await getContentReview(db, user.id, course.id);
      setStatus(review?.status ?? 'needs-review');
      setNotes(review?.notes ?? '');
    })();
  }, [course.id, db]);

  async function saveLocal() {
    const user = await getLocalUser(db);
    if (!user) return;
    await saveContentReview(db, user.id, course.id, status, notes);
    Alert.alert('Review saved', `${course.name} review notes are stored on this device.`);
  }

  async function publishReview() {
    setWorking(true);
    try {
      const user = await getLocalUser(db);
      if (!user) throw new Error('Learner profile not found');
      await saveContentReview(db, user.id, course.id, status, notes);
      await authorizedFetch(`/api/content-review/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          notes,
          summary: { name: course.name, nativeName: course.nativeName, script: course.scriptName, lessonCount, unitCount, phraseCount: phrasebook[course.id]?.length ?? 0, reviewedByProfile: user.display_name },
        }),
      });
      Alert.alert('Published', `${course.name} review status was saved to the Lipi database.`);
    } catch (error) {
      Alert.alert('Publish unavailable', error instanceof Error ? error.message : 'Check Cloud & AI settings.');
    } finally { setWorking(false); }
  }

  async function pullReview() {
    setWorking(true);
    try {
      const result = await authorizedFetch(`/api/content-review/${course.id}`);
      if (statuses.some((item) => item.id === result.status)) setStatus(result.status);
      setNotes(result.notes ?? '');
      const user = await getLocalUser(db);
      if (user) await saveContentReview(db, user.id, course.id, result.status ?? 'needs-review', result.notes ?? '');
    } catch (error) {
      Alert.alert('Download unavailable', error instanceof Error ? error.message : 'Check Cloud & AI settings.');
    } finally { setWorking(false); }
  }

  return (
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.eyebrow}>CONTENT STUDIO</Text><Text style={styles.title}>Language review</Text></View></View>
      <Text style={styles.intro}>Track native-speaker review without changing bundled lessons accidentally. Only a server administrator with the private API token can publish status.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>{courseCatalog.map((item, index) => <Pressable key={item.id} onPress={() => setCourseIndex(index)} style={[styles.coursePill, index === courseIndex && { backgroundColor: item.color, borderColor: item.accentColor }]}><Text style={[styles.courseText, index === courseIndex && { color: item.accentColor }]}>{item.nativeName}</Text></Pressable>)}</ScrollView>
      <View style={[styles.summary, { backgroundColor: course.color }]}><Text style={[styles.preview, { color: course.accentColor }]}>{course.preview}</Text><Text style={styles.courseName}>{course.name} · {course.nativeName}</Text><Text style={styles.meta}>{course.scriptName} · {lessonCount} lessons · {unitCount} teaching units</Text></View>
      <Text style={styles.label}>Review status</Text><View style={styles.statusRow}>{statuses.map((item) => <Pressable key={item.id} onPress={() => setStatus(item.id)} style={[styles.status, status === item.id && styles.statusActive]}><Text style={[styles.statusText, status === item.id && styles.statusTextActive]}>{item.label}</Text></Pressable>)}</View>
      <Text style={styles.label}>Native-speaker and teaching notes</Text><TextInput value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholder="Record pronunciation, spelling, cultural, or sequencing corrections…" placeholderTextColor={colors.muted} style={styles.notes} />
      <Pressable onPress={saveLocal} style={styles.primary}><Text style={styles.primaryText}>Save review on this device</Text></Pressable><View style={styles.cloudRow}><Pressable disabled={working} onPress={pullReview} style={styles.secondary}><Text style={styles.secondaryText}>↓ Pull status</Text></Pressable><Pressable disabled={working} onPress={publishReview} style={styles.secondary}><Text style={styles.secondaryText}>{working ? 'Working…' : '↑ Publish status'}</Text></Pressable></View>
      <View style={styles.notice}><Text style={styles.noticeTitle}>Publishing safeguard</Text><Text style={styles.noticeBody}>This studio publishes review metadata only. Curriculum code still requires validation and a normal Git review before release.</Text></View>
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { padding: 24, paddingBottom: 50 }, header: { flexDirection: 'row', alignItems: 'center', gap: 13 }, back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EBDD' }, backText: { color: colors.ink, fontSize: 28 }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { marginTop: 3, color: colors.ink, fontSize: 25, fontWeight: '900' }, intro: { marginTop: 18, color: colors.muted, fontSize: 12, lineHeight: 19 }, courseRow: { paddingVertical: 18, gap: 8 }, coursePill: { minHeight: 39, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, courseText: { color: colors.muted, fontSize: 12, fontWeight: '800' }, summary: { padding: 20, borderRadius: 24 }, preview: { fontSize: 28, fontWeight: '900' }, courseName: { marginTop: 12, color: colors.ink, fontSize: 19, fontWeight: '900' }, meta: { marginTop: 5, color: colors.muted, fontSize: 10 }, label: { marginTop: 22, marginBottom: 8, color: colors.ink, fontSize: 12, fontWeight: '900' }, statusRow: { flexDirection: 'row', gap: 6 }, status: { flex: 1, minHeight: 43, paddingHorizontal: 5, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, statusActive: { borderColor: colors.coral, backgroundColor: colors.coralSoft }, statusText: { color: colors.muted, fontSize: 9, fontWeight: '800' }, statusTextActive: { color: colors.coral }, notes: { minHeight: 170, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, color: colors.ink, backgroundColor: '#fff', fontSize: 12, lineHeight: 18 }, primary: { minHeight: 51, marginTop: 13, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, primaryText: { color: colors.gold, fontSize: 12, fontWeight: '900' }, cloudRow: { marginTop: 8, flexDirection: 'row', gap: 8 }, secondary: { flex: 1, minHeight: 45, borderRadius: 14, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.ink, fontSize: 10, fontWeight: '900' }, notice: { marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: colors.mint }, noticeTitle: { color: colors.mintDark, fontSize: 12, fontWeight: '900' }, noticeBody: { marginTop: 5, color: colors.ink, fontSize: 10, lineHeight: 16 },
});
