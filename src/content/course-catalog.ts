import type { LanguageCourse, ScriptUnit, StarterLesson, VocabularyEntry, VocabularyImageKey } from '@/models';
import { buildCurriculumExpansion } from './curriculum-expansion';
import { marathiCurriculum } from './marathi-curriculum';

type UnitInput = [symbol: string, romanization: string, soundHint: string, name?: string, example?: string];
type WordInput = [concept: VocabularyImageKey, native: string, romanization: string, english: string];

function lesson(languageId: string, id: string, title: string, description: string, inputs: UnitInput[]): StarterLesson {
  return {
    id: `${languageId}-${id}`,
    title,
    description,
    units: inputs.map(([symbol, romanization, soundHint, name, example], index): ScriptUnit => ({
      id: `${languageId}-${id}-${index + 1}`,
      symbol,
      romanization,
      soundHint,
      name: name ?? symbol,
      example,
    })),
  };
}

function words(inputs: WordInput[]): VocabularyEntry[] {
  return inputs.map(([concept, native, romanization, english]) => ({ concept, native, romanization, english }));
}

const baseCourseCatalog: LanguageCourse[] = [
  {
    id: 'en', name: 'English', nativeName: 'English', locale: 'en-US', scriptName: 'Latin', direction: 'ltr', color: '#DDF1E7', accentColor: '#2F725D', preview: 'A B C',
    description: 'US or UK pronunciation, A–Z, 44 phonemes, and 148 sound-spelling teaching units.', lessons: [],
    vocabulary: words([['hello', 'hello', 'hello', 'hello'], ['water', 'water', 'water', 'water'], ['book', 'book', 'book', 'book'], ['sun', 'sun', 'sun', 'sun'], ['cat', 'cat', 'cat', 'cat'], ['house', 'house', 'house', 'house']]),
  },
  {
    id: 'mr', name: 'Marathi', nativeName: 'मराठी', locale: 'mr-IN', scriptName: 'Devanagari', direction: 'ltr', color: '#FFE7C7', accentColor: '#A55224', preview: 'अ आ क',
    description: 'A complete Marathi foundation: स्वर, व्यंजन, मात्रा, expanded बाराखडी, numbers, reading, conversation, quizzes, and review.',
    lessons: [],
    vocabulary: words([['hello', 'नमस्कार', 'namaskār', 'hello'], ['water', 'पाणी', 'pāṇī', 'water'], ['book', 'पुस्तक', 'pustak', 'book'], ['sun', 'सूर्य', 'sūrya', 'sun'], ['cat', 'मांजर', 'māñjar', 'cat'], ['house', 'घर', 'ghar', 'house']]),
  },
  {
    id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN', scriptName: 'Devanagari', direction: 'ltr', color: '#FFEBD7', accentColor: '#A35A2A', preview: 'अ आ क',
    description: 'Hindi vowels, consonants, matras, words, and beginner sentences.',
    lessons: [lesson('hi', 'vowels-1', 'स्वर · Vowels', 'Learn the first Hindi vowel letters.', [['अ', 'a', 'short a'], ['आ', 'ā', 'long aa'], ['इ', 'i', 'short i'], ['ई', 'ī', 'long ee'], ['उ', 'u', 'short u'], ['ऊ', 'ū', 'long oo']]), lesson('hi', 'consonants-1', 'व्यंजन · Consonants', 'Begin with the क-वर्ग family.', [['क', 'ka', 'k sound'], ['ख', 'kha', 'aspirated kh'], ['ग', 'ga', 'g sound'], ['घ', 'gha', 'aspirated gh'], ['ङ', 'ṅa', 'nasal ng']])],
    vocabulary: words([['hello', 'नमस्ते', 'namaste', 'hello'], ['water', 'पानी', 'pānī', 'water'], ['book', 'किताब', 'kitāb', 'book'], ['sun', 'सूरज', 'sūraj', 'sun'], ['cat', 'बिल्ली', 'billī', 'cat'], ['house', 'घर', 'ghar', 'house']]),
  },
  {
    id: 'fr', name: 'French', nativeName: 'Français', locale: 'fr-FR', scriptName: 'Latin', direction: 'ltr', color: '#E1ECFF', accentColor: '#315FA7', preview: 'A É Ç',
    description: 'French alphabet, accents, pronunciation, vocabulary, and phrases.',
    lessons: [lesson('fr', 'alphabet-1', 'Alphabet A–F', 'Learn the first French letter names and sounds.', [['A a', 'a', 'ah'], ['B b', 'bé', 'bay'], ['C c', 'cé', 'say'], ['D d', 'dé', 'day'], ['E e', 'e', 'uh'], ['F f', 'effe', 'ef']]), lesson('fr', 'special-letters', 'Accents & special letters', 'Meet common French accented forms.', [['É é', 'é', 'ay sound'], ['È è', 'è', 'open eh'], ['Ç ç', 'cédille', 'soft s'], ['Â â', 'â', 'open a'], ['Œ œ', 'e dans l’o', 'joined vowel']])],
    vocabulary: words([['hello', 'bonjour', 'bohn-zhoor', 'hello'], ['water', 'eau', 'oh', 'water'], ['book', 'livre', 'leevr', 'book'], ['sun', 'soleil', 'so-lay', 'sun'], ['cat', 'chat', 'sha', 'cat'], ['house', 'maison', 'may-zohn', 'house']]),
  },
  {
    id: 'es', name: 'Spanish', nativeName: 'Español', locale: 'es-ES', scriptName: 'Latin', direction: 'ltr', color: '#FFF0C8', accentColor: '#A66A00', preview: 'A Ñ R',
    description: 'Spanish letters, clear vowel sounds, rolled R, words, and phrases.',
    lessons: [lesson('es', 'vowels', 'Las vocales · Vowels', 'Spanish vowels have clear, steady sounds.', [['A a', 'a', 'ah'], ['E e', 'e', 'eh'], ['I i', 'i', 'ee'], ['O o', 'o', 'oh'], ['U u', 'u', 'oo']]), lesson('es', 'special', 'Letras especiales', 'Practice distinctive Spanish letters.', [['Ñ ñ', 'eñe', 'ny sound'], ['R r', 'erre', 'tap or trill'], ['J j', 'jota', 'strong h'], ['H h', 'hache', 'silent'], ['LL ll', 'elle', 'y or ly']])],
    vocabulary: words([['hello', 'hola', 'oh-la', 'hello'], ['water', 'agua', 'ah-gwah', 'water'], ['book', 'libro', 'lee-bro', 'book'], ['sun', 'sol', 'sohl', 'sun'], ['cat', 'gato', 'gah-to', 'cat'], ['house', 'casa', 'kah-sa', 'house']]),
  },
  {
    id: 'it', name: 'Italian', nativeName: 'Italiano', locale: 'it-IT', scriptName: 'Latin', direction: 'ltr', color: '#E2F2E6', accentColor: '#28734B', preview: 'A C G',
    description: 'Italian vowels, consonant combinations, everyday words, and phrases.',
    lessons: [lesson('it', 'vowels', 'Le vocali · Vowels', 'Meet the five clear Italian vowels.', [['A a', 'a', 'ah'], ['E e', 'e', 'eh'], ['I i', 'i', 'ee'], ['O o', 'o', 'oh'], ['U u', 'u', 'oo']]), lesson('it', 'sounds', 'Suoni speciali', 'Learn useful Italian letter combinations.', [['C + e/i', 'ce/ci', 'ch sound'], ['Ch', 'che/chi', 'hard k'], ['G + e/i', 'ge/gi', 'j sound'], ['Gn', 'gn', 'ny sound'], ['Gli', 'gli', 'ly sound']])],
    vocabulary: words([['hello', 'ciao', 'chow', 'hello'], ['water', 'acqua', 'ah-kwah', 'water'], ['book', 'libro', 'lee-bro', 'book'], ['sun', 'sole', 'so-leh', 'sun'], ['cat', 'gatto', 'gaht-to', 'cat'], ['house', 'casa', 'kah-za', 'house']]),
  },
  {
    id: 'de', name: 'German', nativeName: 'Deutsch', locale: 'de-DE', scriptName: 'Latin', direction: 'ltr', color: '#F2E8D7', accentColor: '#70512A', preview: 'A Ä ß',
    description: 'German alphabet, umlauts, ß, vocabulary, and beginner sentences.',
    lessons: [lesson('de', 'alphabet-1', 'Alphabet A–F', 'Start German letter names.', [['A a', 'a', 'ah'], ['B b', 'be', 'bay'], ['C c', 'ce', 'tsay'], ['D d', 'de', 'day'], ['E e', 'e', 'ay'], ['F f', 'ef', 'ef']]), lesson('de', 'special', 'Umlaute & ß', 'Meet German’s special written forms.', [['Ä ä', 'ä', 'open eh'], ['Ö ö', 'ö', 'rounded er'], ['Ü ü', 'ü', 'rounded ee'], ['ß', 'Eszett', 'sharp s'], ['Ch', 'ch', 'soft or throaty ch']])],
    vocabulary: words([['hello', 'Hallo', 'hah-loh', 'hello'], ['water', 'Wasser', 'vah-ser', 'water'], ['book', 'Buch', 'bookh', 'book'], ['sun', 'Sonne', 'zon-neh', 'sun'], ['cat', 'Katze', 'kat-seh', 'cat'], ['house', 'Haus', 'house', 'house']]),
  },
  {
    id: 'ru', name: 'Russian', nativeName: 'Русский', locale: 'ru-RU', scriptName: 'Cyrillic', direction: 'ltr', color: '#E9E6FA', accentColor: '#5A4B97', preview: 'А Б Я',
    description: 'Cyrillic letters, sounds, handwriting, words, and simple Russian.',
    lessons: [lesson('ru', 'alphabet-1', 'Кириллица · Cyrillic 1', 'Meet the first Russian letters.', [['А а', 'a', 'a as in father'], ['Б б', 'be', 'b sound'], ['В в', 've', 'v sound'], ['Г г', 'ge', 'g sound'], ['Д д', 'de', 'd sound'], ['Е е', 'ye', 'ye sound']]), lesson('ru', 'alphabet-2', 'Кириллица · Cyrillic 2', 'Continue with common Cyrillic letters.', [['Ж ж', 'zhe', 'zh sound'], ['З з', 'ze', 'z sound'], ['И и', 'i', 'ee sound'], ['Й й', 'short i', 'y glide'], ['К к', 'ka', 'k sound'], ['Л л', 'el', 'l sound']])],
    vocabulary: words([['hello', 'привет', 'privyet', 'hello'], ['water', 'вода', 'vada', 'water'], ['book', 'книга', 'kniga', 'book'], ['sun', 'солнце', 'solntse', 'sun'], ['cat', 'кошка', 'koshka', 'cat'], ['house', 'дом', 'dom', 'house']]),
  },
  {
    id: 'ar', name: 'Arabic', nativeName: 'العربية', locale: 'ar-SA', scriptName: 'Arabic', direction: 'rtl', color: '#DFF3EE', accentColor: '#25715E', preview: 'ا ب ت',
    description: 'Right-to-left Arabic letters, joining forms, sounds, and vocabulary.',
    lessons: [lesson('ar', 'letters-1', 'الحروف · Letters 1', 'Read the first Arabic letters from right to left.', [['ا', 'alif', 'long a'], ['ب', 'bāʼ', 'b sound'], ['ت', 'tāʼ', 't sound'], ['ث', 'thāʼ', 'th as in thin'], ['ج', 'jīm', 'j sound'], ['ح', 'ḥāʼ', 'deep breathy h']]), lesson('ar', 'letters-2', 'الحروف · Letters 2', 'Continue with more Arabic letter shapes.', [['خ', 'khāʼ', 'kh sound'], ['د', 'dāl', 'd sound'], ['ذ', 'dhāl', 'th as in this'], ['ر', 'rāʼ', 'rolled r'], ['ز', 'zāy', 'z sound'], ['س', 'sīn', 's sound']])],
    vocabulary: words([['hello', 'مرحبًا', 'marḥaban', 'hello'], ['water', 'ماء', 'māʼ', 'water'], ['book', 'كتاب', 'kitāb', 'book'], ['sun', 'شمس', 'shams', 'sun'], ['cat', 'قطة', 'qiṭṭa', 'cat'], ['house', 'بيت', 'bayt', 'house']]),
  },
  {
    id: 'zh', name: 'Mandarin Chinese', nativeName: '普通话', locale: 'zh-CN', scriptName: 'Hanzi + Pinyin', direction: 'ltr', color: '#FFE3DE', accentColor: '#A23D31', preview: '一 二 人',
    description: 'Pinyin tones, basic strokes, high-frequency Hanzi, words, and phrases.',
    lessons: [lesson('zh', 'tones', '声调 · Four tones', 'Hear how tone changes a Mandarin syllable.', [['mā', 'mā', 'first tone: high and level'], ['má', 'má', 'second tone: rising'], ['mǎ', 'mǎ', 'third tone: dip then rise'], ['mà', 'mà', 'fourth tone: sharp falling'], ['ma', 'ma', 'neutral tone']]), lesson('zh', 'hanzi-1', '汉字 · Hanzi 1', 'Meet simple characters and their meanings.', [['一', 'yī', 'one', '一', 'one'], ['二', 'èr', 'two', '二', 'two'], ['三', 'sān', 'three', '三', 'three'], ['人', 'rén', 'person', '人', 'person'], ['大', 'dà', 'big', '大', 'big'], ['中', 'zhōng', 'middle', '中', 'middle']])],
    vocabulary: words([['hello', '你好', 'nǐ hǎo', 'hello'], ['water', '水', 'shuǐ', 'water'], ['book', '书', 'shū', 'book'], ['sun', '太阳', 'tàiyáng', 'sun'], ['cat', '猫', 'māo', 'cat'], ['house', '房子', 'fángzi', 'house']]),
  },
  {
    id: 'ja', name: 'Japanese', nativeName: '日本語', locale: 'ja-JP', scriptName: 'Hiragana + Katakana + Kanji', direction: 'ltr', color: '#FFE5EA', accentColor: '#A73E59', preview: 'あ か ア',
    description: 'Hiragana, Katakana, first Kanji, vocabulary, and beginner phrases.',
    lessons: [lesson('ja', 'hiragana-vowels', 'ひらがな · Vowels', 'Meet the five foundational Hiragana.', [['あ', 'a', 'ah'], ['い', 'i', 'ee'], ['う', 'u', 'oo'], ['え', 'e', 'eh'], ['お', 'o', 'oh']]), lesson('ja', 'hiragana-k', 'ひらがな · K row', 'Combine K with each vowel.', [['か', 'ka', 'kah'], ['き', 'ki', 'kee'], ['く', 'ku', 'koo'], ['け', 'ke', 'keh'], ['こ', 'ko', 'koh']])],
    vocabulary: words([['hello', 'こんにちは', 'konnichiwa', 'hello'], ['water', '水', 'mizu', 'water'], ['book', '本', 'hon', 'book'], ['sun', '太陽', 'taiyō', 'sun'], ['cat', '猫', 'neko', 'cat'], ['house', '家', 'ie', 'house']]),
  },
  {
    id: 'ko', name: 'Korean', nativeName: '한국어', locale: 'ko-KR', scriptName: 'Hangul', direction: 'ltr', color: '#E6EDFF', accentColor: '#425E9B', preview: 'ㄱ ㅏ 가',
    description: 'Hangul consonants, vowels, syllable blocks, words, and phrases.',
    lessons: [lesson('ko', 'vowels-1', '모음 · Vowels', 'Learn foundational Hangul vowels.', [['ㅏ', 'a', 'ah'], ['ㅑ', 'ya', 'yah'], ['ㅓ', 'eo', 'uh'], ['ㅕ', 'yeo', 'yuh'], ['ㅗ', 'o', 'oh'], ['ㅜ', 'u', 'oo']]), lesson('ko', 'consonants-1', '자음 · Consonants', 'Meet basic Hangul consonants.', [['ㄱ', 'g/k', 'g or k'], ['ㄴ', 'n', 'n sound'], ['ㄷ', 'd/t', 'd or t'], ['ㄹ', 'r/l', 'r or l'], ['ㅁ', 'm', 'm sound'], ['ㅂ', 'b/p', 'b or p']])],
    vocabulary: words([['hello', '안녕하세요', 'annyeonghaseyo', 'hello'], ['water', '물', 'mul', 'water'], ['book', '책', 'chaek', 'book'], ['sun', '태양', 'taeyang', 'sun'], ['cat', '고양이', 'goyangi', 'cat'], ['house', '집', 'jip', 'house']]),
  },
  {
    id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', locale: 'kn-IN', scriptName: 'Kannada', direction: 'ltr', color: '#FFF0D9', accentColor: '#9A6123', preview: 'ಅ ಆ ಕ',
    description: 'Kannada vowels, consonants, ottakshara foundations, and words.',
    lessons: [lesson('kn', 'vowels-1', 'ಸ್ವರಗಳು · Vowels', 'Meet foundational Kannada vowels.', [['ಅ', 'a', 'short a'], ['ಆ', 'ā', 'long aa'], ['ಇ', 'i', 'short i'], ['ಈ', 'ī', 'long ee'], ['ಉ', 'u', 'short u'], ['ಊ', 'ū', 'long oo']]), lesson('kn', 'consonants-1', 'ವ್ಯಂಜನಗಳು · Consonants', 'Start the first Kannada consonant family.', [['ಕ', 'ka', 'k sound'], ['ಖ', 'kha', 'aspirated kh'], ['ಗ', 'ga', 'g sound'], ['ಘ', 'gha', 'aspirated gh'], ['ಙ', 'ṅa', 'nasal ng']])],
    vocabulary: words([['hello', 'ನಮಸ್ಕಾರ', 'namaskāra', 'hello'], ['water', 'ನೀರು', 'nīru', 'water'], ['book', 'ಪುಸ್ತಕ', 'pustaka', 'book'], ['sun', 'ಸೂರ್ಯ', 'sūrya', 'sun'], ['cat', 'ಬೆಕ್ಕು', 'bekku', 'cat'], ['house', 'ಮನೆ', 'mane', 'house']]),
  },
  {
    id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', locale: 'pa-IN', scriptName: 'Gurmukhi', direction: 'ltr', color: '#FFF0C9', accentColor: '#946A18', preview: 'ੳ ਅ ੲ',
    description: 'Gurmukhi letters, vowel signs, Punjabi words, and simple phrases.',
    lessons: [lesson('pa', 'letters-1', 'ਗੁਰਮੁਖੀ · Letters 1', 'Meet the first Gurmukhi letters.', [['ੳ', 'uṛā', 'carrier letter'], ['ਅ', 'aiṛā', 'a sound'], ['ੲ', 'īṛī', 'carrier letter'], ['ਸ', 'sassā', 's sound'], ['ਹ', 'hāhā', 'h sound'], ['ਕ', 'kakkā', 'k sound']]), lesson('pa', 'letters-2', 'ਗੁਰਮੁਖੀ · Letters 2', 'Continue with common consonants.', [['ਖ', 'khakhā', 'aspirated kh'], ['ਗ', 'gaggā', 'g sound'], ['ਘ', 'ghagghā', 'aspirated gh'], ['ਙ', 'ṅaṅṅā', 'nasal ng'], ['ਚ', 'chachā', 'ch sound']])],
    vocabulary: words([['hello', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'sat srī akāl', 'hello'], ['water', 'ਪਾਣੀ', 'pāṇī', 'water'], ['book', 'ਕਿਤਾਬ', 'kitāb', 'book'], ['sun', 'ਸੂਰਜ', 'sūraj', 'sun'], ['cat', 'ਬਿੱਲੀ', 'billī', 'cat'], ['house', 'ਘਰ', 'ghar', 'house']]),
  },
  {
    id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', locale: 'gu-IN', scriptName: 'Gujarati', direction: 'ltr', color: '#F6E7FF', accentColor: '#76509A', preview: 'અ આ ક',
    description: 'Gujarati vowels, consonants, words, handwriting, and phrases.',
    lessons: [lesson('gu', 'vowels-1', 'સ્વર · Vowels', 'Meet the first Gujarati vowels.', [['અ', 'a', 'short a'], ['આ', 'ā', 'long aa'], ['ઇ', 'i', 'short i'], ['ઈ', 'ī', 'long ee'], ['ઉ', 'u', 'short u'], ['ઊ', 'ū', 'long oo']]), lesson('gu', 'consonants-1', 'વ્યંજન · Consonants', 'Start the first consonant family.', [['ક', 'ka', 'k sound'], ['ખ', 'kha', 'aspirated kh'], ['ગ', 'ga', 'g sound'], ['ઘ', 'gha', 'aspirated gh'], ['ઙ', 'ṅa', 'nasal ng']])],
    vocabulary: words([['hello', 'નમસ્તે', 'namaste', 'hello'], ['water', 'પાણી', 'pāṇī', 'water'], ['book', 'પુસ્તક', 'pustak', 'book'], ['sun', 'સૂર્ય', 'sūrya', 'sun'], ['cat', 'બિલાડી', 'bilāḍī', 'cat'], ['house', 'ઘર', 'ghar', 'house']]),
  },
  {
    id: 'te', name: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN', scriptName: 'Telugu', direction: 'ltr', color: '#E8F4FF', accentColor: '#366E9A', preview: 'అ ఆ క',
    description: 'Telugu vowels, consonants, gunintalu foundations, and words.',
    lessons: [lesson('te', 'vowels-1', 'అచ్చులు · Vowels', 'Meet the first Telugu vowels.', [['అ', 'a', 'short a'], ['ఆ', 'ā', 'long aa'], ['ఇ', 'i', 'short i'], ['ఈ', 'ī', 'long ee'], ['ఉ', 'u', 'short u'], ['ఊ', 'ū', 'long oo']]), lesson('te', 'consonants-1', 'హల్లులు · Consonants', 'Start the first Telugu consonant family.', [['క', 'ka', 'k sound'], ['ఖ', 'kha', 'aspirated kh'], ['గ', 'ga', 'g sound'], ['ఘ', 'gha', 'aspirated gh'], ['ఙ', 'ṅa', 'nasal ng']])],
    vocabulary: words([['hello', 'నమస్కారం', 'namaskāram', 'hello'], ['water', 'నీరు', 'nīru', 'water'], ['book', 'పుస్తకం', 'pustakam', 'book'], ['sun', 'సూర్యుడు', 'sūryuḍu', 'sun'], ['cat', 'పిల్లి', 'pilli', 'cat'], ['house', 'ఇల్లు', 'illu', 'house']]),
  },
  {
    id: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', locale: 'sa-IN', scriptName: 'Devanagari', direction: 'ltr', color: '#FFF0D5', accentColor: '#936020', preview: 'अ ऋ क',
    description: 'Sanskrit varṇamālā, precise sounds, basic words, and simple forms.',
    lessons: [lesson('sa', 'vowels-1', 'स्वराः · Vowels', 'Begin the Sanskrit vowel system.', [['अ', 'a', 'short a'], ['आ', 'ā', 'long aa'], ['इ', 'i', 'short i'], ['ई', 'ī', 'long ee'], ['उ', 'u', 'short u'], ['ऋ', 'ṛ', 'vocalic r']]), lesson('sa', 'consonants-1', 'व्यञ्जनानि · Consonants', 'Learn the first varga with precise aspiration.', [['क', 'ka', 'unaspirated k'], ['ख', 'kha', 'aspirated k'], ['ग', 'ga', 'unaspirated g'], ['घ', 'gha', 'aspirated g'], ['ङ', 'ṅa', 'velar nasal']])],
    vocabulary: words([['hello', 'नमस्ते', 'namaste', 'hello'], ['water', 'जलम्', 'jalam', 'water'], ['book', 'पुस्तकम्', 'pustakam', 'book'], ['sun', 'सूर्यः', 'sūryaḥ', 'sun'], ['cat', 'मार्जारः', 'mārjāraḥ', 'cat'], ['house', 'गृहम्', 'gṛham', 'house']]),
  },
];

