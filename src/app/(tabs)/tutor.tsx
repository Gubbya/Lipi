import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Speech from 'expo-speech';
import { getCourse } from '@/content/course-catalog';
import { phrasebook } from '@/content/phrasebook';
import { getLocalUser, getSelectedLanguages } from '@/db/onboarding';
import { getTutorMessages, saveTutorMessage, type TutorMessageRow } from '@/db/tutor';
import { authorizedFetch } from '@/services/app-config';
import { colors } from '@/features/onboarding/theme';
import type { LanguageCourse } from '@/models';

interface TutorResponse {
  explanation?: string;
  targetText?: string;
  romanization?: string;
  translation?: string;
  correction?: string;
  encouragement?: string;
}

function offlineReply(course: LanguageCourse, learnerAnswer: string): TutorResponse {
  const phrases = phrasebook[course.id] ?? [];
  const phrase = phrases[Math.abs(learnerAnswer.length) % Math.max(1, phrases.length)];
  if (!phrase) return { targetText: course.nativeName, translation: course.name, explanation: `Open the ${course.name} course to practise its script foundations.`, encouragement: 'Small daily practice makes a difference.' };
  return {
    targetText: phrase.native,
    romanization: phrase.romanization,
    translation: phrase.english,
    explanation: `Offline practice: listen, repeat three times, then say it without looking.`,
    encouragement: 'Good practice — repeat slowly and clearly.',
  };
}

