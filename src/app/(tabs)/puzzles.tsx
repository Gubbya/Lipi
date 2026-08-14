import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Speech from 'expo-speech';
import { getCourse } from '@/content/course-catalog';
import { vocabularyImages } from '@/content/vocabulary-images';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { recordPracticeSession } from '@/db/progress';
import { colors } from '@/features/onboarding/theme';
import type { LanguageCourse } from '@/models';
import { useUiCopy } from '@/features/localization/use-ui-copy';

const TOTAL_ROUNDS = 6;

export default function PuzzlesScreen() {
  const db = useSQLiteContext();
  const copy = useUiCopy();
  const [courses, setCourses] = useState<LanguageCourse[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const user = await getLocalUser(db);
      if (!user) return;
      const languages = await getSelectedLanguages(db, user.id);
      if (active) setCourses(languages.map((item) => getCourse(item.language_id)).filter((course): course is LanguageCourse => Boolean(course)));
    })();
    return () => { active = false; Speech.stop(); };
  }, [db]));

  const course = courses.length ? courses[round % courses.length] : null;
  const entry = course?.vocabulary[round % course.vocabulary.length];
  const choices = useMemo(() => {
    if (!course || !entry) return [];
    const other = course.vocabulary.filter((item) => item.concept !== entry.concept).slice(round % 2, (round % 2) + 2);
    const items = [entry, ...other];
    return round % 2 ? [items[1], items[0], items[2]] : items;
  }, [course, entry, round]);

  async function choose(concept: string) {
    if (!entry || feedback) return;
    const correct = concept === entry.concept;
    setFeedback(correct ? 'correct' : 'incorrect');
    if (correct) {
      setScore((value) => value + 1);
      if (course) Speech.speak(entry.native, { language: course.locale, rate: 0.68 });
    } else {
      setTimeout(() => setFeedback(null), 750);
    }
  }

  async function finish() {
    if (!saved) {
      const user = await getLocalUser(db);
      if (user) await recordPracticeSession(db, user.id, courses.map((item) => item.id), score, TOTAL_ROUNDS);
      setSaved(true);
    }
    setRound(0); setScore(0); setFeedback(null); setSaved(false);
  }

  if (!courses.length) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.eyebrow}>MIXED-LANGUAGE PUZZLES</Text><Text style={styles.title}>Add a course to start playing.</Text><Pressable onPress={() => router.push('/(tabs)/manage-languages')} style={styles.primaryButton}><Text style={styles.primaryText}>Choose languages</Text></Pressable></View></SafeAreaView>;
  }

  if (round >= TOTAL_ROUNDS) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><View style={styles.trophy}><Text style={styles.trophyText}>★</Text></View><Text style={styles.eyebrow}>PUZZLE COMPLETE</Text><Text style={styles.title}>{score}/{TOTAL_ROUNDS} correct</Text><Text style={styles.subtitle}>You practiced {courses.map((item) => item.name).join(', ')}.</Text><Pressable onPress={finish} style={styles.primaryButton}><Text style={styles.primaryText}>Play again</Text><Text style={styles.primaryArrow}>→</Text></Pressable></View></SafeAreaView>;
  }

  if (!course || !entry) return null;
  return (
    <SafeAreaView style={styles.safe}><View style={styles.page}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>{copy.mixedPuzzle}</Text><Text style={styles.headerTitle}>{copy.pictureMatch}</Text></View><View style={styles.score}><Text style={styles.scoreText}>{score} ★</Text></View></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((round + 1) / TOTAL_ROUNDS) * 100}%` }]} /></View>
      <View style={styles.center}>
        <View style={[styles.languagePill, { backgroundColor: course.color }]}><Text style={[styles.languagePillText, { color: course.accentColor }]}>{course.name} · {course.nativeName}</Text></View>
        <Text style={styles.prompt}>{copy.whichWord(entry.english)}</Text>
        <View style={styles.imageCard}><Image source={vocabularyImages[entry.concept]} style={styles.image} /></View>
        <View style={styles.choices}>{choices.map((choice) => {
          const correctChoice = feedback === 'correct' && choice.concept === entry.concept;
          return <Pressable key={choice.concept} onPress={() => choose(choice.concept)} style={({ pressed }) => [styles.choice, correctChoice && { borderColor: course.accentColor, backgroundColor: course.color }, pressed && styles.pressed]}><Text style={[styles.choiceNative, course.direction === 'rtl' && styles.rtl]}>{choice.native}</Text><Text style={styles.choiceRoman}>{choice.romanization}</Text></Pressable>;
        })}</View>
        {feedback === 'incorrect' ? <Text style={styles.incorrect}>{copy.tryAgain}</Text> : null}{feedback === 'correct' ? <Text style={[styles.correct, { color: course.accentColor }]}>{copy.correct} {entry.native}</Text> : null}
      </View>
      <View style={styles.footer}><Pressable disabled={feedback !== 'correct'} onPress={() => { setRound((value) => value + 1); setFeedback(null); }} style={[styles.primaryButton, feedback !== 'correct' && styles.disabled]}><Text style={styles.primaryText}>{round === TOTAL_ROUNDS - 1 ? copy.seeResult : copy.nextPuzzle}</Text><Text style={styles.primaryArrow}>→</Text></Pressable><Text style={styles.attribution}>Pictures: Twemoji · CC-BY 4.0</Text></View>
    </View></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { flex: 1, padding: 24 }, header: { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, headerTitle: { marginTop: 4, color: colors.ink, fontSize: 25, fontWeight: '800' }, score: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13, backgroundColor: colors.ink }, scoreText: { color: colors.gold, fontSize: 13, fontWeight: '900' }, progressTrack: { height: 7, marginTop: 20, borderRadius: 4, backgroundColor: '#E6E3D7', overflow: 'hidden' }, progressFill: { height: 7, borderRadius: 4, backgroundColor: colors.coral },
  center: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }, title: { maxWidth: 340, marginTop: 12, color: colors.ink, fontSize: 29, lineHeight: 36, fontWeight: '800', textAlign: 'center' }, languagePill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 13 }, languagePillText: { fontSize: 11, fontWeight: '900' }, prompt: { maxWidth: 330, marginTop: 18, color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: '800', textAlign: 'center' }, imageCard: { width: 130, height: 130, marginVertical: 24, borderRadius: 36, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, image: { width: 82, height: 82 }, choices: { alignSelf: 'stretch', gap: 9 }, choice: { minHeight: 63, paddingHorizontal: 17, borderRadius: 18, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, choiceNative: { color: colors.ink, fontSize: 19, fontWeight: '800', textAlign: 'center' }, choiceRoman: { marginTop: 3, color: colors.muted, fontSize: 10 }, incorrect: { marginTop: 14, color: '#A64537', fontSize: 13, fontWeight: '700' }, correct: { marginTop: 14, fontSize: 14, fontWeight: '900' },
  footer: { paddingBottom: 6 }, primaryButton: { minHeight: 57, alignSelf: 'stretch', paddingHorizontal: 20, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' }, primaryArrow: { marginLeft: 9, color: colors.gold, fontSize: 20 }, disabled: { opacity: 0.32 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] }, attribution: { marginTop: 9, color: colors.muted, fontSize: 8, textAlign: 'center' }, subtitle: { maxWidth: 330, marginTop: 10, marginBottom: 25, color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, trophy: { width: 86, height: 86, marginBottom: 23, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold }, trophyText: { color: colors.ink, fontSize: 39 }, rtl: { writingDirection: 'rtl' },
});
