import { phrasebook } from './phrasebook';
import type { LanguageCourse, ScriptUnit, StarterLesson } from '@/models';

type UnitSeed = [symbol: string, romanization: string, soundHint: string];

const numbers: Record<string, UnitSeed[]> = {
  mr: [['एक', 'ek', 'one'], ['दोन', 'don', 'two'], ['तीन', 'tīn', 'three'], ['चार', 'chār', 'four'], ['पाच', 'pāch', 'five']],
  hi: [['एक', 'ek', 'one'], ['दो', 'do', 'two'], ['तीन', 'tīn', 'three'], ['चार', 'chār', 'four'], ['पाँच', 'pāñch', 'five']],
  fr: [['un', 'uhn', 'one'], ['deux', 'duh', 'two'], ['trois', 'trwah', 'three'], ['quatre', 'katr', 'four'], ['cinq', 'sank', 'five']],
  es: [['uno', 'oo-no', 'one'], ['dos', 'dohs', 'two'], ['tres', 'trehs', 'three'], ['cuatro', 'kwah-tro', 'four'], ['cinco', 'seen-ko', 'five']],
  it: [['uno', 'oo-no', 'one'], ['due', 'doo-eh', 'two'], ['tre', 'treh', 'three'], ['quattro', 'kwat-tro', 'four'], ['cinque', 'cheen-kweh', 'five']],
  de: [['eins', 'ayns', 'one'], ['zwei', 'tsvai', 'two'], ['drei', 'drai', 'three'], ['vier', 'feer', 'four'], ['fünf', 'fuenf', 'five']],
  ru: [['один', 'odin', 'one'], ['два', 'dva', 'two'], ['три', 'tri', 'three'], ['четыре', 'chetyre', 'four'], ['пять', 'pyat', 'five']],
  ar: [['واحد', 'wāḥid', 'one'], ['اثنان', 'ithnān', 'two'], ['ثلاثة', 'thalātha', 'three'], ['أربعة', 'arbaʿa', 'four'], ['خمسة', 'khamsa', 'five']],
  zh: [['一', 'yī', 'one'], ['二', 'èr', 'two'], ['三', 'sān', 'three'], ['四', 'sì', 'four'], ['五', 'wǔ', 'five']],
  ja: [['一', 'ichi', 'one'], ['二', 'ni', 'two'], ['三', 'san', 'three'], ['四', 'yon', 'four'], ['五', 'go', 'five']],
  ko: [['하나', 'hana', 'one'], ['둘', 'dul', 'two'], ['셋', 'set', 'three'], ['넷', 'net', 'four'], ['다섯', 'daseot', 'five']],
  kn: [['ಒಂದು', 'ondu', 'one'], ['ಎರಡು', 'eraḍu', 'two'], ['ಮೂರು', 'mūru', 'three'], ['ನಾಲ್ಕು', 'nālku', 'four'], ['ಐದು', 'aidu', 'five']],
  pa: [['ਇੱਕ', 'ikk', 'one'], ['ਦੋ', 'do', 'two'], ['ਤਿੰਨ', 'tinn', 'three'], ['ਚਾਰ', 'chār', 'four'], ['ਪੰਜ', 'pañj', 'five']],
  gu: [['એક', 'ek', 'one'], ['બે', 'be', 'two'], ['ત્રણ', 'traṇ', 'three'], ['ચાર', 'chār', 'four'], ['પાંચ', 'pāñch', 'five']],
  te: [['ఒకటి', 'okaṭi', 'one'], ['రెండు', 'reṇḍu', 'two'], ['మూడు', 'mūḍu', 'three'], ['నాలుగు', 'nālugu', 'four'], ['ఐదు', 'aidu', 'five']],
  sa: [['एकम्', 'ekam', 'one'], ['द्वे', 'dve', 'two'], ['त्रीणि', 'trīṇi', 'three'], ['चत्वारि', 'catvāri', 'four'], ['पञ्च', 'pañca', 'five']],
};

