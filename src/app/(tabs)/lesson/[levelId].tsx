import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getContentPackage } from '@/content';
import { getFeedbackAudio, getPhonicsAudio, getQuizAudio } from '@/content/phonics-audio';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { recordAttempt, recordLessonCompletion, saveUnitMastery } from '@/db/progress';
import { scheduleReview, seedReviewCard } from '@/db/review';
import { AudioPlaybackControls } from '@/features/audio/AudioPlaybackControls';
import { useLearningAudio, type LearningAudioSpeed } from '@/features/audio/use-learning-audio';
import { colors } from '@/features/onboarding/theme';
import type { IdentifyUnitActivity } from '@/models';

const content = getContentPackage('en');
type Feedback = 'correct' | 'incorrect' | null;

export default function LessonScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const db = useSQLiteContext();
  const learningAudio = useLearningAudio();
  const level = content.levels.find((item) => item.id === levelId);
  const units = useMemo(() => level?.unitIds.map((id) => content.units.find((unit) => unit.id === id)).filter((unit) => unit !== undefined) ?? [], [level]);
  const activity = content.activities.find(
    (item): item is IdentifyUnitActivity => item.id === `quiz-${levelId}` && item.type === 'identify-unit',
  );
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);
  const [pronunciationVariantId, setPronunciationVariantId] = useState('en-US');
  const unitsById = useMemo(() => new Map(content.units.map((unit) => [unit.id, unit])), []);
  const isQuiz = step === units.length;
  const isComplete = step > units.length;
  const progress = Math.min((step + 1) / (units.length + 1), 1) * 100;

  useEffect(() => {
    (async () => {
      const user = await getLocalUser(db);
      if (!user) return;
      const languages = await getSelectedLanguages(db, user.id);
      setPronunciationVariantId(languages.find((language) => language.language_id === 'en')?.pronunciation_variant_id ?? 'en-US');
    })();
  }, [db]);

  if (!level || !activity || activity.type !== 'identify-unit' || units.length === 0) {
    return <SafeAreaView style={styles.safe}><View style={styles.errorWrap}><Text style={styles.title}>Lesson not found</Text><Pressable onPress={() => router.replace('/(tabs)/learn')} style={styles.primaryButton}><Text style={styles.primaryText}>Back to Learn</Text></Pressable></View></SafeAreaView>;
  }

  function playSound(nextSpeed: LearningAudioSpeed = 'normal') {
    const unit = units[Math.min(step, units.length - 1)];
    if (!unit) return;
    learningAudio.play({
      key: unit.id,
      languageId: 'en',
      locale: pronunciationVariantId,
      pronunciationVariantId,
      source: getPhonicsAudio(unit.id, pronunciationVariantId),
      text: unit.speechCue ?? `${unit.symbol}. ${unit.soundHint ?? ''}`,
      unitId: unit.id,
    }, nextSpeed);
  }

  function playQuizPrompt(nextSpeed: LearningAudioSpeed = 'normal') {
    if (!activity) return;
    learningAudio.play({
      key: activity.id,
      languageId: 'en',
      locale: pronunciationVariantId,
      pronunciationVariantId,
      source: getQuizAudio(activity.id, pronunciationVariantId),
      text: activity.prompt,
    }, nextSpeed);
  }

  async function chooseAnswer(unitId: string) {
    if (feedback || !activity || !level) return;
    const correct = unitId === activity.correctUnitId;
    setFeedback(correct ? 'correct' : 'incorrect');
    if (!correct) {
      learningAudio.play({ key: 'feedback-try-again', languageId: 'en', locale: pronunciationVariantId, source: getFeedbackAudio('try-again', pronunciationVariantId), text: 'Listen once more, and try again.' });
      setTimeout(() => setFeedback(null), 900);
      return;
    }
    learningAudio.play({ key: 'feedback-correct', languageId: 'en', locale: pronunciationVariantId, source: getFeedbackAudio('correct', pronunciationVariantId), text: 'Correct! Well done!' });
    setSaving(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return router.replace('/');
      const now = new Date().toISOString();
      await recordAttempt(db, {
        id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId: user.id, activityId: activity.id,
        languageId: activity.languageId, unitId: activity.unitId, skill: activity.skill, correct: true, score: 100,
        userAnswer: unitId, expectedAnswer: activity.correctUnitId, durationMs: null, createdAt: now,
      });
      await saveUnitMastery(db, 'en', {
        userId: user.id, unitId: activity.unitId, recognition: 20, listening: activity.skill === 'listening' ? 20 : 0,
        pronunciation: 0, writing: 0, recall: 0, totalAttempts: 1, correctAttempts: 1, streakCorrect: 1,
        lastReviewedAt: now, nextReviewAt: new Date(Date.now() + 86400000).toISOString(), updatedAt: now,
      });
      for (const learnedUnit of units) await seedReviewCard(db, user.id, 'en', learnedUnit.id, 'recognition');
      await scheduleReview(db, user.id, 'en', activity.unitId, activity.skill, 100);
      await recordLessonCompletion(db, user.id, level.id, 100);
    } finally { setSaving(false); }
  }

  if (isComplete) {
    return (
      <SafeAreaView style={styles.safe}><View style={styles.completeWrap}>
        <View style={styles.completeMark}><Text style={styles.completeMarkText}>✓</Text></View>
        <Text style={styles.eyebrow}>LESSON COMPLETE</Text><Text style={styles.completeTitle}>You finished {level.title}.</Text>
        <Text style={styles.subtitle}>Come back and replay the sounds whenever you want.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/learn')} style={({ pressed }) => [styles.primaryButton, styles.completeButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Choose next lesson</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
      </View></SafeAreaView>
    );
  }

  const unit = units[Math.min(step, units.length - 1)];
  return (
    <SafeAreaView style={styles.safe}><View style={styles.page}>
      <View style={styles.topRow}>
        <Pressable accessibilityLabel="Close lesson" onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.stepText}>{Math.min(step + 1, units.length + 1)}/{units.length + 1}</Text>
      </View>

      {isQuiz ? (
        <View style={styles.lessonBody}>
          <Text style={styles.eyebrow}>LISTEN & CHOOSE</Text><Text style={styles.title}>{activity.prompt}</Text>
          <AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} hasRecording={Boolean(getQuizAudio(activity.id, pronunciationVariantId))} isActive={learningAudio.activeKey === activity.id} onNormal={() => playQuizPrompt('normal')} onSlow={() => playQuizPrompt('slow')} />
          <View style={styles.choiceGrid}>{activity.choices.map((unitId) => {
            const choice = unitsById.get(unitId); const correctChoice = feedback === 'correct' && unitId === activity.correctUnitId;
            return <Pressable key={unitId} onPress={() => chooseAnswer(unitId)} style={({ pressed }) => [styles.choice, correctChoice && styles.choiceCorrect, pressed && styles.pressed]}><Text style={styles.choiceText}>{choice?.symbol}</Text></Pressable>;
          })}</View>
          {feedback === 'incorrect' ? <Text style={styles.tryAgain}>Listen once more and try again.</Text> : null}
          {feedback === 'correct' ? <Text style={styles.correct}>Correct! You heard it clearly.</Text> : null}
        </View>
      ) : (
        <View style={styles.lessonBody}>
          <Text style={styles.eyebrow}>{level.focus?.toUpperCase()} • TAP TO HEAR</Text>
          <Pressable accessibilityLabel={`Hear ${unit.displayName}`} onPress={() => playSound('normal')} style={({ pressed }) => [styles.heroLetter, learningAudio.activeKey === unit.id && learningAudio.isPlaying && styles.heroSpeaking, pressed && styles.pressed]}><Text style={styles.heroLetterText}>{unit.symbol}</Text><View style={styles.speakerBadge}><Text style={styles.speakerText}>{learningAudio.activeKey === unit.id && learningAudio.isPlaying ? '♪' : '▶'}</Text></View></Pressable>
          <Text style={styles.title}>{unit.displayName}</Text><Text style={styles.pronunciation}>{unit.soundHint} · “{unit.transliteration}”</Text>
          <View style={styles.wordRow}>{unit.exampleWords?.map((word) => <View key={word} style={styles.wordPill}><Text style={styles.wordText}>{word}</Text></View>)}</View>
          <AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} hasRecording={Boolean(getPhonicsAudio(unit.id, pronunciationVariantId))} isActive={learningAudio.activeKey === unit.id} onNormal={() => playSound('normal')} onSlow={() => playSound('slow')} />
        </View>
      )}

      <View style={styles.footer}>{isQuiz ? (
        <Pressable disabled={feedback !== 'correct' || saving} onPress={() => setStep((current) => current + 1)} style={({ pressed }) => [styles.primaryButton, feedback !== 'correct' && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{saving ? 'Saving…' : 'Finish lesson'}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
      ) : (
        <Pressable onPress={() => { learningAudio.stop(); setStep((current) => current + 1); }} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>{step === units.length - 1 ? 'Quick check' : 'Next sound'}</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
      )}</View>
    </View></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { flex: 1, paddingHorizontal: 24, paddingTop: 16 }, topRow: { flexDirection: 'row', alignItems: 'center' },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1EBDD' }, closeText: { color: colors.ink, fontSize: 27, lineHeight: 29 }, progressTrack: { flex: 1, height: 8, marginHorizontal: 15, borderRadius: 4, backgroundColor: '#E8E5DA', overflow: 'hidden' }, progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.coral }, stepText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  lessonBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 }, eyebrow: { color: colors.mintDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroLetter: { width: 194, height: 194, marginVertical: 25, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint, transform: [{ rotate: '-2deg' }] }, heroSpeaking: { backgroundColor: '#A9D9BE', borderWidth: 4, borderColor: '#fff' }, heroLetterText: { color: colors.ink, fontSize: 70, fontWeight: '800' }, speakerBadge: { position: 'absolute', right: -5, bottom: 12, width: 49, height: 49, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coral }, speakerText: { marginLeft: 2, color: '#fff', fontSize: 17, fontWeight: '900' },
  title: { marginTop: 8, color: colors.ink, fontSize: 30, lineHeight: 37, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' }, pronunciation: { marginTop: 9, color: colors.coral, fontSize: 16, fontWeight: '800' }, wordRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 16 }, wordPill: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F1EBDD' }, wordText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  smallSoundButton: { minHeight: 44, marginTop: 20, paddingHorizontal: 17, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft }, soundIcon: { marginRight: 8, color: colors.coral, fontSize: 18, fontWeight: '900' }, smallSoundText: { color: colors.coral, fontSize: 13, fontWeight: '800' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 30 }, choice: { minWidth: 86, height: 96, paddingHorizontal: 10, borderRadius: 24, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, choiceCorrect: { borderColor: colors.mintDark, backgroundColor: '#E6F6EC' }, choiceText: { color: colors.ink, fontSize: 35, fontWeight: '800' }, tryAgain: { marginTop: 20, color: '#A64A3A', fontSize: 14, fontWeight: '700' }, correct: { marginTop: 20, color: colors.mintDark, fontSize: 15, fontWeight: '800' },
  footer: { paddingBottom: 22 }, primaryButton: { height: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' }, primaryArrow: { marginLeft: 10, color: colors.gold, fontSize: 21, fontWeight: '800' }, disabled: { opacity: 0.35 }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  completeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }, completeMark: { width: 90, height: 90, marginBottom: 27, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint }, completeMarkText: { color: colors.ink, fontSize: 46, fontWeight: '900' }, completeTitle: { maxWidth: 350, marginTop: 13, color: colors.ink, fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -1, textAlign: 'center' }, subtitle: { maxWidth: 330, marginTop: 12, color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' }, completeButton: { alignSelf: 'stretch', marginTop: 30 }, errorWrap: { flex: 1, justifyContent: 'center', padding: 24 },
});
