import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getContentPackage } from '@/content';
import { courseCatalog } from '@/content/course-catalog';
import { printWorksheet, shareWorksheetPdf } from '@/services/worksheet';
import { colors } from '@/features/onboarding/theme';
import type { LanguageCourse, StarterLesson } from '@/models';

function printableCourses(): LanguageCourse[] {
  const englishContent = getContentPackage('en');
  const english = courseCatalog.find((course) => course.id === 'en');
  if (!english) return courseCatalog;
  const lessons: StarterLesson[] = englishContent.levels.map((level) => ({
    id: level.id,
    title: level.title,
    description: level.description ?? 'English phonics practice',
    units: level.unitIds.map((id) => englishContent.units.find((unit) => unit.id === id)).filter((unit) => Boolean(unit)).map((unit) => ({
      id: unit!.id,
      symbol: unit!.symbol,
      name: unit!.displayName,
      romanization: unit!.transliteration ?? unit!.displayName,
      soundHint: unit!.soundHint ?? '',
      example: unit!.exampleWords?.join(', '),
    })),
  }));
  return courseCatalog.map((course) => course.id === 'en' ? { ...course, lessons } : course);
}

const courses = printableCourses();

export default function WorksheetsScreen() {
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function run(course: LanguageCourse, lesson: StarterLesson, action: 'print' | 'share') {
    setWorkingId(`${lesson.id}-${action}`);
    try {
      if (action === 'print') await printWorksheet(course, lesson); else await shareWorksheetPdf(course, lesson);
    } catch (error) {
      Alert.alert('Worksheet unavailable', error instanceof Error ? error.message : 'Try again.');
    } finally { setWorkingId(null); }
  }

  return (
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>PRINTABLE PRACTICE</Text><Text style={styles.title}>Worksheet library</Text></View></View>
      <Text style={styles.intro}>Create a clean PDF or open your device’s print dialog. Each sheet includes looking, saying, tracing, and free-writing practice.</Text>
      {courses.map((course) => <View key={course.id} style={styles.courseSection}><View style={[styles.courseHeader, { backgroundColor: course.color }]}><Text style={[styles.coursePreview, { color: course.accentColor }]}>{course.preview}</Text><View><Text style={styles.courseName}>{course.name}</Text><Text style={styles.courseNative}>{course.nativeName} · {course.scriptName}</Text></View></View><View style={styles.lessonList}>{course.lessons.map((lesson) => <View key={lesson.id} style={styles.lessonRow}><View style={styles.lessonCopy}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.lessonMeta}>{lesson.units.length} practice units</Text></View><Pressable disabled={Boolean(workingId)} onPress={() => run(course, lesson, 'print')} style={styles.action}><Text style={styles.actionText}>{workingId === `${lesson.id}-print` ? '…' : 'Print'}</Text></Pressable><Pressable disabled={Boolean(workingId)} onPress={() => run(course, lesson, 'share')} style={[styles.action, styles.pdfAction]}><Text style={[styles.actionText, styles.pdfText]}>{workingId === `${lesson.id}-share` ? '…' : 'PDF'}</Text></Pressable></View>)}</View></View>)}
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { padding: 24, paddingBottom: 50 }, header: { flexDirection: 'row', alignItems: 'center' }, back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EBDD' }, backText: { color: colors.ink, fontSize: 28, lineHeight: 30 }, headerCopy: { marginLeft: 13 }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { marginTop: 3, color: colors.ink, fontSize: 25, fontWeight: '900' }, intro: { marginTop: 19, color: colors.muted, fontSize: 12, lineHeight: 19 }, courseSection: { marginTop: 24 }, courseHeader: { minHeight: 78, padding: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }, coursePreview: { minWidth: 95, fontSize: 22, fontWeight: '900' }, courseName: { color: colors.ink, fontSize: 17, fontWeight: '900' }, courseNative: { marginTop: 3, color: colors.muted, fontSize: 10 }, lessonList: { marginTop: 8, gap: 7 }, lessonRow: { minHeight: 67, padding: 11, borderRadius: 17, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }, lessonCopy: { flex: 1 }, lessonTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, lessonMeta: { marginTop: 3, color: colors.muted, fontSize: 9 }, action: { minWidth: 51, height: 38, marginLeft: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, actionText: { color: colors.ink, fontSize: 10, fontWeight: '900' }, pdfAction: { borderColor: colors.coral, backgroundColor: colors.coralSoft }, pdfText: { color: colors.coral },
});