export default function TutorScreen() {
  const db = useSQLiteContext();
  const [courses, setCourses] = useState<LanguageCourse[]>([]);
  const [courseIndex, setCourseIndex] = useState(0);
  const [messages, setMessages] = useState<TutorMessageRow[]>([]);
  const [input, setInput] = useState('Teach me a useful beginner phrase.');
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState<'online' | 'offline' | null>(null);
  const course = courses[courseIndex % Math.max(1, courses.length)] ?? null;

  const load = useCallback(async () => {
    const user = await getLocalUser(db);
    if (!user) return;
    const selected = await getSelectedLanguages(db, user.id);
    const nextCourses = selected.map((item) => getCourse(item.language_id)).filter((item): item is LanguageCourse => Boolean(item));
    setCourses(nextCourses);
    const activeCourse = nextCourses[courseIndex % Math.max(1, nextCourses.length)];
    if (activeCourse) setMessages(await getTutorMessages(db, user.id, activeCourse.id));
  }, [courseIndex, db]);

  useFocusEffect(useCallback(() => { load(); return () => Speech.stop(); }, [load]));

  const suggestedPrompts = useMemo(() => ['Teach a greeting', 'Correct my sentence', 'Give me a tiny quiz'], []);

  async function askTutor(prompt = input) {
    if (!course || !prompt.trim() || working) return;
    setWorking(true);
    try {
      const user = await getLocalUser(db);
      if (!user) return;
      await saveTutorMessage(db, user.id, course.id, 'learner', prompt.trim());
      let response: TutorResponse;
      try {
        response = await authorizedFetch('/api/tutor', {
          method: 'POST',
          body: JSON.stringify({
            deviceUserId: user.id,
            teacherLanguage: user.teacher_language_id === 'mr' ? 'Marathi' : 'English',
            targetLanguage: course.name,
            level: 'beginner',
            topic: prompt.trim(),
            learnerAnswer: prompt.trim(),
          }),
        }) as TutorResponse;
        setMode('online');
      } catch {
        response = offlineReply(course, prompt.trim());
        setMode('offline');
      }
      const message = [response.targetText, response.explanation, response.correction, response.encouragement].filter(Boolean).join('\n');
      await saveTutorMessage(db, user.id, course.id, 'tutor', message, response.romanization ?? null, response.translation ?? null);
      setInput('');
      setMessages(await getTutorMessages(db, user.id, course.id));
    } finally { setWorking(false); }
  }

  async function changeCourse(index: number) {
    setCourseIndex(index);
    setMode(null);
    const user = await getLocalUser(db);
    const selectedCourse = courses[index];
    if (user && selectedCourse) setMessages(await getTutorMessages(db, user.id, selectedCourse.id));
  }

  return (
    <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>LIPI TUTOR</Text><Text style={styles.title}>Practise a conversation</Text></View>{mode ? <View style={[styles.mode, mode === 'online' ? styles.online : styles.offline]}><Text style={styles.modeText}>{mode === 'online' ? '✦ AI' : 'OFFLINE'}</Text></View> : null}</View>
      <View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>{courses.map((item, index) => <Pressable key={item.id} onPress={() => changeCourse(index)} style={[styles.coursePill, index === courseIndex && { backgroundColor: item.color, borderColor: item.accentColor }]}><Text style={[styles.courseText, index === courseIndex && { color: item.accentColor }]}>{item.nativeName}</Text></Pressable>)}</ScrollView></View>
      <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent}>
        {!course ? <View style={styles.empty}><Text style={styles.emptyTitle}>Choose a language on the Learn tab first.</Text></View> : null}
        {course && !messages.length ? <View style={styles.welcome}><Text style={styles.welcomeMark}>{course.preview}</Text><Text style={styles.welcomeTitle}>Your {course.name} tutor is ready.</Text><Text style={styles.welcomeBody}>Ask for a phrase, a correction, or a tiny quiz. Lipi falls back to bundled offline practice when your private server is unavailable.</Text><View style={styles.promptList}>{suggestedPrompts.map((prompt) => <Pressable key={prompt} onPress={() => { setInput(prompt); askTutor(prompt); }} style={styles.prompt}><Text style={styles.promptText}>{prompt} →</Text></Pressable>)}</View></View> : null}
        {messages.map((message) => <View key={message.id} style={[styles.bubble, message.role === 'learner' ? styles.learnerBubble : styles.tutorBubble]}><View style={styles.bubbleHeader}><Text style={styles.role}>{message.role === 'learner' ? 'YOU' : 'LIPI'}</Text>{message.role === 'tutor' && course ? <Pressable onPress={() => Speech.speak(message.message.split('\n')[0], { language: course.locale, rate: 0.65 })}><Text style={styles.speak}>♪ hear</Text></Pressable> : null}</View><Text style={styles.message}>{message.message}</Text>{message.romanization ? <Text style={styles.romanization}>{message.romanization}</Text> : null}{message.translation ? <Text style={styles.translation}>{message.translation}</Text> : null}</View>)}
        {working ? <View style={[styles.bubble, styles.tutorBubble]}><Text style={styles.thinking}>Lipi is preparing a short lesson…</Text></View> : null}
      </ScrollView>
      <View style={styles.composer}><TextInput value={input} onChangeText={setInput} placeholder="Ask your tutor…" placeholderTextColor={colors.muted} multiline style={styles.input} /><Pressable disabled={!course || working || !input.trim()} onPress={() => askTutor()} style={[styles.send, (!course || working || !input.trim()) && styles.disabled]}><Text style={styles.sendText}>↑</Text></Pressable></View>
    </KeyboardAvoidingView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, flex: { flex: 1 }, header: { paddingHorizontal: 24, paddingTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { marginTop: 4, color: colors.ink, fontSize: 25, fontWeight: '900' }, mode: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11 }, online: { backgroundColor: colors.mint }, offline: { backgroundColor: '#E9E5D9' }, modeText: { color: colors.ink, fontSize: 9, fontWeight: '900' }, courseRow: { paddingHorizontal: 24, paddingVertical: 17, gap: 8 }, coursePill: { minHeight: 39, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, courseText: { color: colors.muted, fontSize: 12, fontWeight: '800' }, chat: { flex: 1 }, chatContent: { paddingHorizontal: 24, paddingBottom: 16, gap: 11 }, welcome: { padding: 20, borderRadius: 25, backgroundColor: colors.ink }, welcomeMark: { color: colors.gold, fontSize: 30, fontWeight: '900' }, welcomeTitle: { marginTop: 13, color: '#fff', fontSize: 20, fontWeight: '900' }, welcomeBody: { marginTop: 8, color: '#C9D8D3', fontSize: 12, lineHeight: 18 }, promptList: { marginTop: 16, gap: 8 }, prompt: { minHeight: 40, paddingHorizontal: 13, borderRadius: 12, justifyContent: 'center', backgroundColor: '#294A43' }, promptText: { color: '#fff', fontSize: 11, fontWeight: '800' }, bubble: { maxWidth: '90%', padding: 15, borderRadius: 19 }, learnerBubble: { alignSelf: 'flex-end', backgroundColor: colors.coralSoft, borderBottomRightRadius: 6 }, tutorBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6 }, bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, role: { color: colors.coral, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, speak: { marginLeft: 20, color: colors.mintDark, fontSize: 9, fontWeight: '800' }, message: { marginTop: 6, color: colors.ink, fontSize: 13, lineHeight: 19 }, romanization: { marginTop: 7, color: colors.coral, fontSize: 11, fontWeight: '700' }, translation: { marginTop: 4, color: colors.muted, fontSize: 10 }, thinking: { color: colors.muted, fontSize: 12, fontStyle: 'italic' }, empty: { padding: 20 }, emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' }, composer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFEFA' }, input: { flex: 1, minHeight: 48, maxHeight: 100, paddingHorizontal: 15, paddingVertical: 13, borderRadius: 17, borderWidth: 1, borderColor: colors.line, color: colors.ink, backgroundColor: '#fff', fontSize: 13 }, send: { width: 48, height: 48, marginLeft: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, sendText: { color: colors.gold, fontSize: 22, fontWeight: '900' }, disabled: { opacity: 0.35 },
});
