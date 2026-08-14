import type { AudioSource } from 'expo-audio';

type AudioVariants = { us: AudioSource; uk: AudioSource };

export const phonicsAudio: Record<string, AudioVariants> = {
  'en-letter-a': { us: require('../../assets/audio/en-US/en-letter-a.wav'), uk: require('../../assets/audio/en-GB/en-letter-a.wav') },
  'en-letter-b': { us: require('../../assets/audio/en-US/en-letter-b.wav'), uk: require('../../assets/audio/en-GB/en-letter-b.wav') },
  'en-letter-c': { us: require('../../assets/audio/en-US/en-letter-c.wav'), uk: require('../../assets/audio/en-GB/en-letter-c.wav') },
  'en-letter-d': { us: require('../../assets/audio/en-US/en-letter-d.wav'), uk: require('../../assets/audio/en-GB/en-letter-d.wav') },
  'en-letter-e': { us: require('../../assets/audio/en-US/en-letter-e.wav'), uk: require('../../assets/audio/en-GB/en-letter-e.wav') },
  'en-letter-f': { us: require('../../assets/audio/en-US/en-letter-f.wav'), uk: require('../../assets/audio/en-GB/en-letter-f.wav') },
  'en-letter-g': { us: require('../../assets/audio/en-US/en-letter-g.wav'), uk: require('../../assets/audio/en-GB/en-letter-g.wav') },
  'en-letter-h': { us: require('../../assets/audio/en-US/en-letter-h.wav'), uk: require('../../assets/audio/en-GB/en-letter-h.wav') },
  'en-letter-i': { us: require('../../assets/audio/en-US/en-letter-i.wav'), uk: require('../../assets/audio/en-GB/en-letter-i.wav') },
  'en-letter-j': { us: require('../../assets/audio/en-US/en-letter-j.wav'), uk: require('../../assets/audio/en-GB/en-letter-j.wav') },
  'en-letter-k': { us: require('../../assets/audio/en-US/en-letter-k.wav'), uk: require('../../assets/audio/en-GB/en-letter-k.wav') },
  'en-letter-l': { us: require('../../assets/audio/en-US/en-letter-l.wav'), uk: require('../../assets/audio/en-GB/en-letter-l.wav') },
  'en-letter-m': { us: require('../../assets/audio/en-US/en-letter-m.wav'), uk: require('../../assets/audio/en-GB/en-letter-m.wav') },
  'en-letter-n': { us: require('../../assets/audio/en-US/en-letter-n.wav'), uk: require('../../assets/audio/en-GB/en-letter-n.wav') },
  'en-letter-o': { us: require('../../assets/audio/en-US/en-letter-o.wav'), uk: require('../../assets/audio/en-GB/en-letter-o.wav') },
  'en-letter-p': { us: require('../../assets/audio/en-US/en-letter-p.wav'), uk: require('../../assets/audio/en-GB/en-letter-p.wav') },
  'en-letter-q': { us: require('../../assets/audio/en-US/en-letter-q.wav'), uk: require('../../assets/audio/en-GB/en-letter-q.wav') },
  'en-letter-r': { us: require('../../assets/audio/en-US/en-letter-r.wav'), uk: require('../../assets/audio/en-GB/en-letter-r.wav') },
  'en-letter-s': { us: require('../../assets/audio/en-US/en-letter-s.wav'), uk: require('../../assets/audio/en-GB/en-letter-s.wav') },
  'en-letter-t': { us: require('../../assets/audio/en-US/en-letter-t.wav'), uk: require('../../assets/audio/en-GB/en-letter-t.wav') },
  'en-letter-u': { us: require('../../assets/audio/en-US/en-letter-u.wav'), uk: require('../../assets/audio/en-GB/en-letter-u.wav') },
  'en-letter-v': { us: require('../../assets/audio/en-US/en-letter-v.wav'), uk: require('../../assets/audio/en-GB/en-letter-v.wav') },
  'en-letter-w': { us: require('../../assets/audio/en-US/en-letter-w.wav'), uk: require('../../assets/audio/en-GB/en-letter-w.wav') },
  'en-letter-x': { us: require('../../assets/audio/en-US/en-letter-x.wav'), uk: require('../../assets/audio/en-GB/en-letter-x.wav') },
  'en-letter-y': { us: require('../../assets/audio/en-US/en-letter-y.wav'), uk: require('../../assets/audio/en-GB/en-letter-y.wav') },
  'en-letter-z': { us: require('../../assets/audio/en-US/en-letter-z.wav'), uk: require('../../assets/audio/en-GB/en-letter-z.wav') },
  'en-grapheme-ch': { us: require('../../assets/audio/en-US/en-grapheme-ch.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ch.wav') },
  'en-grapheme-sh': { us: require('../../assets/audio/en-US/en-grapheme-sh.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-sh.wav') },
  'en-grapheme-th': { us: require('../../assets/audio/en-US/en-grapheme-th.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-th.wav') },
  'en-grapheme-wh': { us: require('../../assets/audio/en-US/en-grapheme-wh.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-wh.wav') },
  'en-grapheme-ng': { us: require('../../assets/audio/en-US/en-grapheme-ng.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ng.wav') },
  'en-grapheme-ck': { us: require('../../assets/audio/en-US/en-grapheme-ck.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ck.wav') },
  'en-grapheme-ai': { us: require('../../assets/audio/en-US/en-grapheme-ai.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ai.wav') },
  'en-grapheme-ay': { us: require('../../assets/audio/en-US/en-grapheme-ay.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ay.wav') },
  'en-grapheme-ee': { us: require('../../assets/audio/en-US/en-grapheme-ee.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ee.wav') },
  'en-grapheme-ea': { us: require('../../assets/audio/en-US/en-grapheme-ea.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ea.wav') },
  'en-grapheme-igh': { us: require('../../assets/audio/en-US/en-grapheme-igh.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-igh.wav') },
  'en-grapheme-oa': { us: require('../../assets/audio/en-US/en-grapheme-oa.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-oa.wav') },
  'en-grapheme-oo': { us: require('../../assets/audio/en-US/en-grapheme-oo.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-oo.wav') },
  'en-grapheme-ou': { us: require('../../assets/audio/en-US/en-grapheme-ou.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ou.wav') },
  'en-grapheme-ow': { us: require('../../assets/audio/en-US/en-grapheme-ow.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ow.wav') },
  'en-grapheme-oi': { us: require('../../assets/audio/en-US/en-grapheme-oi.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-oi.wav') },
  'en-grapheme-oy': { us: require('../../assets/audio/en-US/en-grapheme-oy.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-oy.wav') },
  'en-grapheme-aw': { us: require('../../assets/audio/en-US/en-grapheme-aw.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-aw.wav') },
  'en-grapheme-au': { us: require('../../assets/audio/en-US/en-grapheme-au.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-au.wav') },
  'en-grapheme-ar': { us: require('../../assets/audio/en-US/en-grapheme-ar.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ar.wav') },
  'en-grapheme-or': { us: require('../../assets/audio/en-US/en-grapheme-or.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-or.wav') },
  'en-grapheme-er': { us: require('../../assets/audio/en-US/en-grapheme-er.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-er.wav') },
  'en-grapheme-ir': { us: require('../../assets/audio/en-US/en-grapheme-ir.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ir.wav') },
  'en-grapheme-ur': { us: require('../../assets/audio/en-US/en-grapheme-ur.wav'), uk: require('../../assets/audio/en-GB/en-grapheme-ur.wav') },
};

