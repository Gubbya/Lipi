export type LanguageDirection = 'ltr' | 'rtl';

export interface Script {
  id: string;
  name: string;
  nativeName: string;
  direction: LanguageDirection;
  iso15924: string;
}

export interface PronunciationVariant {
  id: string;
  languageId: string;
  name: string;
  regionCode: string;
  description: string;
}

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  locale: string;
  script: Script;
  pronunciationVariants: PronunciationVariant[];
}
