import type { AudioSource } from 'expo-audio';
import { getPhonicsAudio } from './phonics-audio';
import { getMarathiTextAudio, getMarathiUnitAudio } from './marathi-audio.generated';

export interface LearningAudioLookup {
  languageId: string;
  pronunciationVariantId?: string;
  text: string;
  unitId?: string;
}

export function getLearningAudioSource(lookup: LearningAudioLookup): AudioSource | null {
  if (lookup.languageId === 'en' && lookup.unitId) {
    return getPhonicsAudio(lookup.unitId, lookup.pronunciationVariantId ?? 'en-US');
  }
  if (lookup.languageId === 'mr') {
    return (lookup.unitId ? getMarathiUnitAudio(lookup.unitId) : null) ?? getMarathiTextAudio(lookup.text);
  }
  return null;
}
