import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getCourse } from '@/content/course-catalog';
import { phrasebook } from '@/content/phrasebook';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { clearTutorMessages, getTutorMessages, saveTutorMessage, type TutorMessageRow } from '@/db/tutor';
import { AudioPlaybackControls } from '@/features/audio/AudioPlaybackControls';
import { useLearningAudio, type LearningAudioSpeed } from '@/features/audio/use-learning-audio';
import { authorizedFetch } from '@/services/app-config';
import { colors } from '@/features/onboarding/theme';
import type { LanguageCourse, PhraseEntry } from '@/models';

interface TutorResponse {
  explanation?: string;
  targetText?: string;
  romanization?: string;
  translation?: string;
  correction?: string;
  choices?: string[];
  encouragement?: string;
}

interface PromptSuggestion {
  label: string;
  prompt: string;
}

const practiceDirections = [
  'Listen once, repeat twice, then say it without looking.',
  'Say it slowly first, then repeat it at a natural speaking speed.',
  'Memory round: cover the text, say the phrase, then check yourself.',
];

function phraseForIntent(course: LanguageCourse, learnerAnswer: string, turnIndex: number): PhraseEntry | undefined {
  const phrases = phrasebook[course.id] ?? [];
  const prompt = learnerAnswer.toLocaleLowerCase();
  const find = (pattern: RegExp) => phrases.find((phrase) => pattern.test(`${phrase.english} ${phrase.native}`.toLocaleLowerCase()));
  if (/greet|hello|\bhi\b|namaskar|नमस्कार/.test(prompt)) return find(/hello|नमस्कार|नमस्ते|bonjour|hola|ciao|hallo|привет|مرحبا|你好|こんにちは|안녕|ನಮಸ್ಕಾರ|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|નમસ્તે|నమస్కారం/) ?? phrases[0];
  if (/name|introduc|ओळख|नाव/.test(prompt)) return find(/my name|माझे नाव|मेरा नाम|m’appelle|llamo|chiamo|heiße|зовут|اسمي|我叫|名前|이름|ಹೆಸರು|ਨਾਮ|નામ|పేరు|मम नाम/);
  if (/water|drink|पाणी/.test(prompt)) return find(/water|पाणी|पानी|eau|agua|acqua|wasser|вод|ماء|水|お水|물|ನೀರು|ਪਾਣੀ|પાણી|నీళ్లు|जलं/);
  if (/thank|धन्यवाद/.test(prompt)) return find(/thank|धन्यवाद|merci|gracias|grazie|danke|спасибо|شكرا|谢谢|ありがとう|감사/);
  return phrases[turnIndex % Math.max(1, phrases.length)];
}

function correctedEnglishIntroduction(learnerAnswer: string): string | null {
  const match = learnerAnswer.trim().match(/^my name is\s+(.+?)[.!?]*$/i);
  if (!match) return null;
  const name = match[1].split(/\s+/).map((part) => `${part.charAt(0).toLocaleUpperCase()}${part.slice(1).toLocaleLowerCase()}`).join(' ');
  return `My name is ${name}.`;
}

