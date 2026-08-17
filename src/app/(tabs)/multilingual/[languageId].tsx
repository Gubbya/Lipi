import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getCourse } from '@/content/course-catalog';
import { getLessonAudioPaths } from '@/content/learning-audio';
import { vocabularyImages } from '@/content/vocabulary-images';
import { phrasebook } from '@/content/phrasebook';
import { getLocalUser } from '@/db/onboarding';
import { getLessonCompletions, recordLessonCompletion, type LessonCompletionRow } from '@/db/progress';
import { scheduleReview, seedReviewCard } from '@/db/review';
import { AudioPlaybackControls } from '@/features/audio/AudioPlaybackControls';
import { LessonAudioDownload } from '@/features/audio/LessonAudioDownload';
import { useLearningAudio, type LearningAudioSpeed } from '@/features/audio/use-learning-audio';
import { colors } from '@/features/onboarding/theme';
import type { StarterLesson } from '@/models';
import { useUiCopy } from '@/features/localization/use-ui-copy';

type ScreenMode = 'overview' | 'lesson' | 'worksheet' | 'complete';

export default function MultilingualCourseScreen() {
  const { languageId } = useLocalSearchParams<{ languageId: string }>();
  const db = useSQLiteContext();
  const copy = useUiCopy();
  const course = getCourse(languageId);
  const learningAudio = useLearningAudio();
  const [mode, setMode] = useState<ScreenMode>('overview');
  const [activeLesson, setActiveLesson] = useState<StarterLesson | null>(null);
  const [unitIndex, setUnitIndex] = useState(0);
  const [quizTargetId, setQuizTargetId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'correct' | 'incorrect' | null>(null);
  const [saving, setSaving] = useState(false);
  const [completions, setCompletions] = useState<Record<string, LessonCompletionRow>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getLocalUser(db);
      if (!user) return;
      const rows = await getLessonCompletions(db, user.id);
      if (active) setCompletions(Object.fromEntries(rows.map((row) => [row.level_id, row])));
    })();
    return () => { active = false; };
  }, [db]);

  const quizTarget = activeLesson?.units.find((unit) => unit.id === quizTargetId) ?? activeLesson?.units[0];
  const quizChoices = useMemo(() => {
    if (!activeLesson || !quizTarget) return [];
    const targetIndex = activeLesson.units.findIndex((unit) => unit.id === quizTarget.id);
    const distractors = activeLesson.units
      .filter((unit) => unit.id !== quizTarget.id)
      .sort((left, right) => Math.abs(activeLesson.units.indexOf(left) - targetIndex) - Math.abs(activeLesson.units.indexOf(right) - targetIndex))
      .slice(0, 2);
    const choices = [quizTarget, ...distractors];
    const shift = choices.length > 1 ? (targetIndex + 1) % choices.length : 0;
    return [...choices.slice(shift), ...choices.slice(0, shift)];
  }, [activeLesson, quizTarget]);
  const lessonSections = useMemo(() => {
    const sections = new Map<string, { lesson: StarterLesson; index: number }[]>();
    course?.lessons.forEach((lesson, index) => {
      const sectionName = lesson.section ?? copy.scriptFoundations;
      const items = sections.get(sectionName) ?? [];
      items.push({ lesson, index });
      sections.set(sectionName, items);
    });
    return [...sections.entries()].map(([title, items]) => ({ title, items }));
  }, [copy.scriptFoundations, course]);

  if (!course) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Course not found</Text><Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/learn')}><Text style={styles.primaryText}>Back to Learn</Text></Pressable></View></SafeAreaView>;
  }

  function speak(text: string, nextSpeed: LearningAudioSpeed = 'normal', key = text, unitId?: string) {
    learningAudio.play({
      key,
      languageId: course!.id,
      locale: course!.locale,
      text,
      unitId,
    }, nextSpeed);
  }

  function beginLesson(lesson: StarterLesson) {
    setActiveLesson(lesson);
    setUnitIndex(0);
    const previousCompletions = completions[lesson.id]?.completion_count ?? 0;
    setQuizTargetId(lesson.units[previousCompletions % lesson.units.length]?.id ?? lesson.units[0]?.id ?? null);
    setAnswerState(null);
    setMode('lesson');
  }

  async function chooseAnswer(unitId: string) {
    if (!activeLesson || !quizTarget || answerState) return;
    const correct = unitId === quizTarget.id;
    setAnswerState(correct ? 'correct' : 'incorrect');
    if (!correct) {
      speak(course!.id === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Try again', 'normal', `${course!.id}-feedback-try-again`);
      setTimeout(() => setAnswerState(null), 800);
      return;
    }
    speak(quizTarget.symbol, 'normal', quizTarget.id, quizTarget.id);
    setSaving(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/');
      await recordLessonCompletion(db, user.id, activeLesson.id, 100);
      for (const learnedUnit of activeLesson.units) await seedReviewCard(db, user.id, course!.id, learnedUnit.id, 'recognition');
      await scheduleReview(db, user.id, course!.id, quizTarget.id, 'recognition', 100);
      const rows = await getLessonCompletions(db, user.id);
      setCompletions(Object.fromEntries(rows.map((row) => [row.level_id, row])));
    } finally { setSaving(false); }
  }

  if (mode === 'complete' && activeLesson) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.completeWrap}>
        <View style={[styles.completeMark, { backgroundColor: course.color }]}><Text style={[styles.completeMarkText, { color: course.accentColor }]}>✓</Text></View>
        <Text style={[styles.eyebrow, { color: course.accentColor }]}>{copy.lessonComplete}</Text><Text style={styles.completeTitle}>{activeLesson.title}</Text>
        <Text style={styles.bodyCopy}>{copy.repeatSaved}</Text>
        <Pressable onPress={() => { setMode('overview'); setActiveLesson(null); }} style={styles.primaryButton}><Text style={styles.primaryText}>Back to {course.name}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
      </View></SafeAreaView>
    );
  }

  if (mode === 'worksheet') {
    return (
      <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}><Pressable onPress={() => setMode('overview')} style={styles.close}><Text style={styles.closeText}>‹</Text></Pressable><Text style={styles.topTitle}>{course.name} · {copy.worksheet}</Text><View style={styles.topSpacer} /></View>
        <View style={[styles.worksheetHero, { backgroundColor: course.color }]}><Text style={[styles.worksheetTitle, { color: course.accentColor }]}>Look · Say · Trace</Text><Text style={styles.bodyCopy}>Say each symbol, then trace it three times on paper or follow its shape with your finger.</Text></View>
        {course.lessons.map((lesson) => <View key={lesson.id} style={styles.worksheetSection}><Text style={styles.lessonTitle}>{lesson.title}</Text>{lesson.units.map((unit) => <View key={unit.id} style={styles.traceRow}><View style={styles.traceLabel}><Text style={styles.traceSymbol}>{unit.symbol}</Text><Text style={styles.traceRoman}>{unit.romanization}</Text></View><Text style={styles.traceGhost}>{unit.symbol}  {unit.symbol}  {unit.symbol}</Text></View>)}</View>)}
      </ScrollView></SafeAreaView>
    );
  }

  if (mode === 'lesson' && activeLesson) {
    const isQuiz = unitIndex >= activeLesson.units.length;
    const unit = activeLesson.units[Math.min(unitIndex, activeLesson.units.length - 1)];
    const stepTotal = activeLesson.units.length + 1;
    const currentRequest = { key: unit.id, languageId: course.id, locale: course.locale, text: unit.symbol, unitId: unit.id };
    const quizRequest = quizTarget ? { key: quizTarget.id, languageId: course.id, locale: course.locale, text: quizTarget.symbol, unitId: quizTarget.id } : null;
    return (
      <SafeAreaView style={styles.safe}><View style={styles.lessonPage}>
        <View style={styles.topBar}><Pressable onPress={() => setMode('overview')} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable><View style={styles.lessonProgress}><View style={[styles.lessonProgressFill, { width: `${((unitIndex + 1) / stepTotal) * 100}%`, backgroundColor: course.accentColor }]} /></View><Text style={styles.stepText}>{Math.min(unitIndex + 1, stepTotal)}/{stepTotal}</Text></View>
        {isQuiz ? <View style={styles.lessonCenter}>
          <Text style={[styles.eyebrow, { color: course.accentColor }]}>{copy.quickCheck.toUpperCase()}</Text><Text style={styles.title}>{copy.whichSymbol(quizTarget?.romanization ?? '')}</Text>
          {quizRequest ? <AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} hasRecording={learningAudio.hasRecording(quizRequest)} isActive={learningAudio.activeKey === quizRequest.key} onNormal={() => speak(quizTarget!.symbol, 'normal', quizTarget!.id, quizTarget!.id)} onSlow={() => speak(quizTarget!.symbol, 'slow', quizTarget!.id, quizTarget!.id)} tint={course.accentColor} /> : null}
          <View style={styles.choiceRow}>{quizChoices.map((choice) => <Pressable key={choice.id} onPress={() => chooseAnswer(choice.id)} style={[styles.choice, answerState === 'correct' && choice.id === quizTarget?.id && { borderColor: course.accentColor, backgroundColor: course.color }]}><Text numberOfLines={3} style={[styles.choiceText, choice.symbol.length > 6 && styles.choiceTextLong]}>{choice.symbol}</Text></Pressable>)}</View>
          {answerState === 'incorrect' ? <Text style={styles.incorrect}>Listen and try once more.</Text> : null}{answerState === 'correct' ? <Text style={[styles.correct, { color: course.accentColor }]}>Correct! Beautiful work.</Text> : null}
        </View> : <View style={styles.lessonCenter}>
          <Text style={[styles.eyebrow, { color: course.accentColor }]}>{course.scriptName.toUpperCase()}</Text>
          <Pressable onPress={() => speak(unit.symbol, 'normal', unit.id, unit.id)} style={[styles.symbolCard, { backgroundColor: course.color }]}><Text style={[styles.symbol, unit.symbol.length > 8 && styles.symbolLong, course.direction === 'rtl' && styles.rtl]}>{unit.symbol}</Text><View style={[styles.speaker, { backgroundColor: course.accentColor }]}><Text style={styles.speakerText}>{learningAudio.activeKey === unit.id && learningAudio.isPlaying ? '♪' : '▶'}</Text></View></Pressable>
          <Text style={styles.title}>{unit.name}</Text><Text style={[styles.romanization, { color: course.accentColor }]}>{unit.romanization}</Text><Text style={styles.bodyCopy}>{unit.soundHint}{unit.example ? ` · ${unit.example}` : ''}</Text>
          <AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} hasRecording={learningAudio.hasRecording(currentRequest)} isActive={learningAudio.activeKey === unit.id} onNormal={() => speak(unit.symbol, 'normal', unit.id, unit.id)} onSlow={() => speak(unit.symbol, 'slow', unit.id, unit.id)} tint={course.accentColor} />
        </View>}
        <View style={styles.footer}>{isQuiz ? <Pressable disabled={answerState !== 'correct' || saving} onPress={() => setMode('complete')} style={[styles.primaryButton, answerState !== 'correct' && styles.disabled]}><Text style={styles.primaryText}>{saving ? 'Saving…' : 'Finish lesson'}</Text><Text style={styles.primaryArrow}>→</Text></Pressable> : <Pressable onPress={() => { learningAudio.stop(); setUnitIndex((value) => value + 1); }} style={styles.primaryButton}><Text style={styles.primaryText}>{unitIndex === activeLesson.units.length - 1 ? copy.quickCheck : copy.nextSymbol}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>}</View>
      </View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>‹</Text></Pressable><Text style={styles.topTitle}>{copy.course}</Text><Pressable onPress={() => setMode('worksheet')} style={styles.worksheetMini}><Text style={styles.worksheetMiniText}>✎</Text></Pressable></View>
      <View style={[styles.hero, { backgroundColor: course.color }]}><Text style={[styles.heroScript, { color: course.accentColor }]}>{course.preview}</Text><Text style={styles.heroTitle}>{course.name}</Text><Text style={styles.heroNative}>{course.nativeName}</Text><Text style={styles.heroDescription}>{course.description}</Text><View style={styles.heroMeta}><Text style={styles.heroMetaText}>{course.scriptName}</Text><Text style={styles.heroMetaDot}>•</Text><Text style={styles.heroMetaText}>{course.lessons.length} foundational lessons</Text></View></View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Learning path</Text><Pressable onPress={() => setMode('worksheet')}><Text style={[styles.link, { color: course.accentColor }]}>{copy.worksheet} →</Text></Pressable></View>
      {lessonSections.map((section) => {
        const completedCount = section.items.filter(({ lesson }) => Boolean(completions[lesson.id])).length;
        return <View key={section.title} style={styles.lessonSection}><View style={styles.lessonGroupHeader}><Text style={styles.lessonGroupTitle}>{section.title}</Text><Text style={styles.lessonGroupProgress}>{completedCount}/{section.items.length} complete</Text></View><View style={styles.lessonList}>{section.items.map(({ lesson, index }) => { const completion = completions[lesson.id]; const audioPaths = getLessonAudioPaths(course.id, course.locale, lesson.units.map((unit) => unit.id)); return <View key={lesson.id}><Pressable onPress={() => beginLesson(lesson)} style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}><View style={[styles.lessonNumber, { backgroundColor: course.color }]}><Text style={[styles.lessonNumberText, { color: course.accentColor }]}>{completion ? '✓' : index + 1}</Text></View><View style={styles.lessonCopy}><Text style={[styles.lessonStatus, { color: course.accentColor }]}>{completion ? `COMPLETED · REPEAT ${completion.completion_count > 1 ? `×${completion.completion_count}` : ''}` : `${lesson.units.length} UNITS`}</Text><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.lessonDescription}>{lesson.description}</Text></View><Text style={[styles.lessonArrow, { color: course.accentColor }]}>→</Text></Pressable><LessonAudioDownload accentColor={course.accentColor} paths={audioPaths} /></View>; })}</View></View>;
      })}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{copy.pictureVocabulary}</Text><Text style={styles.count}>{course.vocabulary.length} words</Text></View>
      <View style={styles.vocabularyGrid}>{course.vocabulary.map((entry) => <Pressable key={entry.concept} onPress={() => speak(entry.native, 'normal', `${course.id}-vocabulary-${entry.concept}`)} onLongPress={() => speak(entry.native, 'slow', `${course.id}-vocabulary-${entry.concept}`)} style={styles.wordCard}><Image source={vocabularyImages[entry.concept]} style={styles.wordImage} /><Text style={[styles.wordNative, course.direction === 'rtl' && styles.rtl]}>{entry.native}</Text><Text style={styles.wordRoman}>{entry.romanization}</Text><Text style={styles.wordEnglish}>{entry.english}</Text><Text style={styles.wordAudioHint}>Tap · hold for slow</Text></Pressable>)}</View>
      <Text style={styles.attribution}>Pictures: Twemoji · CC-BY 4.0</Text>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>First phrases</Text><Text style={styles.count}>Tap to hear</Text></View>
      <View style={styles.phraseList}>{(phrasebook[course.id] ?? []).map((phrase) => { const request = { key: `${course.id}-phrase-${phrase.native}`, languageId: course.id, locale: course.locale, text: phrase.native }; return <View key={phrase.native} style={styles.phraseCard}><View style={styles.phraseCopy}><Text style={[styles.phraseNative, course.direction === 'rtl' && styles.rtl]}>{phrase.native}</Text><Text style={styles.phraseRoman}>{phrase.romanization}</Text><Text style={styles.phraseEnglish}>{phrase.english}</Text><View style={styles.phraseControls}><AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} compact hasRecording={learningAudio.hasRecording(request)} isActive={learningAudio.activeKey === request.key} onNormal={() => speak(phrase.native, 'normal', request.key)} onSlow={() => speak(phrase.native, 'slow', request.key)} tint={course.accentColor} /></View></View></View>; })}</View>
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { padding: 24, paddingBottom: 45 }, center: { flex: 1, justifyContent: 'center', padding: 24 },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, close: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EBDD' }, closeText: { color: colors.ink, fontSize: 28, lineHeight: 30 }, topTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, topSpacer: { width: 42 }, worksheetMini: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, worksheetMiniText: { color: colors.gold, fontSize: 20 },
  hero: { marginTop: 22, padding: 24, borderRadius: 29 }, heroScript: { fontSize: 39, fontWeight: '900', letterSpacing: 4 }, heroTitle: { marginTop: 19, color: colors.ink, fontSize: 31, fontWeight: '800', letterSpacing: -0.8 }, heroNative: { marginTop: 3, color: colors.muted, fontSize: 19, fontWeight: '700' }, heroDescription: { marginTop: 13, color: colors.ink, fontSize: 13, lineHeight: 20 }, heroMeta: { marginTop: 18, flexDirection: 'row', alignItems: 'center' }, heroMetaText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, heroMetaDot: { marginHorizontal: 8, color: colors.muted },
  sectionHeader: { marginTop: 29, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' }, link: { fontSize: 12, fontWeight: '800' }, count: { color: colors.muted, fontSize: 11, fontWeight: '700' }, lessonSection: { marginBottom: 18 }, lessonGroupHeader: { marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, lessonGroupTitle: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '900' }, lessonGroupProgress: { marginLeft: 12, color: colors.muted, fontSize: 9, fontWeight: '700' }, lessonList: { gap: 11 }, lessonCard: { minHeight: 101, padding: 15, flexDirection: 'row', alignItems: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' }, lessonNumber: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, lessonNumberText: { fontSize: 16, fontWeight: '900' }, lessonCopy: { flex: 1, marginHorizontal: 13 }, lessonStatus: { fontSize: 8, fontWeight: '900', letterSpacing: 1 }, lessonTitle: { marginTop: 4, color: colors.ink, fontSize: 16, fontWeight: '800' }, lessonDescription: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 15 }, lessonArrow: { fontSize: 20, fontWeight: '800' },
  vocabularyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, wordCard: { width: '48%', minHeight: 178, padding: 14, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', alignItems: 'center' }, wordImage: { width: 54, height: 54 }, wordNative: { marginTop: 10, color: colors.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' }, wordRoman: { marginTop: 3, color: colors.muted, fontSize: 10, textAlign: 'center' }, wordEnglish: { marginTop: 4, color: colors.coral, fontSize: 11, fontWeight: '800' }, wordAudioHint: { marginTop: 7, color: colors.muted, fontSize: 8, fontWeight: '700' }, attribution: { marginTop: 14, color: colors.muted, fontSize: 9, textAlign: 'center' }, phraseList: { gap: 10 }, phraseCard: { minHeight: 116, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' }, phraseCopy: { flex: 1 }, phraseNative: { color: colors.ink, fontSize: 17, fontWeight: '800' }, phraseRoman: { marginTop: 4, color: colors.muted, fontSize: 10 }, phraseEnglish: { marginTop: 3, color: colors.coral, fontSize: 10, fontWeight: '700' }, phraseControls: { marginTop: 10 },
  lessonPage: { flex: 1, paddingHorizontal: 24, paddingTop: 16 }, lessonProgress: { flex: 1, height: 7, marginHorizontal: 14, borderRadius: 4, backgroundColor: '#E8E5DA', overflow: 'hidden' }, lessonProgressFill: { height: 7, borderRadius: 4 }, stepText: { color: colors.muted, fontSize: 11, fontWeight: '800' }, lessonCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, symbolCard: { width: 200, height: 200, marginVertical: 26, padding: 12, borderRadius: 58, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-2deg' }] }, symbol: { maxWidth: 176, color: colors.ink, fontSize: 68, fontWeight: '800', textAlign: 'center' }, symbolLong: { fontSize: 25, lineHeight: 34 }, speaker: { position: 'absolute', right: -4, bottom: 13, width: 49, height: 49, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, speakerText: { color: '#fff', fontSize: 20, fontWeight: '900' }, title: { maxWidth: 340, marginTop: 12, color: colors.ink, fontSize: 29, lineHeight: 36, fontWeight: '800', textAlign: 'center' }, romanization: { marginTop: 8, fontSize: 17, fontWeight: '800' }, bodyCopy: { maxWidth: 340, marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, soundButton: { minHeight: 45, marginTop: 21, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, soundButtonText: { fontSize: 13, fontWeight: '900' }, choiceRow: { marginTop: 31, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }, choice: { minWidth: 87, minHeight: 97, maxWidth: 160, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 23, borderWidth: 2, borderColor: colors.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, choiceText: { color: colors.ink, fontSize: 37, fontWeight: '800', textAlign: 'center' }, choiceTextLong: { fontSize: 15, lineHeight: 20 }, incorrect: { marginTop: 19, color: '#A64537', fontSize: 13, fontWeight: '700' }, correct: { marginTop: 19, fontSize: 14, fontWeight: '800' }, footer: { paddingBottom: 22 }, primaryButton: { minHeight: 57, paddingHorizontal: 20, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' }, primaryArrow: { marginLeft: 9, color: colors.gold, fontSize: 20 }, disabled: { opacity: 0.35 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  completeWrap: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' }, completeMark: { width: 91, height: 91, marginBottom: 26, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }, completeMarkText: { fontSize: 46, fontWeight: '900' }, completeTitle: { marginTop: 13, color: colors.ink, fontSize: 32, lineHeight: 39, fontWeight: '800', textAlign: 'center' },
  worksheetHero: { marginTop: 22, padding: 22, borderRadius: 25 }, worksheetTitle: { fontSize: 22, fontWeight: '900' }, worksheetSection: { marginTop: 24 }, traceRow: { minHeight: 94, marginTop: 10, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' }, traceLabel: { width: 86, alignItems: 'center' }, traceSymbol: { color: colors.ink, fontSize: 31, fontWeight: '800' }, traceRoman: { marginTop: 3, color: colors.muted, fontSize: 10 }, traceGhost: { flex: 1, color: '#D9D9D2', fontSize: 29, letterSpacing: 5, textAlign: 'center' }, rtl: { writingDirection: 'rtl' },
});
