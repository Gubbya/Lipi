export type OrthographicUnitType = 'letter' | 'grapheme' | 'syllable' | 'word';

export interface OrthographicUnit {
  id: string;
  languageId: string;
  scriptId: string;
  type: OrthographicUnitType;
  symbol: string;
  displayName: string;
  transliteration?: string;
  audioAsset?: string;
  soundHint?: string;
  speechCue?: string;
  exampleWords?: string[];
}

export interface GraphemePhonemeMapping {
  id: string;
  graphemeUnitId: string;
  phonemeIds: string[];
  context?: string;
  examples: string[];
}
