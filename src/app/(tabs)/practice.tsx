import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { getContentPackage } from '@/content';
import { getCourse } from '@/content/course-catalog';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { savePronunciationAttempt } from '@/db/pronunciation';
import { getDueReviews, getReviewSummary, scheduleReview, seedReviewCard, type ReviewCardRow } from '@/db/review';
import { AudioPlaybackControls } from '@/features/audio/AudioPlaybackControls';
import { useLearningAudio, type LearningAudioSpeed } from '@/features/audio/use-learning-audio';
import { authorizedFetch } from '@/services/app-config';
import { colors } from '@/features/onboarding/theme';
import type { Skill } from '@/models';

interface PracticeUnit {
  id: string;
  languageId: string;
  languageName: string;
  locale: string;
  symbol: string;
  romanization: string;
  soundHint: string;
}

interface Assessment {
  transcript: string;
  score: number;
  feedback: string;
  strengths?: string[];
  practiceTip?: string;
}

type ChoiceQuizSkill = 'recognition' | 'listening' | 'recall';
const CHOICE_QUIZ_SKILLS: ChoiceQuizSkill[] = ['recognition', 'listening', 'recall'];

function isChoiceQuizSkill(skill: Skill): skill is ChoiceQuizSkill {
  return CHOICE_QUIZ_SKILLS.includes(skill as ChoiceQuizSkill);
}

function allUnitsForLanguage(languageId: string, pronunciationVariantId?: string | null): PracticeUnit[] {
  if (languageId === 'en') {
    return getContentPackage('en').units.map((unit) => ({
      id: unit.id,
      languageId: 'en',
      languageName: 'English',
      locale: pronunciationVariantId ?? 'en-US',
      symbol: unit.symbol,
      romanization: unit.transliteration ?? unit.displayName,
      soundHint: unit.soundHint ?? unit.speechCue ?? '',
    }));
  }
  const course = getCourse(languageId);
  if (!course) return [];
  return course.lessons.flatMap((lesson) => lesson.units.map((unit) => ({
    id: unit.id,
    languageId: course.id,
    languageName: course.name,
    locale: course.locale,
    symbol: unit.symbol,
    romanization: unit.romanization,
    soundHint: unit.soundHint,
  })));
}