export const courseCatalog: LanguageCourse[] = baseCourseCatalog.map((course) => ({
  ...course,
  lessons: course.id === 'mr' ? marathiCurriculum : [...course.lessons, ...buildCurriculumExpansion(course)],
}));

function validateCourseCatalog(courses: LanguageCourse[]) {
  const courseIds = new Set<string>();
  const lessonIds = new Set<string>();
  const unitIds = new Set<string>();
  for (const course of courses) {
    if (courseIds.has(course.id)) throw new Error(`Duplicate course id: ${course.id}`);
    courseIds.add(course.id);
    if (course.vocabulary.length < 3) throw new Error(`Course ${course.id} needs vocabulary`);
    for (const lessonItem of course.lessons) {
      if (lessonIds.has(lessonItem.id)) throw new Error(`Duplicate lesson id: ${lessonItem.id}`);
      lessonIds.add(lessonItem.id);
      if (!lessonItem.units.length) throw new Error(`Lesson ${lessonItem.id} has no units`);
      for (const unit of lessonItem.units) {
        if (unitIds.has(unit.id)) throw new Error(`Duplicate unit id: ${unit.id}`);
        unitIds.add(unit.id);
      }
    }
  }
}

validateCourseCatalog(courseCatalog);

export function getCourse(languageId: string) {
  return courseCatalog.find((course) => course.id === languageId);
}

export const targetLanguageOptions = courseCatalog;