const quizAudio: Record<string, AudioVariants> = {
  'quiz-alphabet-a-e': { us: require('../../assets/audio/en-US/quiz-alphabet-a-e-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-alphabet-a-e-prompt.wav') },
  'quiz-alphabet-f-j': { us: require('../../assets/audio/en-US/quiz-alphabet-f-j-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-alphabet-f-j-prompt.wav') },
  'quiz-alphabet-k-o': { us: require('../../assets/audio/en-US/quiz-alphabet-k-o-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-alphabet-k-o-prompt.wav') },
  'quiz-alphabet-p-t': { us: require('../../assets/audio/en-US/quiz-alphabet-p-t-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-alphabet-p-t-prompt.wav') },
  'quiz-alphabet-u-z': { us: require('../../assets/audio/en-US/quiz-alphabet-u-z-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-alphabet-u-z-prompt.wav') },
  'quiz-consonant-teams': { us: require('../../assets/audio/en-US/quiz-consonant-teams-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-consonant-teams-prompt.wav') },
  'quiz-vowel-teams': { us: require('../../assets/audio/en-US/quiz-vowel-teams-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-vowel-teams-prompt.wav') },
  'quiz-special-vowels': { us: require('../../assets/audio/en-US/quiz-special-vowels-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-special-vowels-prompt.wav') },
  'quiz-r-controlled': { us: require('../../assets/audio/en-US/quiz-r-controlled-prompt.wav'), uk: require('../../assets/audio/en-GB/quiz-r-controlled-prompt.wav') },
};

const feedbackAudio: Record<'correct' | 'try-again', AudioVariants> = {
  correct: { us: require('../../assets/audio/en-US/feedback-correct.wav'), uk: require('../../assets/audio/en-GB/feedback-correct.wav') },
  'try-again': { us: require('../../assets/audio/en-US/feedback-try-again.wav'), uk: require('../../assets/audio/en-GB/feedback-try-again.wav') },
};

function selectVariant(variants: AudioVariants | undefined, pronunciationVariantId: string) {
  if (!variants) return null;
  return pronunciationVariantId === 'en-GB' ? variants.uk : variants.us;
}

export function getPhonicsAudio(unitId: string, pronunciationVariantId: string): AudioSource | null {
  return selectVariant(phonicsAudio[unitId], pronunciationVariantId);
}

export function getQuizAudio(activityId: string, pronunciationVariantId: string): AudioSource | null {
  return selectVariant(quizAudio[activityId], pronunciationVariantId);
}

export function getFeedbackAudio(kind: 'correct' | 'try-again', pronunciationVariantId: string): AudioSource {
  return selectVariant(feedbackAudio[kind], pronunciationVariantId)!;
}
