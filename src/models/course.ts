export type VocabularyImageKey = 'hello' | 'water' | 'book' | 'sun' | 'cat' | 'house';

export interface ScriptUnit {
  id: string;
  symbol: string;
  name: string;
  romanization: string;
  soundHint: string;
  example?: string;
}

export interface StarterLesson {
  id: string;
  section?: string;
  title: string;
  description: string;
  units: ScriptUnit[];
}

export interface VocabularyEntry {
  concept: VocabularyImageKey;
  native: string;
  romanization: string;
  english: string;
}

export interface PhraseEntry {
  native: string;
  romanization: string;
  english: string;
}

export interface LanguageCourse {
  id: string;
  name: string;
  nativeName: string;
  locale: string;
  scriptName: string;
  direction: 'ltr' | 'rtl';
  color: string;
  accentColor: string;
  preview: string;
  description: string;
  lessons: StarterLesson[];
  vocabulary: VocabularyEntry[];
}
