import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContentPackage } from '@/content';
import { getCourse } from '@/content/course-catalog';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { getLessonCompletions, type LessonCompletionRow } from '@/db/progress';
import { colors } from '@/features/onboarding/theme';
import type { LanguageCourse } from '@/models';
import { useUiCopy } from '@/features/localization/use-ui-copy';

const englishContent = getContentPackage('en');

export default function LearnScreen() {
  const db = useSQLiteContext();
  const copy = useUiCopy();
  const [variant, setVariant] = useState('English');
  const [courses, setCourses] = useState<LanguageCourse[]>([]);
  const [completions, setCompletions] = useState<Record<string, LessonCompletionRow>>({});

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const user = await getLocalUser(db);
      if (!user?.onboarding_completed_at) return router.replace('/');
      const languages = await getSelectedLanguages(db, user.id);
      const savedCompletions = await getLessonCompletions(db, user.id);
      const englishSelection = languages.find((item) => item.language_id === 'en');
      const selectedVariant = englishContent.language.pronunciationVariants.find((item) => item.id === englishSelection?.pronunciation_variant_id);
      if (active) {
        setVariant(selectedVariant?.name ?? englishContent.language.name);
        setCourses(languages.map((item) => getCourse(item.language_id)).filter((course): course is LanguageCourse => Boolean(course)));
        setCompletions(Object.fromEntries(savedCompletions.map((item) => [item.level_id, item])));
      }
    })();
    return () => { active = false; };
  }, [db]));

  const hasEnglish = courses.some((course) => course.id === 'en');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.kicker}>{copy.languageShelf}</Text><Text style={styles.title}>{copy.shelfTitle}</Text></View>
          <Pressable onPress={() => router.push('/(tabs)/manage-languages')} style={styles.addButton}><Text style={styles.addText}>＋</Text></Pressable>
        </View>

        <Text style={styles.intro}>{copy.shelfIntro}</Text>

        <View style={styles.courseList}>
          {courses.map((course) => {
            const lessonIds = course.id === 'en' ? englishContent.levels.map((level) => level.id) : course.lessons.map((lesson) => lesson.id);
            const completed = lessonIds.filter((id) => completions[id]).length;
            const total = Math.max(lessonIds.length, 1);
            return (
              <Pressable
                key={course.id}
                onPress={() => course.id === 'en' ? undefined : router.push({ pathname: '/(tabs)/multilingual/[languageId]', params: { languageId: course.id } })}
                style={({ pressed }) => [styles.courseCard, { backgroundColor: course.color }, pressed && course.id !== 'en' && styles.pressed]}
              >
                <View style={styles.courseCardTop}>
                  <View style={[styles.scriptMark, { backgroundColor: course.accentColor }]}><Text style={styles.scriptMarkText}>{course.preview.split(' ')[0]}</Text></View>
                  <View style={styles.courseCopy}><Text style={[styles.courseLabel, { color: course.accentColor }]}>{course.scriptName.toUpperCase()}</Text><Text style={styles.courseTitle}>{course.name} <Text style={styles.nativeName}>{course.nativeName !== course.name ? course.nativeName : variant}</Text></Text></View>
                  <Text style={[styles.openArrow, { color: course.accentColor }]}>{course.id === 'en' ? '↓' : '→'}</Text>
                </View>
                <Text style={styles.courseDescription}>{course.description}</Text>
                <View style={styles.progressRow}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(completed / total) * 100}%`, backgroundColor: course.accentColor }]} /></View><Text style={styles.progressText}>{completed}/{lessonIds.length}</Text></View>
              </Pressable>
            );
          })}
        </View>

        {!courses.length ? <Pressable onPress={() => router.push('/(tabs)/manage-languages')} style={styles.empty}><Text style={styles.emptyTitle}>Add your first course</Text><Text style={styles.emptyCopy}>Choose one or several languages to begin.</Text></Pressable> : null}

        {hasEnglish ? <>
          <View style={styles.sectionRow}><View><Text style={styles.sectionEyebrow}>{copy.englishCourse}</Text><Text style={styles.sectionTitle}>{copy.phonicsPath}</Text></View><Text style={styles.count}>{englishContent.levels.length} lessons</Text></View>
          <View style={styles.lessonList}>{englishContent.levels.map((level, index) => {
            const preview = level.unitIds.slice(0, 4).map((id) => englishContent.units.find((unit) => unit.id === id)?.symbol.split(' ')[0]).join('  ');
            const completion = completions[level.id];
            return (
              <Pressable key={level.id} onPress={() => router.push({ pathname: '/(tabs)/lesson/[levelId]', params: { levelId: level.id } })} style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}>
                <View style={[styles.lessonNumber, index > 4 && styles.lessonNumberPhonics]}><Text style={styles.lessonNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                <View style={styles.lessonCopyWrap}><Text style={styles.lessonFocus}>{completion ? `COMPLETED · REPEAT ${completion.completion_count > 1 ? `×${completion.completion_count}` : ''}` : level.focus}</Text><Text style={styles.lessonTitle}>{level.title}</Text><Text style={styles.preview}>{preview}{level.unitIds.length > 4 ? '  …' : ''}</Text></View>
                <View style={[styles.play, completion && styles.playComplete]}><Text style={[styles.playText, completion && styles.playCompleteText]}>{completion ? '✓' : '▶'}</Text></View>
              </Pressable>
            );
          })}</View>
        </> : null}

        <Pressable onPress={() => router.push('/(tabs)/worksheets' as Href)} style={styles.worksheetButton}><Text style={styles.worksheetIcon}>✎</Text><View style={styles.worksheetCopy}><Text style={styles.worksheetTitle}>Printable worksheet library</Text><Text style={styles.worksheetSubtitle}>Print or create PDFs for every bundled lesson</Text></View><Text style={styles.worksheetArrow}>→</Text></Pressable>
        <Pressable onPress={() => router.push('/(tabs)/manage-languages')} style={styles.manageButton}><Text style={styles.manageText}>{copy.manageShelf}</Text><Text style={styles.manageArrow}>→</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 24, paddingBottom: 46 },
  header: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, kicker: { color: colors.mintDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { marginTop: 7, color: colors.ink, fontSize: 31, lineHeight: 37, fontWeight: '800', letterSpacing: -1 },
  addButton: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, addText: { color: colors.gold, fontSize: 27, lineHeight: 30 }, intro: { maxWidth: 350, marginTop: 12, color: colors.muted, fontSize: 14, lineHeight: 21 },
  courseList: { gap: 12, marginTop: 25 }, courseCard: { padding: 18, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(25,52,47,0.08)' }, courseCardTop: { flexDirection: 'row', alignItems: 'center' }, scriptMark: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, scriptMarkText: { color: '#fff', fontSize: 19, fontWeight: '900' }, courseCopy: { flex: 1, marginLeft: 13 }, courseLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, courseTitle: { marginTop: 4, color: colors.ink, fontSize: 20, fontWeight: '800' }, nativeName: { color: colors.muted, fontSize: 15, fontWeight: '600' }, openArrow: { fontSize: 23, fontWeight: '800' }, courseDescription: { marginTop: 13, color: colors.muted, fontSize: 12, lineHeight: 18 }, progressRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center' }, progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(25,52,47,0.12)', overflow: 'hidden' }, progressFill: { height: 6, borderRadius: 3 }, progressText: { width: 38, marginLeft: 10, color: colors.ink, fontSize: 11, fontWeight: '800', textAlign: 'right' },
  empty: { marginTop: 25, padding: 25, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mintDark, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, emptyCopy: { marginTop: 5, color: colors.muted, fontSize: 13 },
  sectionRow: { marginTop: 32, marginBottom: 13, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionEyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, sectionTitle: { marginTop: 3, color: colors.ink, fontSize: 21, fontWeight: '800' }, count: { color: colors.muted, fontSize: 12, fontWeight: '600' }, lessonList: { gap: 11 },
  lessonCard: { minHeight: 94, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' }, lessonNumber: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint }, lessonNumberPhonics: { backgroundColor: colors.coralSoft }, lessonNumberText: { color: colors.ink, fontSize: 13, fontWeight: '900' }, lessonCopyWrap: { flex: 1, marginHorizontal: 13 }, lessonFocus: { color: colors.coral, fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }, lessonTitle: { marginTop: 4, color: colors.ink, fontSize: 16, fontWeight: '800' }, preview: { marginTop: 5, color: colors.mintDark, fontSize: 12, fontWeight: '800' }, play: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft }, playComplete: { backgroundColor: colors.mint }, playText: { marginLeft: 2, color: colors.coral, fontSize: 11 }, playCompleteText: { marginLeft: 0, color: colors.mintDark, fontSize: 16, fontWeight: '900' },
  manageButton: { height: 56, marginTop: 24, paddingHorizontal: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, manageText: { color: '#fff', fontSize: 15, fontWeight: '800' }, manageArrow: { marginLeft: 9, color: colors.gold, fontSize: 20 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  worksheetButton: { minHeight: 76, marginTop: 27, padding: 14, borderRadius: 21, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }, worksheetIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: colors.gold, color: colors.ink, fontSize: 22, lineHeight: 45, textAlign: 'center' }, worksheetCopy: { flex: 1, marginLeft: 12 }, worksheetTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' }, worksheetSubtitle: { marginTop: 4, color: colors.muted, fontSize: 9 }, worksheetArrow: { color: colors.coral, fontSize: 20, fontWeight: '900' },
});