const scriptContinuation: Record<string, UnitSeed[]> = {
  mr: [['ए', 'e', 'long e'], ['ऐ', 'ai', 'ai sound'], ['ओ', 'o', 'long o'], ['औ', 'au', 'au sound'], ['अं', 'aṃ', 'nasal vowel'], ['अः', 'aḥ', 'breathy visarga']],
  hi: [['ए', 'e', 'long e'], ['ऐ', 'ai', 'ai sound'], ['ओ', 'o', 'long o'], ['औ', 'au', 'au sound'], ['अं', 'aṃ', 'nasal vowel'], ['अः', 'aḥ', 'visarga']],
  fr: [['G g', 'gé', 'zhay'], ['H h', 'ache', 'ahsh'], ['I i', 'i', 'ee'], ['J j', 'ji', 'zhee'], ['K k', 'ka', 'kah'], ['L l', 'elle', 'el']],
  es: [['B b', 'be', 'beh'], ['C c', 'ce', 'seh'], ['D d', 'de', 'deh'], ['F f', 'efe', 'eh-feh'], ['G g', 'ge', 'heh'], ['H h', 'hache', 'silent h']],
  it: [['B b', 'bi', 'bee'], ['C c', 'ci', 'chee'], ['D d', 'di', 'dee'], ['F f', 'effe', 'ef-feh'], ['G g', 'gi', 'jee'], ['L l', 'elle', 'el-leh']],
  de: [['G g', 'ge', 'gay'], ['H h', 'ha', 'hah'], ['I i', 'i', 'ee'], ['J j', 'jot', 'yot'], ['K k', 'ka', 'kah'], ['L l', 'el', 'el']],
  ru: [['М м', 'em', 'm sound'], ['Н н', 'en', 'n sound'], ['О о', 'o', 'o sound'], ['П п', 'pe', 'p sound'], ['Р р', 'er', 'rolled r'], ['С с', 'es', 's sound']],
  ar: [['ش', 'shīn', 'sh sound'], ['ص', 'ṣād', 'emphatic s'], ['ض', 'ḍād', 'emphatic d'], ['ط', 'ṭāʼ', 'emphatic t'], ['ظ', 'ẓāʼ', 'emphatic dh'], ['ع', 'ʿayn', 'deep throat sound']],
  zh: [['七', 'qī', 'seven'], ['八', 'bā', 'eight'], ['九', 'jiǔ', 'nine'], ['十', 'shí', 'ten'], ['日', 'rì', 'sun or day'], ['月', 'yuè', 'moon or month']],
  ja: [['さ', 'sa', 'sa'], ['し', 'shi', 'shi'], ['す', 'su', 'su'], ['せ', 'se', 'se'], ['そ', 'so', 'so'], ['た', 'ta', 'ta']],
  ko: [['ㅐ', 'ae', 'ae vowel'], ['ㅔ', 'e', 'e vowel'], ['ㅚ', 'oe', 'oe vowel'], ['ㅟ', 'wi', 'wi vowel'], ['ㅡ', 'eu', 'eu vowel'], ['ㅣ', 'i', 'ee vowel']],
  kn: [['ಎ', 'e', 'short e'], ['ಏ', 'ē', 'long e'], ['ಐ', 'ai', 'ai sound'], ['ಒ', 'o', 'short o'], ['ಓ', 'ō', 'long o'], ['ಔ', 'au', 'au sound']],
  pa: [['ਘ', 'ghagghā', 'aspirated gh'], ['ਙ', 'ṅaṅṅā', 'nasal ng'], ['ਚ', 'chachā', 'ch sound'], ['ਛ', 'chhachhā', 'aspirated ch'], ['ਜ', 'jajjā', 'j sound'], ['ਝ', 'jhajjhā', 'aspirated j']],
  gu: [['એ', 'e', 'long e'], ['ઐ', 'ai', 'ai sound'], ['ઓ', 'o', 'long o'], ['ઔ', 'au', 'au sound'], ['અં', 'aṃ', 'nasal vowel'], ['અઃ', 'aḥ', 'visarga']],
  te: [['ఎ', 'e', 'short e'], ['ఏ', 'ē', 'long e'], ['ఐ', 'ai', 'ai sound'], ['ఒ', 'o', 'short o'], ['ఓ', 'ō', 'long o'], ['ఔ', 'au', 'au sound']],
  sa: [['ए', 'e', 'long e'], ['ऐ', 'ai', 'diphthong ai'], ['ओ', 'o', 'long o'], ['औ', 'au', 'diphthong au'], ['अं', 'aṃ', 'anusvāra'], ['अः', 'aḥ', 'visarga']],
};

function units(languageId: string, lessonId: string, seeds: UnitSeed[]): ScriptUnit[] {
  return seeds.map(([symbol, romanization, soundHint], index) => ({ id: `${languageId}-${lessonId}-${index + 1}`, symbol, name: symbol, romanization, soundHint }));
}

export function buildCurriculumExpansion(course: LanguageCourse): StarterLesson[] {
  if (course.id === 'en') return [];
  const numberSeeds = numbers[course.id] ?? [];
  const scriptSeeds = scriptContinuation[course.id] ?? [];
  const phraseSeeds: UnitSeed[] = (phrasebook[course.id] ?? []).map((phrase) => [phrase.native, phrase.romanization, phrase.english]);
  const wordSeeds: UnitSeed[] = course.vocabulary.map((word) => [word.native, word.romanization, word.english]);
  return [
    { id: `${course.id}-script-more`, title: `${course.scriptName} · Next symbols`, description: 'Continue reading the writing system with another useful group.', units: units(course.id, 'script-more', scriptSeeds) },
    { id: `${course.id}-numbers-1-5`, title: 'Numbers 1–5', description: 'Listen, recognise, and say the first five counting words.', units: units(course.id, 'numbers', numberSeeds) },
    { id: `${course.id}-picture-words`, title: 'First picture words', description: 'Build useful vocabulary from familiar picture concepts.', units: units(course.id, 'picture-words', wordSeeds) },
    { id: `${course.id}-first-phrases`, title: 'First useful phrases', description: 'Listen to short phrases and repeat them as complete chunks.', units: units(course.id, 'phrases', phraseSeeds) },
  ].filter((lesson) => lesson.units.length > 0);
}
