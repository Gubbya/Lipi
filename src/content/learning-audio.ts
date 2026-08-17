import { getEnglishContentAudioPath } from './english-content-audio.generated';
import { getMarathiTextAudioPath, getMarathiUnitAudioPath } from './marathi-audio.generated';
import { getMultilingualTextAudioPath, getMultilingualUnitAudioPath } from './multilingual-audio.generated';
import { getFeedbackAudioPath, getPhonicsAudioPath, getQuizAudioPath } from './phonics-audio';

export interface LearningAudioLookup {
  languageId: string;
  pronunciationVariantId?: string;
  text: string;
  unitId?: string;
}

function getEnglishUnitAudioPath(unitId: string, pronunciationVariantId: string) {
  if (unitId === 'feedback-correct') return getFeedbackAudioPath('correct', pronunciationVariantId);
  if (unitId === 'feedback-try-again') return getFeedbackAudioPath('try-again', pronunciationVariantId);
  return getPhonicsAudioPath(unitId, pronunciationVariantId)
    ?? getQuizAudioPath(unitId, pronunciationVariantId);
}

export function getLearningAudioPath(lookup: LearningAudioLookup): string | null {
  if (lookup.languageId === 'en') {
    const variant = lookup.pronunciationVariantId ?? 'en-US';
    return (lookup.unitId ? getEnglishUnitAudioPath(lookup.unitId, variant) : null)
      ?? getEnglishContentAudioPath(lookup.text, variant);
  }
  if (lookup.languageId === 'mr') {
    return (lookup.unitId ? getMarathiUnitAudioPath(lookup.unitId) : null)
      ?? getMarathiTextAudioPath(lookup.text);
  }
  return (lookup.unitId ? getMultilingualUnitAudioPath(lookup.languageId, lookup.unitId) : null)
    ?? getMultilingualTextAudioPath(lookup.languageId, lookup.text);
}

export function getLessonAudioPaths(
  languageId: string,
  locale: string,
  unitIds: string[],
  extraUnitIds: string[] = [],
) {
  const pronunciationVariantId = languageId === 'en' ? locale : undefined;
  return [...new Set([...unitIds, ...extraUnitIds]
    .map((unitId) => getLearningAudioPath({ languageId, pronunciationVariantId, text: '', unitId }))
    .filter((path): path is string => Boolean(path)))];
}

export function hasLearningAudioRecording(lookup: LearningAudioLookup) {
  return Boolean(getLearningAudioPath(lookup));
}
