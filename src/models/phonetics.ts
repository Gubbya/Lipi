export type PhonemeCategory = 'vowel' | 'consonant' | 'diphthong' | 'suprasegmental';

export interface Phoneme {
  id: string;
  languageId: string;
  ipa: string;
  category: PhonemeCategory;
  description: string;
  mouthPositionHint?: string;
  audioAsset?: string;
}
