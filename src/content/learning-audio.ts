import type { AudioSource } from 'expo-audio';
import { getPhonicsAudio } from './phonics-audio';
import { getMarathiTextAudio, getMarathiUnitAudio } from './marathi-audio.generated';
import { getMultilingualTextAudio, getMultilingualUnitAudio } from './multilingual-audio.generated';
import { getEnglishContentAudio } from './english-content-audio.generated';

export interface LearningAudioLookup {
  languageId: string;
  pronunciationVariantId?: string;
  text: string;
  unitId?: string;
}

export function getLearningAudioSource(lookup: LearningAudioLookup): AudioSource | null {
  if (lookup.languageId === 'en') {
    const variant = lookup.pronunciationVariantId ?? 'en-US';
    return (lookup.unitId ? getPhonicsAudio(lookup.unitId, variant) : null) ?? getEnglishContentAudio(lookup.text, variant);
  }
  if (lookup.languageId === 'mr') {
    return (lookup.unitId ? getMarathiUnitAudio(lookup.unitId) : null) ?? getMarathiTextAudio(lookup.text);
  }
  return (lookup.unitId ? getMultilingualUnitAudio(lookup.languageId, lookup.unitId) : null)
    ?? getMultilingualTextAudio(lookup.languageId, lookup.text);
}