function offlineReply(course: LanguageCourse, learnerAnswer: string, turnIndex: number): TutorResponse {
  const prompt = learnerAnswer.trim();
  const englishIntroduction = course.id === 'en' ? correctedEnglishIntroduction(prompt) : null;
  if (englishIntroduction) {
    return {
      targetText: englishIntroduction,
      explanation: 'Good introduction. Start the sentence and each name with a capital letter, then finish with a full stop.',
      correction: englishIntroduction === prompt ? 'Your sentence is already clear.' : `Polished sentence: ${englishIntroduction}`,
      encouragement: 'Now say it once slowly and once at a natural speed.',
    };
  }

  if (/correct|check|fix|दुरुस्त/.test(prompt.toLocaleLowerCase()) && prompt.split(/\s+/).length < 6) {
    return {
      targetText: 'Send me one complete sentence.',
      explanation: `Type the sentence you want to practise in ${course.name}. When the AI service is offline, Lipi can compare it with bundled beginner models without pretending to perform a full grammar review.`,
      encouragement: 'Short sentences are best for the first check.',
    };
  }

  const phrase = phraseForIntent(course, prompt, turnIndex);
  if (!phrase) {
    return {
      targetText: course.nativeName,
      translation: course.name,
      explanation: `Open the ${course.name} course to practise its script foundations.`,
      encouragement: 'A few minutes of daily practice makes a difference.',
    };
  }

  const isQuiz = /quiz|test|challenge|चाचणी/.test(prompt.toLocaleLowerCase());
  const alternatives = (phrasebook[course.id] ?? []).filter((item) => item.native !== phrase.native).slice(turnIndex % 2, (turnIndex % 2) + 2);
  return {
    targetText: phrase.native,
    romanization: phrase.romanization,
    translation: phrase.english,
    explanation: isQuiz
      ? `Tiny meaning check: say what this ${course.name} phrase means before reading the answer below.`
      : practiceDirections[turnIndex % practiceDirections.length],
    choices: isQuiz ? [phrase, ...alternatives].map((item) => item.native) : undefined,
    encouragement: isQuiz ? 'Tap the speaker, answer from memory, and then check the meaning.' : 'Clear and steady is better than fast.',
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TutorMessage({
  activeAudioKey,
  activeAudioKind,
  activeAudioSpeed,
  course,
  hasRecording,
  isAudioPlaying,
  message,
  playTarget,
}: {
  activeAudioKey: string | null;
  activeAudioKind: ReturnType<typeof useLearningAudio>['kind'];
  activeAudioSpeed: LearningAudioSpeed;
  course: LanguageCourse;
  hasRecording: (text: string, key: string) => boolean;
  isAudioPlaying: boolean;
  message: TutorMessageRow;
  playTarget: (text: string, key: string, speed: LearningAudioSpeed) => void;
}) {
  const isLearner = message.role === 'learner';
  const [targetText, ...detailLines] = message.message.split('\n').filter(Boolean);
  const canSpeak = course.id === 'en' || Boolean(message.romanization) || Boolean(message.translation);

  if (isLearner) {
    return (
      <View style={[styles.messageRow, styles.learnerRow]}>
        <View style={[styles.bubble, styles.learnerBubble]}>
          <View style={styles.bubbleHeader}><Text style={styles.learnerRole}>YOU</Text><Text style={styles.time}>{formatTime(message.created_at)}</Text></View>
          <Text style={styles.learnerMessage}>{message.message}</Text>
        </View>
        <View style={[styles.avatar, styles.learnerAvatar]}><Text style={styles.learnerAvatarText}>Y</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.messageRow}>
      <View style={[styles.avatar, styles.tutorAvatar]}><Text style={styles.tutorAvatarText}>✦</Text></View>
      <View style={[styles.bubble, styles.tutorBubble]}>
        <View style={styles.bubbleHeader}><Text style={styles.tutorRole}>LIPI · {course.name.toLocaleUpperCase()}</Text><Text style={styles.time}>{formatTime(message.created_at)}</Text></View>
        {targetText ? <Text style={styles.targetText}>{targetText}</Text> : null}
        {message.romanization ? <Text style={styles.romanization}>{message.romanization}</Text> : null}
        {detailLines.map((line, index) => <Text key={`${message.id}-detail-${index}`} style={styles.explanation}>{line}</Text>)}
        {message.translation ? <View style={styles.meaning}><Text style={styles.meaningLabel}>MEANING</Text><Text style={styles.translation}>{message.translation}</Text></View> : null}
        {targetText && canSpeak ? <View style={styles.messageAudio}><AudioPlaybackControls activeKind={activeAudioKind} activeSpeed={activeAudioSpeed} compact hasRecording={hasRecording(targetText, message.id)} isActive={activeAudioKey === message.id && isAudioPlaying} onNormal={() => playTarget(targetText, message.id, 'normal')} onSlow={() => playTarget(targetText, message.id, 'slow')} tint={course.accentColor} /></View> : null}
      </View>
    </View>
  );
}

export default function TutorScreen() {
  const db = useSQLiteContext();
  const chatRef = useRef<ScrollView>(null);
  const learningAudio = useLearningAudio();
  const stopLearningAudio = learningAudio.stop;
  const [courses, setCourses] = useState<LanguageCourse[]>([]);
  const [courseIndex, setCourseIndex] = useState(0);
  const [messages, setMessages] = useState<TutorMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState<'online' | 'offline' | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const course = courses[courseIndex % Math.max(1, courses.length)] ?? null;

  const load = useCallback(async () => {
    const user = await getLocalUser(db);
    if (!user) return;
    const selected = await getSelectedLanguages(db, user.id);
    const nextCourses = selected.map((item) => getCourse(item.language_id)).filter((item): item is LanguageCourse => Boolean(item));
    setCourses(nextCourses);
    const activeCourse = nextCourses[courseIndex % Math.max(1, nextCourses.length)];
    setMessages(activeCourse ? await getTutorMessages(db, user.id, activeCourse.id) : []);
  }, [courseIndex, db]);

  useFocusEffect(useCallback(() => { load(); return () => stopLearningAudio(); }, [load, stopLearningAudio]));

  const suggestedPrompts = useMemo<PromptSuggestion[]>(() => [
    { label: 'Greeting', prompt: 'Teach me a greeting' },
    { label: 'Introduce myself', prompt: 'Help me introduce myself' },
    { label: 'Tiny quiz', prompt: `Give me a tiny ${course?.name ?? 'language'} quiz` },
    { label: 'Useful phrase', prompt: 'Teach me one useful everyday phrase' },
  ], [course?.name]);

  async function askTutor(prompt = input) {
    const cleanPrompt = prompt.trim();
    if (!course || !cleanPrompt || working) return;
    setWorking(true);
    setInput('');
    setErrorMessage(null);
    try {
      const user = await getLocalUser(db);
      if (!user) return;
      await saveTutorMessage(db, user.id, course.id, 'learner', cleanPrompt);
      setMessages(await getTutorMessages(db, user.id, course.id));

      let response: TutorResponse;
      try {
        response = await authorizedFetch('/api/tutor', {
          method: 'POST',
          body: JSON.stringify({
            deviceUserId: user.id,
            teacherLanguage: user.teacher_language_id === 'mr' ? 'Marathi' : 'English',
            targetLanguage: course.name,
            level: 'beginner',
            topic: cleanPrompt,
            learnerAnswer: cleanPrompt,
          }),
        }) as TutorResponse;
        setMode('online');
      } catch {
        response = offlineReply(course, cleanPrompt, messages.filter((message) => message.role === 'tutor').length);
        setMode('offline');
      }

      const choices = response.choices?.length ? `Try these: ${response.choices.join(' · ')}` : null;
      const reply = [response.targetText, response.explanation, choices, response.correction, response.encouragement].filter(Boolean).join('\n');
      await saveTutorMessage(db, user.id, course.id, 'tutor', reply || 'Let us practise one small step.', response.romanization ?? null, response.translation ?? null);
      setMessages(await getTutorMessages(db, user.id, course.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The tutor is unavailable. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function changeCourse(index: number) {
    learningAudio.stop();
    setCourseIndex(index);
    setMode(null);
    setInput('');
    setConfirmingClear(false);
    setErrorMessage(null);
    const user = await getLocalUser(db);
    const selectedCourse = courses[index];
    setMessages(user && selectedCourse ? await getTutorMessages(db, user.id, selectedCourse.id) : []);
  }

  async function clearConversation() {
    if (!course) return;
    const user = await getLocalUser(db);
    if (!user) return;
    await clearTutorMessages(db, user.id, course.id);
    learningAudio.stop();
    setMessages([]);
    setMode(null);
    setConfirmingClear(false);
  }

  function confirmNewConversation() {
    setConfirmingClear(true);
  }

  function audioRequest(text: string, key: string) {
    return { key, languageId: course!.id, locale: course!.locale, text };
  }

  function playTutorTarget(text: string, key: string, speed: LearningAudioSpeed) {
    learningAudio.play(audioRequest(text, key), speed);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerSurface}>
          <View style={styles.shell}>
            <View style={styles.header}>
              <View style={styles.headerCopy}><Text style={styles.eyebrow}>LIPI TUTOR</Text><Text style={styles.title}>Practise a conversation</Text><Text style={styles.subtitle}>{course ? `${course.name} · Beginner coaching` : 'Choose a course to begin'}</Text></View>
              <View style={styles.headerActions}>
                <View style={[styles.mode, mode === 'online' ? styles.online : mode === 'offline' ? styles.offline : styles.ready]}><Text style={styles.modeText}>{mode === 'online' ? '✦ AI ONLINE' : mode === 'offline' ? '● OFFLINE PACK' : '● READY'}</Text></View>
                {messages.length ? <Pressable onPress={confirmNewConversation} style={styles.newChat}><Text style={styles.newChatText}>New chat</Text></Pressable> : null}
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>{courses.map((item, index) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: index === courseIndex }} key={item.id} onPress={() => changeCourse(index)} style={[styles.coursePill, index === courseIndex && { backgroundColor: item.color, borderColor: item.accentColor }]}><Text style={[styles.courseText, index === courseIndex && { color: item.accentColor }]}>{item.nativeName}</Text>{index === courseIndex ? <View style={[styles.activeDot, { backgroundColor: item.accentColor }]} /> : null}</Pressable>)}</ScrollView>
            {confirmingClear ? <View style={styles.confirmPanel}><View style={styles.confirmCopy}><Text style={styles.confirmTitle}>Start a new {course?.name} conversation?</Text><Text style={styles.confirmBody}>The current tutor messages will be removed from this device.</Text></View><View style={styles.confirmActions}><Pressable onPress={() => setConfirmingClear(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Keep chat</Text></Pressable><Pressable onPress={clearConversation} style={styles.clearButton}><Text style={styles.clearText}>Start new</Text></Pressable></View></View> : null}
            {errorMessage ? <Pressable onPress={() => setErrorMessage(null)} style={styles.errorBanner}><Text style={styles.errorText}>{errorMessage}</Text><Text style={styles.errorClose}>×</Text></Pressable> : null}
          </View>
        </View>

        <ScrollView ref={chatRef} style={styles.chat} contentContainerStyle={styles.chatContent} keyboardShouldPersistTaps="handled" onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
          <View style={styles.chatColumn}>
            {!course ? <View style={styles.empty}><Text style={styles.emptyMark}>＋</Text><Text style={styles.emptyTitle}>Add a language from the Learn tab</Text><Text style={styles.emptyBody}>Your selected languages will appear here for conversation practice.</Text></View> : null}
            {course && !messages.length ? <View style={[styles.welcome, { borderColor: course.accentColor }]}><View style={styles.welcomeTop}><View><Text style={[styles.welcomeMark, { color: course.accentColor }]}>{course.preview}</Text><Text style={styles.welcomeTitle}>Your {course.name} coach is ready.</Text></View><View style={[styles.lessonBadge, { backgroundColor: course.color }]}><Text style={[styles.lessonBadgeText, { color: course.accentColor }]}>BEGINNER</Text></View></View><Text style={styles.welcomeBody}>Build a real conversation one small step at a time. Ask for a phrase, an introduction, a correction, or a quick memory check. Your history stays on this device.</Text><View style={styles.welcomePromptList}>{suggestedPrompts.slice(0, 3).map((item) => <Pressable disabled={working} key={item.label} onPress={() => askTutor(item.prompt)} style={styles.welcomePrompt}><Text style={styles.welcomePromptText}>{item.label}</Text><Text style={styles.welcomePromptArrow}>→</Text></Pressable>)}</View></View> : null}
            {messages.length ? <View style={styles.sessionDivider}><View style={styles.dividerLine} /><Text style={styles.sessionText}>CURRENT PRACTICE</Text><View style={styles.dividerLine} /></View> : null}
            {course ? messages.map((message) => <TutorMessage activeAudioKey={learningAudio.activeKey} activeAudioKind={learningAudio.kind} activeAudioSpeed={learningAudio.speed} course={course} hasRecording={(text, key) => learningAudio.hasRecording(audioRequest(text, key))} isAudioPlaying={learningAudio.isPlaying} key={message.id} message={message} playTarget={playTutorTarget} />) : null}
            {working ? <View style={styles.messageRow}><View style={[styles.avatar, styles.tutorAvatar]}><Text style={styles.tutorAvatarText}>✦</Text></View><View style={[styles.bubble, styles.tutorBubble, styles.thinkingBubble]}><View style={styles.typingDots}><View style={styles.typingDot} /><View style={styles.typingDot} /><View style={styles.typingDot} /></View><Text style={styles.thinking}>Preparing one clear practice step…</Text></View></View> : null}
          </View>
        </ScrollView>

        {course && messages.length ? <View style={styles.quickSurface}><View style={styles.quickShell}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}><Text style={styles.quickLabel}>TRY NEXT</Text>{suggestedPrompts.map((item) => <Pressable disabled={working} key={item.label} onPress={() => askTutor(item.prompt)} style={styles.quickPrompt}><Text style={styles.quickPromptText}>{item.label}</Text></Pressable>)}</ScrollView></View></View> : null}

        <View style={styles.composerSurface}>
          <View style={styles.composerShell}>
            <View style={styles.composer}>
              <TextInput value={input} onChangeText={setInput} placeholder={course ? `Ask your ${course.name} tutor…` : 'Choose a language to start…'} placeholderTextColor={colors.muted} editable={Boolean(course) && !working} multiline style={styles.input} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!course || working || !input.trim()} onPress={() => askTutor()} style={[styles.send, (!course || working || !input.trim()) && styles.disabled]}><Text style={styles.sendText}>↑</Text></Pressable>
            </View>
            <Text style={styles.composerHint}>{mode === 'offline' ? 'Offline lesson pack · saved privately on this device' : 'Lipi keeps answers short, practical, and beginner-friendly.'}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  shell: { width: '100%', maxWidth: 980, alignSelf: 'center' },
  headerSurface: { borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: '#FFFEFA' },
  header: { minHeight: 91, paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1, marginRight: 16 },
  eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { marginTop: 4, color: colors.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mode: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 },
  online: { backgroundColor: colors.mint },
  offline: { backgroundColor: '#F1EDDF' },
  ready: { backgroundColor: '#E9F1EE' },
  modeText: { color: colors.ink, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  newChat: { minHeight: 32, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  newChatText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  courseRow: { minHeight: 65, paddingHorizontal: 24, paddingVertical: 12, gap: 8, alignItems: 'center' },
  coursePill: { minHeight: 40, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  courseText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  activeDot: { width: 5, height: 5, marginLeft: 7, borderRadius: 3 },
  confirmPanel: { marginHorizontal: 24, marginBottom: 13, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: '#F2C8BC', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.coralSoft },
  confirmCopy: { flex: 1, marginRight: 12 },
  confirmTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  confirmBody: { marginTop: 3, color: colors.muted, fontSize: 9 },
  confirmActions: { flexDirection: 'row', gap: 7 },
  cancelButton: { minHeight: 34, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  cancelText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  clearButton: { minHeight: 34, paddingHorizontal: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coral },
  clearText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  errorBanner: { marginHorizontal: 24, marginBottom: 13, minHeight: 42, paddingHorizontal: 13, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBE4DE' },
  errorText: { flex: 1, color: '#8C3D31', fontSize: 10, fontWeight: '700' },
  errorClose: { marginLeft: 12, color: '#8C3D31', fontSize: 18, fontWeight: '700' },
  chat: { flex: 1 },
  chatContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20 },
  chatColumn: { width: '100%', maxWidth: 880, flexGrow: 1, alignSelf: 'center', justifyContent: 'flex-end', gap: 14 },
  welcome: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 24, borderRadius: 27, borderWidth: 1, backgroundColor: '#fff', boxShadow: '0 12px 30px rgba(25, 52, 47, 0.07)' },
  welcomeTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  welcomeMark: { fontSize: 34, fontWeight: '900', letterSpacing: 2 },
  welcomeTitle: { marginTop: 12, color: colors.ink, fontSize: 23, fontWeight: '900' },
  welcomeBody: { maxWidth: 620, marginTop: 11, color: colors.muted, fontSize: 13, lineHeight: 20 },
  lessonBadge: { marginLeft: 14, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  lessonBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  welcomePromptList: { marginTop: 21, gap: 8 },
  welcomePrompt: { minHeight: 46, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream },
  welcomePromptText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  welcomePromptArrow: { color: colors.coral, fontSize: 17, fontWeight: '900' },
  sessionDivider: { marginVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  sessionText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  messageRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-end' },
  learnerRow: { justifyContent: 'flex-end' },
  avatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tutorAvatar: { marginRight: 9, backgroundColor: colors.ink },
  tutorAvatarText: { color: colors.gold, fontSize: 15, fontWeight: '900' },
  learnerAvatar: { marginLeft: 9, backgroundColor: colors.coral },
  learnerAvatarText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  bubble: { maxWidth: '78%', padding: 16, borderRadius: 20 },
  learnerBubble: { minWidth: 170, borderBottomRightRadius: 6, backgroundColor: colors.coralSoft },
  tutorBubble: { width: '72%', maxWidth: 620, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6, backgroundColor: '#fff' },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  learnerRole: { color: colors.coral, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  tutorRole: { color: colors.mintDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  time: { marginLeft: 14, color: '#9AA7A2', fontSize: 8, fontWeight: '700' },
  learnerMessage: { marginTop: 7, color: colors.ink, fontSize: 13, lineHeight: 19 },
  targetText: { marginTop: 10, color: colors.ink, fontSize: 19, lineHeight: 27, fontWeight: '900' },
  romanization: { marginTop: 5, color: colors.coral, fontSize: 11, fontWeight: '800' },
  explanation: { marginTop: 8, color: colors.ink, fontSize: 12, lineHeight: 18 },
  meaning: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: '#F4F1E7' },
  meaningLabel: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  translation: { marginTop: 4, color: colors.ink, fontSize: 11, fontWeight: '700' },
  messageAudio: { marginTop: 12 },
  thinkingBubble: { width: 'auto', flexDirection: 'row', alignItems: 'center' },
  typingDots: { marginRight: 9, flexDirection: 'row', gap: 3 },
  typingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.coral },
  thinking: { color: colors.muted, fontSize: 11, fontStyle: 'italic' },
  empty: { maxWidth: 520, alignSelf: 'center', padding: 28, alignItems: 'center' },
  emptyMark: { color: colors.coral, fontSize: 32, fontWeight: '400' },
  emptyTitle: { marginTop: 12, color: colors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyBody: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  quickSurface: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#FFFEFA' },
  quickShell: { width: '100%', maxWidth: 940, alignSelf: 'center' },
  quickRow: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 8, alignItems: 'center', gap: 7 },
  quickLabel: { marginRight: 4, color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  quickPrompt: { minHeight: 34, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  quickPromptText: { color: colors.ink, fontSize: 9, fontWeight: '800' },
  composerSurface: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#FFFEFA' },
  composerShell: { width: '100%', maxWidth: 940, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  composer: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, minHeight: 50, maxHeight: 112, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.line, color: colors.ink, backgroundColor: '#fff', fontSize: 13 },
  send: { width: 50, height: 50, marginLeft: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  sendText: { color: colors.gold, fontSize: 22, fontWeight: '900' },
  composerHint: { marginTop: 6, color: colors.muted, fontSize: 8, textAlign: 'center' },
  disabled: { opacity: 0.35 },
});