export default function PracticeScreen() {
  const db = useSQLiteContext();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const recorderState = useAudioRecorderState(recorder);
  const recordingPlayer = useAudioPlayer(null);
  const learningAudio = useLearningAudio();
  const stopLearningAudio = learningAudio.stop;
  const [units, setUnits] = useState<PracticeUnit[]>([]);
  const [dueCards, setDueCards] = useState<ReviewCardRow[]>([]);
  const [reviewSummary, setReviewSummary] = useState({ due: 0, total: 0 });
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState<'correct' | 'again' | null>(null);
  const [reviewAnswerId, setReviewAnswerId] = useState<string | null>(null);
  const [pronunciationIndex, setPronunciationIndex] = useState(0);
  const [pronunciationDueUnitIds, setPronunciationDueUnitIds] = useState<string[]>([]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [working, setWorking] = useState(false);

  const loadPractice = useCallback(async () => {
    const user = await getLocalUser(db);
    if (!user) return;
    const selected = await getSelectedLanguages(db, user.id);
    const available = selected.flatMap((language) => allUnitsForLanguage(language.language_id, language.pronunciation_variant_id));
    const [due, pronunciationDue] = await Promise.all([
      getDueReviews(db, user.id, 20, CHOICE_QUIZ_SKILLS),
      getDueReviews(db, user.id, 20, ['pronunciation']),
    ]);
    setUnits(available);
    setDueCards(due);
    setPronunciationDueUnitIds(pronunciationDue.map((card) => card.unit_id));
    setReviewSummary(await getReviewSummary(db, user.id));
    setReviewIndex(0);
    setReviewFeedback(null);
    setReviewAnswerId(null);
    setPronunciationIndex(0);
  }, [db]);

  useFocusEffect(useCallback(() => {
    loadPractice();
    return () => { stopLearningAudio(); recordingPlayer.pause(); };
  }, [loadPractice, recordingPlayer, stopLearningAudio]));

  const reviewCard = dueCards[reviewIndex] ?? null;
  const reviewUnit = reviewCard ? units.find((unit) => unit.id === reviewCard.unit_id) ?? null : null;
  const reviewChoices = useMemo(() => {
    if (!reviewUnit) return [];
    const pool = units.filter((unit) => unit.languageId === reviewUnit.languageId && unit.id !== reviewUnit.id);
    const offset = pool.length ? (reviewIndex * 7) % pool.length : 0;
    const alternatives = [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 2);
    const choices = [reviewUnit, ...alternatives];
    const rotation = choices.length ? reviewIndex % choices.length : 0;
    return [...choices.slice(rotation), ...choices.slice(0, rotation)];
  }, [reviewIndex, reviewUnit, units]);
  const queuedPronunciationId = pronunciationDueUnitIds[pronunciationIndex];
  const pronunciationUnit = (queuedPronunciationId ? units.find((unit) => unit.id === queuedPronunciationId) : null)
    ?? units[pronunciationIndex % Math.max(1, units.length)]
    ?? null;
  const reviewSkill = reviewCard && isChoiceQuizSkill(reviewCard.skill) ? reviewCard.skill : 'recognition';
  const reviewPrompt = !reviewUnit
    ? ''
    : reviewSkill === 'listening'
      ? 'Listen, then choose what you heard.'
      : reviewSkill === 'recall'
        ? `How do you read “${reviewUnit.symbol}”?`
        : `Which symbol says “${reviewUnit.romanization}”?`;

  async function seedReviews() {
    const user = await getLocalUser(db);
    if (!user) return;
    for (const unit of units.slice(0, 12)) {
      for (const skill of [...CHOICE_QUIZ_SKILLS, 'pronunciation'] as Skill[]) {
        await seedReviewCard(db, user.id, unit.languageId, unit.id, skill);
      }
    }
    await loadPractice();
  }

  async function answerReview(unitId: string) {
    if (!reviewCard || !reviewUnit || reviewFeedback) return;
    const correct = unitId === reviewUnit.id;
    setReviewAnswerId(unitId);
    setReviewFeedback(correct ? 'correct' : 'again');
    const user = await getLocalUser(db);
    if (user) await scheduleReview(db, user.id, reviewUnit.languageId, reviewUnit.id, reviewCard.skill as Skill, correct ? 100 : 40);
  }

  function nextReview() {
    setReviewFeedback(null);
    setReviewAnswerId(null);
    if (reviewIndex + 1 >= dueCards.length) loadPractice(); else setReviewIndex((value) => value + 1);
  }

  function hearUnit(unit: PracticeUnit, nextSpeed: LearningAudioSpeed = 'normal', key = unit.id) {
    learningAudio.play({
      key,
      languageId: unit.languageId,
      locale: unit.locale,
      pronunciationVariantId: unit.languageId === 'en' ? unit.locale : undefined,
      text: unit.symbol,
      unitId: unit.id,
    }, nextSpeed);
  }

  function hearTarget(nextSpeed: LearningAudioSpeed = 'normal') {
    if (pronunciationUnit) hearUnit(pronunciationUnit, nextSpeed, `pronunciation-${pronunciationUnit.id}`);
  }

  async function toggleRecording() {
    if (recorderState.isRecording) {
      await recorder.stop();
      setRecordingUri(recorder.uri ?? null);
      setAssessment(null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone permission needed', 'Allow microphone access to practise your pronunciation.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordingUri(null);
    setAssessment(null);
  }

  async function saveSelfScore(score: number) {
    if (!pronunciationUnit || !recordingUri) return;
    const user = await getLocalUser(db);
    if (!user) return;
    await savePronunciationAttempt(db, {
      userId: user.id,
      languageId: pronunciationUnit.languageId,
      unitId: pronunciationUnit.id,
      targetText: pronunciationUnit.symbol,
      recordingUri,
      durationMs: recorderState.durationMillis ?? null,
      selfScore: score,
    });
    await scheduleReview(db, user.id, pronunciationUnit.languageId, pronunciationUnit.id, 'pronunciation', score);
    Alert.alert('Practice saved', 'Your recording and self-check were saved on this device.');
  }

  async function requestAssessment() {
    if (!pronunciationUnit || !recordingUri) return;
    setWorking(true);
    try {
      const user = await getLocalUser(db);
      if (!user) throw new Error('Learner profile not found');
      const audioBase64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: FileSystem.EncodingType.Base64 });
      const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4';
      const result = await authorizedFetch('/api/pronunciation', {
        method: 'POST',
        body: JSON.stringify({
          deviceUserId: user.id,
          language: pronunciationUnit.languageName,
          targetText: pronunciationUnit.symbol,
          audioBase64,
          mimeType,
        }),
      }) as Assessment;
      setAssessment(result);
      await savePronunciationAttempt(db, {
        userId: user.id,
        languageId: pronunciationUnit.languageId,
        unitId: pronunciationUnit.id,
        targetText: pronunciationUnit.symbol,
        recordingUri,
        durationMs: recorderState.durationMillis ?? null,
        selfScore: null,
        aiScore: result.score,
        transcript: result.transcript,
        feedback: `${result.feedback} ${result.practiceTip ?? ''}`.trim(),
      });
      await scheduleReview(db, user.id, pronunciationUnit.languageId, pronunciationUnit.id, 'pronunciation', result.score);
    } catch (error) {
      Alert.alert('Assessment unavailable', error instanceof Error ? error.message : 'Try again later. You can still save a self-check.');
    } finally { setWorking(false); }
  }

  return (
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>DAILY PRACTICE</Text><Text style={styles.title}>Review. Speak. Remember.</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{reviewSummary.due}</Text><Text style={styles.summaryLabel}>due now</Text></View>
        <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{reviewSummary.total}</Text><Text style={styles.summaryLabel}>saved cards</Text></View>
        <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{units.length * 4}</Text><Text style={styles.summaryLabel}>possible drills</Text></View>
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Mixed quiz</Text>
        {reviewUnit ? <View style={styles.reviewCard}>
          <Text style={styles.cardEyebrow}>{reviewUnit.languageName} · {reviewSkill}</Text>
          <Text style={styles.reviewPrompt}>{reviewPrompt}</Text>
          {reviewSkill === 'listening' ? <View style={styles.reviewAudio}><AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} compact hasRecording={learningAudio.hasRecording({ key: `review-${reviewUnit.id}`, languageId: reviewUnit.languageId, locale: reviewUnit.locale, pronunciationVariantId: reviewUnit.languageId === 'en' ? reviewUnit.locale : undefined, text: reviewUnit.symbol, unitId: reviewUnit.id })} isActive={learningAudio.activeKey === `review-${reviewUnit.id}`} onNormal={() => hearUnit(reviewUnit, 'normal', `review-${reviewUnit.id}`)} onSlow={() => hearUnit(reviewUnit, 'slow', `review-${reviewUnit.id}`)} /></View> : null}
          <View style={styles.choiceRow}>{reviewChoices.map((choice) => {
            const isCorrectChoice = Boolean(reviewFeedback) && choice.id === reviewUnit.id;
            const isWrongChoice = reviewFeedback === 'again' && choice.id === reviewAnswerId;
            return <Pressable key={choice.id} disabled={Boolean(reviewFeedback)} onPress={() => answerReview(choice.id)} style={[styles.choice, isCorrectChoice && styles.choiceCorrect, isWrongChoice && { borderColor: '#B55443', backgroundColor: '#FCE9E4' }]}><Text style={[styles.choiceText, reviewSkill === 'recall' && { fontSize: 15, lineHeight: 20 }]}>{reviewSkill === 'recall' ? choice.romanization : choice.symbol}</Text></Pressable>;
          })}</View>
          {reviewFeedback ? <><Text style={reviewFeedback === 'correct' ? styles.good : styles.again}>{reviewFeedback === 'correct' ? 'Correct — this card will return later.' : `The answer is ${reviewSkill === 'recall' ? reviewUnit.romanization : reviewUnit.symbol}. We will show it again sooner.`}</Text><Pressable onPress={nextReview} style={styles.darkButton}><Text style={styles.darkButtonText}>Next quiz →</Text></Pressable></> : null}
        </View> : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>{reviewSummary.total ? 'Reviews complete for now' : 'Build your first mixed quiz'}</Text><Text style={styles.body}>Each learned item creates recognition, listening, recall, and speaking practice. Difficult items return sooner.</Text>{units.length ? <Pressable onPress={seedReviews} style={styles.outlineButton}><Text style={styles.outlineText}>{reviewSummary.total ? 'Practise extra cards' : 'Create my quiz deck'}</Text></Pressable> : null}</View>}
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Speaking quiz</Text>
        {pronunciationUnit ? <View style={styles.speakCard}><View style={styles.targetHeader}><View style={styles.targetCopy}><Text style={styles.cardEyebrow}>{pronunciationUnit.languageName}</Text><Text style={styles.targetSymbol}>{pronunciationUnit.symbol}</Text><Text style={styles.targetRoman}>{pronunciationUnit.romanization} · {pronunciationUnit.soundHint}</Text></View><Pressable onPress={() => hearTarget('normal')} style={styles.roundListen}><Text style={styles.roundListenText}>{learningAudio.activeKey === `pronunciation-${pronunciationUnit.id}` && learningAudio.isPlaying ? '♪' : '▶'}</Text></Pressable></View>
          <Text style={styles.instruction}>Lipi asks you to speak. Listen once, record your answer, then compare. AI feedback is optional and is a coaching estimate.</Text>
          <AudioPlaybackControls activeKind={learningAudio.kind} activeSpeed={learningAudio.speed} hasRecording={learningAudio.hasRecording({ key: `pronunciation-${pronunciationUnit.id}`, languageId: pronunciationUnit.languageId, locale: pronunciationUnit.locale, pronunciationVariantId: pronunciationUnit.languageId === 'en' ? pronunciationUnit.locale : undefined, text: pronunciationUnit.symbol, unitId: pronunciationUnit.id })} isActive={learningAudio.activeKey === `pronunciation-${pronunciationUnit.id}`} onNormal={() => hearTarget('normal')} onSlow={() => hearTarget('slow')} />
          <Pressable onPress={toggleRecording} style={[styles.recordButton, recorderState.isRecording && styles.recording]}><View style={styles.recordDot} /><Text style={styles.recordText}>{recorderState.isRecording ? `Stop · ${Math.round((recorderState.durationMillis ?? 0) / 1000)}s` : 'Record my voice'}</Text></Pressable>
          {recordingUri ? <><Pressable onPress={() => { recordingPlayer.replace(recordingUri); recordingPlayer.play(); }} style={styles.playback}><Text style={styles.playbackText}>▶ Play my recording</Text></Pressable><Text style={styles.selfLabel}>How close did it sound?</Text><View style={styles.scoreRow}>{[[40, 'Try again'], [70, 'Close'], [100, 'Strong']].map(([score, label]) => <Pressable key={String(score)} onPress={() => saveSelfScore(Number(score))} style={styles.scoreButton}><Text style={styles.scoreText}>{label}</Text></Pressable>)}</View><Pressable disabled={working} onPress={requestAssessment} style={styles.aiButton}><Text style={styles.aiButtonText}>{working ? 'Listening carefully…' : '✦ Ask AI pronunciation coach'}</Text></Pressable></> : null}
          {assessment ? <View style={styles.assessment}><Text style={styles.assessmentScore}>{Math.round(assessment.score)}/100</Text><Text style={styles.assessmentText}>{assessment.feedback}</Text>{assessment.transcript ? <Text style={styles.transcript}>Heard: “{assessment.transcript}”</Text> : null}{assessment.practiceTip ? <Text style={styles.tip}>Tip: {assessment.practiceTip}</Text> : null}</View> : null}
          <View style={styles.navigator}><Pressable onPress={() => { setPronunciationIndex((value) => Math.max(0, value - 1)); setRecordingUri(null); setAssessment(null); }}><Text style={styles.navText}>← Previous</Text></Pressable><Pressable onPress={() => { setPronunciationIndex((value) => value + 1); setRecordingUri(null); setAssessment(null); }}><Text style={styles.navText}>Next speaking quiz →</Text></Pressable></View>
        </View> : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Choose a language first</Text><Text style={styles.body}>Your selected course sounds will appear here.</Text></View>}
      </View>
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, page: { padding: 24, paddingBottom: 50 }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { marginTop: 6, color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '900' }, summaryRow: { marginTop: 20, flexDirection: 'row', gap: 10 }, summaryCard: { flex: 1, padding: 16, borderRadius: 20, backgroundColor: colors.ink }, summaryNumber: { color: colors.gold, fontSize: 25, fontWeight: '900' }, summaryLabel: { marginTop: 2, color: '#D6E3DE', fontSize: 11, fontWeight: '700' }, section: { marginTop: 29 }, sectionTitle: { marginBottom: 12, color: colors.ink, fontSize: 21, fontWeight: '900' }, reviewCard: { padding: 19, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' }, cardEyebrow: { color: colors.mintDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' }, reviewPrompt: { marginTop: 9, color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '800' }, reviewAudio: { marginTop: 13 }, choiceRow: { marginTop: 18, flexDirection: 'row', gap: 8 }, choice: { flex: 1, minHeight: 78, borderRadius: 18, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }, choiceCorrect: { borderColor: colors.mintDark, backgroundColor: '#E5F5EC' }, choiceText: { color: colors.ink, fontSize: 28, fontWeight: '800', textAlign: 'center' }, good: { marginTop: 14, color: colors.mintDark, fontSize: 12, fontWeight: '800' }, again: { marginTop: 14, color: '#A64A3A', fontSize: 12, fontWeight: '800' }, darkButton: { marginTop: 14, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, darkButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' }, emptyCard: { padding: 20, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, body: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 }, outlineButton: { marginTop: 15, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, outlineText: { color: colors.ink, fontSize: 12, fontWeight: '800' }, speakCard: { padding: 19, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line }, targetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, targetCopy: { flex: 1, marginRight: 12 }, targetSymbol: { marginTop: 8, color: colors.ink, fontSize: 36, fontWeight: '900' }, targetRoman: { marginTop: 4, color: colors.coral, fontSize: 12, fontWeight: '700' }, roundListen: { width: 49, height: 49, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint }, roundListenText: { color: colors.mintDark, fontSize: 20, fontWeight: '900' }, instruction: { marginTop: 17, color: colors.muted, fontSize: 12, lineHeight: 18 }, recordButton: { minHeight: 55, marginTop: 18, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coral }, recording: { backgroundColor: '#A84435' }, recordDot: { width: 12, height: 12, marginRight: 9, borderRadius: 6, backgroundColor: '#fff' }, recordText: { color: '#fff', fontSize: 14, fontWeight: '900' }, playback: { minHeight: 46, marginTop: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralSoft }, playbackText: { color: colors.coral, fontSize: 12, fontWeight: '800' }, selfLabel: { marginTop: 18, color: colors.ink, fontSize: 12, fontWeight: '800' }, scoreRow: { marginTop: 9, flexDirection: 'row', gap: 7 }, scoreButton: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, scoreText: { color: colors.ink, fontSize: 10, fontWeight: '800' }, aiButton: { minHeight: 48, marginTop: 11, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, aiButtonText: { color: colors.gold, fontSize: 12, fontWeight: '900' }, assessment: { marginTop: 14, padding: 15, borderRadius: 17, backgroundColor: '#E9F5EF' }, assessmentScore: { color: colors.mintDark, fontSize: 23, fontWeight: '900' }, assessmentText: { marginTop: 6, color: colors.ink, fontSize: 12, lineHeight: 18 }, transcript: { marginTop: 8, color: colors.muted, fontSize: 11, fontStyle: 'italic' }, tip: { marginTop: 7, color: colors.mintDark, fontSize: 11, fontWeight: '700' }, navigator: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }, navText: { color: colors.coral, fontSize: 12, fontWeight: '800' },
});
