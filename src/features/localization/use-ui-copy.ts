import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocalUser } from '@/db/onboarding';

const en = {
  languageShelf: 'YOUR LANGUAGE SHELF', shelfTitle: 'Learn one. Connect many.', shelfIntro: 'Each course builds its script and sounds separately. Puzzles can mix everything you select.',
  manageShelf: 'Manage language shelf', englishCourse: 'ENGLISH COURSE', phonicsPath: 'Phonics path', course: 'Course',
  scriptFoundations: 'Script foundations', worksheet: 'Worksheet', pictureVocabulary: 'Picture vocabulary', hearPronunciation: '♪ Hear pronunciation', nextSymbol: 'Next symbol', quickCheck: 'Quick check',
  lessonComplete: 'LESSON COMPLETE', repeatSaved: 'You can repeat this lesson whenever you want. Every repeat is saved.',
  mixedPuzzle: 'MIXED-LANGUAGE PUZZLE', pictureMatch: 'Picture match', tryAgain: 'Not that one—try again.', correct: 'Correct!', nextPuzzle: 'Next puzzle', seeResult: 'See result',
  whichWord: (word: string) => `Which word means “${word}”?`, whichSymbol: (sound: string) => `Which symbol is “${sound}”?`,
};

const mr: typeof en = {
  languageShelf: 'तुमची भाषा यादी', shelfTitle: 'एक शिका. अनेक जोडा.', shelfIntro: 'प्रत्येक भाषा स्वतंत्रपणे शिका. पझलमध्ये निवडलेल्या भाषा एकत्र सराव करा.',
  manageShelf: 'भाषा निवड बदला', englishCourse: 'इंग्रजी अभ्यासक्रम', phonicsPath: 'ध्वनी शिकण्याचा मार्ग', course: 'अभ्यासक्रम',
  scriptFoundations: 'लिपीची ओळख', worksheet: 'सरावपत्रिका', pictureVocabulary: 'चित्र शब्दसंग्रह', hearPronunciation: '♪ उच्चार ऐका', nextSymbol: 'पुढील अक्षर', quickCheck: 'छोटी चाचणी',
  lessonComplete: 'धडा पूर्ण', repeatSaved: 'हा धडा तुम्ही पुन्हा कधीही करू शकता. प्रत्येक सराव जतन केला जातो.',
  mixedPuzzle: 'अनेक भाषांचे पझल', pictureMatch: 'चित्र जुळवा', tryAgain: 'हे नाही—पुन्हा प्रयत्न करा.', correct: 'बरोबर!', nextPuzzle: 'पुढील पझल', seeResult: 'निकाल पाहा',
  whichWord: (word: string) => `“${word}” या अर्थाचा शब्द कोणता?`, whichSymbol: (sound: string) => `“${sound}” हे कोणते अक्षर आहे?`,
};

export function useUiCopy() {
  const db = useSQLiteContext();
  const [teacherLanguage, setTeacherLanguage] = useState('en');
  useEffect(() => {
    (async () => {
      const user = await getLocalUser(db);
      if (user) setTeacherLanguage(user.teacher_language_id);
    })();
  }, [db]);
  return teacherLanguage === 'mr' ? mr : en;
}
