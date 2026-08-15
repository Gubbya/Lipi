import type { ScriptUnit, StarterLesson } from '@/models';
import { phrasebook } from './phrasebook';

type UnitSeed = {
  symbol: string;
  romanization: string;
  soundHint: string;
  name?: string;
  example?: string;
};

type ConsonantSeed = {
  id: string;
  symbol: string;
  stem: string;
  romanization: string;
  soundHint: string;
  example: string;
};

type VowelForm = {
  suffix: string;
  label: string;
  romanization: string;
  soundHint: string;
};

function lesson(id: string, section: string, title: string, description: string, seeds: UnitSeed[]): StarterLesson {
  return {
    id: `mr-${id}`,
    section,
    title,
    description,
    units: seeds.map((seed, index): ScriptUnit => ({
      id: `mr-${id}-${index + 1}`,
      symbol: seed.symbol,
      name: seed.name ?? seed.symbol,
      romanization: seed.romanization,
      soundHint: seed.soundHint,
      example: seed.example,
    })),
  };
}

const vowelLessons: StarterLesson[] = [
  lesson('vowels-1', 'स्वर · Vowels', 'स्वर १ · Vowels 1', 'Learn the first seven independent Marathi vowels with familiar words.', [
    { symbol: 'अ', romanization: 'a', soundHint: 'अ — short a', example: 'अननस · pineapple' },
    { symbol: 'आ', romanization: 'ā', soundHint: 'आ — long aa', example: 'आंबा · mango' },
    { symbol: 'इ', romanization: 'i', soundHint: 'इ — short i', example: 'इमारत · building' },
    { symbol: 'ई', romanization: 'ī', soundHint: 'ई — long ee', example: 'ई-मेल · email' },
    { symbol: 'उ', romanization: 'u', soundHint: 'उ — short u', example: 'उंट · camel' },
    { symbol: 'ऊ', romanization: 'ū', soundHint: 'ऊ — long oo', example: 'ऊस · sugarcane' },
    { symbol: 'ऋ', romanization: 'r̥', soundHint: 'ऋ — vocalic r', example: 'ऋषी · sage' },
  ]),
  lesson('vowels-2', 'स्वर · Vowels', 'स्वर २ · Vowels 2', 'Complete the common Marathi independent vowels and special vowel forms.', [
    { symbol: 'ए', romanization: 'e', soundHint: 'ए — long e', example: 'एक · one' },
    { symbol: 'ऐ', romanization: 'ai', soundHint: 'ऐ — ai sound', example: 'ऐनक · spectacles' },
    { symbol: 'ओ', romanization: 'o', soundHint: 'ओ — long o', example: 'ओठ · lips' },
    { symbol: 'औ', romanization: 'au', soundHint: 'औ — au sound', example: 'औषध · medicine' },
    { symbol: 'अं', romanization: 'aṃ', soundHint: 'अं — anusvāra, a nasal sound', example: 'अंग · body' },
    { symbol: 'अः', romanization: 'aḥ', soundHint: 'अः — visarga, a breath after the vowel', example: 'दुःख · sorrow' },
    { symbol: 'ॲ', romanization: 'ae', soundHint: 'ॲ — Marathi candra a', example: 'ॲप · app' },
    { symbol: 'ऑ', romanization: 'aw', soundHint: 'ऑ — rounded o in borrowed words', example: 'ऑटो · auto-rickshaw' },
  ]),
];

const consonantGroups: { id: string; title: string; description: string; units: ConsonantSeed[] }[] = [
  {
    id: 'ka-varga',
    title: 'क-वर्ग · Velar family',
    description: 'Say the क-वर्ग sounds from the back of the mouth and notice aspiration.',
    units: [
      { id: 'ka', symbol: 'क', stem: 'क', romanization: 'k', soundHint: 'unaspirated k', example: 'कमळ · lotus' },
      { id: 'kha', symbol: 'ख', stem: 'ख', romanization: 'kh', soundHint: 'aspirated kh', example: 'खडू · chalk' },
      { id: 'ga', symbol: 'ग', stem: 'ग', romanization: 'g', soundHint: 'g sound', example: 'गाय · cow' },
      { id: 'gha', symbol: 'घ', stem: 'घ', romanization: 'gh', soundHint: 'aspirated gh', example: 'घर · house' },
      { id: 'nga', symbol: 'ङ', stem: 'ङ', romanization: 'ṅ', soundHint: 'velar nasal ng; rarely starts a Marathi word', example: 'अङ्ग is a spelling demonstration' },
    ],
  },
  {
    id: 'cha-varga',
    title: 'च-वर्ग · Palatal family',
    description: 'Learn the च-वर्ग sounds, including their aspirated and nasal partners.',
    units: [
      { id: 'cha', symbol: 'च', stem: 'च', romanization: 'ch', soundHint: 'ch sound', example: 'चहा · tea' },
      { id: 'chha', symbol: 'छ', stem: 'छ', romanization: 'chh', soundHint: 'aspirated chh', example: 'छत्री · umbrella' },
      { id: 'ja', symbol: 'ज', stem: 'ज', romanization: 'j', soundHint: 'j sound', example: 'जहाज · ship' },
      { id: 'jha', symbol: 'झ', stem: 'झ', romanization: 'jh', soundHint: 'aspirated jh', example: 'झरा · spring' },
      { id: 'nya', symbol: 'ञ', stem: 'ञ', romanization: 'ñ', soundHint: 'palatal nasal; usually appears in combinations', example: 'पञ्च is a spelling demonstration' },
    ],
  },
  {
    id: 'tta-varga',
    title: 'ट-वर्ग · Retroflex family',
    description: 'Curl the tongue slightly back for the ट-वर्ग sounds.',
    units: [
      { id: 'tta', symbol: 'ट', stem: 'ट', romanization: 'ṭ', soundHint: 'retroflex t', example: 'टमाटा · tomato' },
      { id: 'ttha', symbol: 'ठ', stem: 'ठ', romanization: 'ṭh', soundHint: 'aspirated retroflex th', example: 'ठसा · imprint' },
      { id: 'dda', symbol: 'ड', stem: 'ड', romanization: 'ḍ', soundHint: 'retroflex d', example: 'डबा · box' },
      { id: 'ddha', symbol: 'ढ', stem: 'ढ', romanization: 'ḍh', soundHint: 'aspirated retroflex dh', example: 'ढग · cloud' },
      { id: 'nna', symbol: 'ण', stem: 'ण', romanization: 'ṇ', soundHint: 'retroflex n', example: 'बाण · arrow' },
    ],
  },
  {
    id: 'ta-varga',
    title: 'त-वर्ग · Dental family',
    description: 'Touch the tongue near the upper teeth for the त-वर्ग sounds.',
    units: [
      { id: 'ta', symbol: 'त', stem: 'त', romanization: 't', soundHint: 'dental t', example: 'तबला · tabla' },
      { id: 'tha', symbol: 'थ', stem: 'थ', romanization: 'th', soundHint: 'aspirated dental th', example: 'थवा · flock' },
      { id: 'da', symbol: 'द', stem: 'द', romanization: 'd', soundHint: 'dental d', example: 'दगड · stone' },
      { id: 'dha', symbol: 'ध', stem: 'ध', romanization: 'dh', soundHint: 'aspirated dental dh', example: 'धागा · thread' },
      { id: 'na', symbol: 'न', stem: 'न', romanization: 'n', soundHint: 'dental n', example: 'नळ · tap' },
    ],
  },
  {
    id: 'pa-varga',
    title: 'प-वर्ग · Lip family',
    description: 'Use the lips to form the प-वर्ग sounds and compare voiced and aspirated pairs.',
    units: [
      { id: 'pa', symbol: 'प', stem: 'प', romanization: 'p', soundHint: 'unaspirated p', example: 'पतंग · kite' },
      { id: 'pha', symbol: 'फ', stem: 'फ', romanization: 'ph', soundHint: 'aspirated ph', example: 'फळ · fruit' },
      { id: 'ba', symbol: 'ब', stem: 'ब', romanization: 'b', soundHint: 'b sound', example: 'बदक · duck' },
      { id: 'bha', symbol: 'भ', stem: 'भ', romanization: 'bh', soundHint: 'aspirated bh', example: 'भात · rice' },
      { id: 'ma', symbol: 'म', stem: 'म', romanization: 'm', soundHint: 'm sound', example: 'मासा · fish' },
    ],
  },
  {
    id: 'semivowels',
    title: 'अंतःस्थ · Semivowels',
    description: 'Meet the flowing य, र, ल, and व sounds.',
    units: [
      { id: 'ya', symbol: 'य', stem: 'य', romanization: 'y', soundHint: 'y sound', example: 'यश · success' },
      { id: 'ra', symbol: 'र', stem: 'र', romanization: 'r', soundHint: 'Marathi r sound', example: 'रथ · chariot' },
      { id: 'la', symbol: 'ल', stem: 'ल', romanization: 'l', soundHint: 'dental l', example: 'लसूण · garlic' },
      { id: 'va', symbol: 'व', stem: 'व', romanization: 'v', soundHint: 'v or w-like sound', example: 'वन · forest' },
    ],
  },
  {
    id: 'sibilants-extra',
    title: 'ऊष्म व मराठी विशेष · More consonants',
    description: 'Complete the consonant path with sibilants, ह, Marathi ळ, and common conjuncts.',
    units: [
      { id: 'sha', symbol: 'श', stem: 'श', romanization: 'ś', soundHint: 'palatal sh', example: 'शाळा · school' },
      { id: 'ssa', symbol: 'ष', stem: 'ष', romanization: 'ṣ', soundHint: 'retroflex sh', example: 'षट्कोन · hexagon' },
      { id: 'sa', symbol: 'स', stem: 'स', romanization: 's', soundHint: 's sound', example: 'ससा · rabbit' },
      { id: 'ha', symbol: 'ह', stem: 'ह', romanization: 'h', soundHint: 'h sound', example: 'हत्ती · elephant' },
      { id: 'lla', symbol: 'ळ', stem: 'ळ', romanization: 'ḷ', soundHint: 'Marathi retroflex l', example: 'बाळ · child' },
      { id: 'ksha', symbol: 'क्ष', stem: 'क्ष', romanization: 'kṣ', soundHint: 'common conjunct ksha', example: 'क्षमा · forgiveness' },
      { id: 'dnya', symbol: 'ज्ञ', stem: 'ज्ञ', romanization: 'dny', soundHint: 'common Marathi conjunct dnya', example: 'ज्ञान · knowledge' },
      { id: 'shra', symbol: 'श्र', stem: 'श्र', romanization: 'śr', soundHint: 'common conjunct shra', example: 'श्रम · effort' },
    ],
  },
];

const consonantLessons = consonantGroups.map((group) => lesson(
  group.id,
  'व्यंजन · Consonants',
  group.title,
  group.description,
  group.units.map((unit) => ({ symbol: unit.symbol, romanization: `${unit.romanization}a`, soundHint: unit.soundHint, example: unit.example })),
));

const consonants = consonantGroups.flatMap((group) => group.units);

const vowelForms: VowelForm[] = [
  { suffix: '', label: 'अ', romanization: 'a', soundHint: 'inherent a' },
  { suffix: 'ा', label: 'आ', romanization: 'ā', soundHint: 'long aa' },
  { suffix: 'ि', label: 'इ', romanization: 'i', soundHint: 'short i' },
  { suffix: 'ी', label: 'ई', romanization: 'ī', soundHint: 'long ee' },
  { suffix: 'ु', label: 'उ', romanization: 'u', soundHint: 'short u' },
  { suffix: 'ू', label: 'ऊ', romanization: 'ū', soundHint: 'long oo' },
  { suffix: 'ृ', label: 'ऋ', romanization: 'r̥', soundHint: 'vocalic r' },
  { suffix: 'े', label: 'ए', romanization: 'e', soundHint: 'long e' },
  { suffix: 'ै', label: 'ऐ', romanization: 'ai', soundHint: 'ai sound' },
  { suffix: 'ो', label: 'ओ', romanization: 'o', soundHint: 'long o' },
  { suffix: 'ौ', label: 'औ', romanization: 'au', soundHint: 'au sound' },
  { suffix: 'ं', label: 'अं', romanization: 'aṃ', soundHint: 'nasal ending' },
  { suffix: 'ः', label: 'अः', romanization: 'aḥ', soundHint: 'visarga ending' },
  { suffix: 'ॅ', label: 'ॲ', romanization: 'ae', soundHint: 'candra a' },
  { suffix: 'ॉ', label: 'ऑ', romanization: 'aw', soundHint: 'rounded o' },
];

const matraLessons: StarterLesson[] = [
  lesson('matras-1', 'मात्रा · Vowel signs', 'मात्रा १ · Vowel signs 1', 'Attach the first vowel signs to क and listen to the new syllable.', [
    { symbol: 'क', name: 'क + अ = क', romanization: 'ka', soundHint: 'no written mātrā; the inherent vowel is अ', example: 'कमळ · lotus' },
    { symbol: 'का', name: 'क + ा = का', romanization: 'kā', soundHint: 'आची मात्रा ा', example: 'कान · ear' },
    { symbol: 'कि', name: 'क + ि = कि', romanization: 'ki', soundHint: 'इची मात्रा ि is written before the consonant', example: 'किल्ला · fort' },
    { symbol: 'की', name: 'क + ी = की', romanization: 'kī', soundHint: 'ईची मात्रा ी', example: 'कीड · insect' },
    { symbol: 'कु', name: 'क + ु = कु', romanization: 'ku', soundHint: 'उची मात्रा ु', example: 'कुत्रा · dog' },
    { symbol: 'कू', name: 'क + ू = कू', romanization: 'kū', soundHint: 'ऊची मात्रा ू', example: 'कूजन · cooing' },
    { symbol: 'कृ', name: 'क + ृ = कृ', romanization: 'kr̥', soundHint: 'ऋची मात्रा ृ', example: 'कृती · creation' },
  ]),
  lesson('matras-2', 'मात्रा · Vowel signs', 'मात्रा २ · Vowel signs 2', 'Complete the common Marathi vowel signs, nasal sign, visarga, and halant.', [
    { symbol: 'के', name: 'क + े = के', romanization: 'ke', soundHint: 'एची मात्रा े', example: 'केक · cake' },
    { symbol: 'कै', name: 'क + ै = कै', romanization: 'kai', soundHint: 'ऐची मात्रा ै', example: 'कैरी · raw mango' },
    { symbol: 'को', name: 'क + ो = को', romanization: 'ko', soundHint: 'ओची मात्रा ो', example: 'कोल्हा · fox' },
    { symbol: 'कौ', name: 'क + ौ = कौ', romanization: 'kau', soundHint: 'औची मात्रा ौ', example: 'कौतुक · appreciation' },
    { symbol: 'कं', name: 'क + ं = कं', romanization: 'kaṃ', soundHint: 'अनुस्वार ं adds a nasal sound', example: 'कंदील · lantern' },
    { symbol: 'कः', name: 'क + ः = कः', romanization: 'kaḥ', soundHint: 'विसर्ग ः adds a soft breath', example: 'a form used for sound practice' },
    { symbol: 'कॅ', name: 'क + ॅ = कॅ', romanization: 'kae', soundHint: 'ॲची मात्रा ॅ', example: 'कॅमेरा · camera' },
    { symbol: 'कॉ', name: 'क + ॉ = कॉ', romanization: 'kaw', soundHint: 'ऑची मात्रा ॉ', example: 'कॉफी · coffee' },
    { symbol: 'क्', name: 'क + ् = क्', romanization: 'k', soundHint: 'विराम ् removes the inherent vowel', example: 'used to build जोडाक्षरे · conjuncts' },
  ]),
];

function barakhadiLesson(consonant: ConsonantSeed): StarterLesson {
  return lesson(
    `barakhadi-${consonant.id}`,
    'विस्तारित बाराखडी · Expanded bārākhaḍī',
    `बाराखडी · ${consonant.symbol}`,
    `Combine ${consonant.symbol} with 15 common Marathi vowel forms. Tap every syllable and repeat it aloud.`,
    vowelForms.map((form) => ({
      symbol: `${consonant.stem}${form.suffix}`,
      name: `${consonant.symbol} + ${form.label}`,
      romanization: `${consonant.romanization}${form.romanization}`,
      soundHint: `${form.label}चा स्वर · ${form.soundHint}`,
    })),
  );
}

const barakhadiLessons = consonants.map(barakhadiLesson);

const numberLessons: StarterLesson[] = [
  lesson('numbers-0-10', 'अंक · Numbers', 'अंक ०–१० · Numbers 0–10', 'Read Devanagari digits and say the Marathi counting words.', [
    { symbol: '०', name: 'शून्य', romanization: 'śūnya', soundHint: 'zero' },
    { symbol: '१', name: 'एक', romanization: 'ek', soundHint: 'one' },
    { symbol: '२', name: 'दोन', romanization: 'don', soundHint: 'two' },
    { symbol: '३', name: 'तीन', romanization: 'tīn', soundHint: 'three' },
    { symbol: '४', name: 'चार', romanization: 'cār', soundHint: 'four' },
    { symbol: '५', name: 'पाच', romanization: 'pāc', soundHint: 'five' },
    { symbol: '६', name: 'सहा', romanization: 'sahā', soundHint: 'six' },
    { symbol: '७', name: 'सात', romanization: 'sāt', soundHint: 'seven' },
    { symbol: '८', name: 'आठ', romanization: 'āṭh', soundHint: 'eight' },
    { symbol: '९', name: 'नऊ', romanization: 'naū', soundHint: 'nine' },
    { symbol: '१०', name: 'दहा', romanization: 'dahā', soundHint: 'ten' },
  ]),
  lesson('numbers-11-20', 'अंक · Numbers', 'अंक ११–२० · Numbers 11–20', 'Continue counting from eleven to twenty.', [
    { symbol: '११', name: 'अकरा', romanization: 'akarā', soundHint: 'eleven' },
    { symbol: '१२', name: 'बारा', romanization: 'bārā', soundHint: 'twelve' },
    { symbol: '१३', name: 'तेरा', romanization: 'terā', soundHint: 'thirteen' },
    { symbol: '१४', name: 'चौदा', romanization: 'caudā', soundHint: 'fourteen' },
    { symbol: '१५', name: 'पंधरा', romanization: 'pandharā', soundHint: 'fifteen' },
    { symbol: '१६', name: 'सोळा', romanization: 'soḷā', soundHint: 'sixteen' },
    { symbol: '१७', name: 'सतरा', romanization: 'satarā', soundHint: 'seventeen' },
    { symbol: '१८', name: 'अठरा', romanization: 'aṭharā', soundHint: 'eighteen' },
    { symbol: '१९', name: 'एकोणीस', romanization: 'ekoṇīs', soundHint: 'nineteen' },
    { symbol: '२०', name: 'वीस', romanization: 'vīs', soundHint: 'twenty' },
  ]),
];

const readingLessons: StarterLesson[] = [
  lesson('reading-familiar-words', 'शब्द व वाचन · Words and reading', 'ओळखीचे शब्द · Familiar words', 'Blend letters and mātrās in familiar Marathi words.', [
    { symbol: 'आई', romanization: 'āī', soundHint: 'mother', example: 'आई घरी आहे. · Mother is at home.' },
    { symbol: 'बाबा', romanization: 'bābā', soundHint: 'father', example: 'बाबा वाचतात. · Father reads.' },
    { symbol: 'घर', romanization: 'ghar', soundHint: 'house', example: 'हे घर आहे. · This is a house.' },
    { symbol: 'पाणी', romanization: 'pāṇī', soundHint: 'water', example: 'पाणी प्या. · Drink water.' },
    { symbol: 'पुस्तक', romanization: 'pustak', soundHint: 'book', example: 'हे पुस्तक आहे. · This is a book.' },
    { symbol: 'शाळा', romanization: 'śāḷā', soundHint: 'school', example: 'ही माझी शाळा आहे. · This is my school.' },
    { symbol: 'सूर्य', romanization: 'sūrya', soundHint: 'sun', example: 'सूर्य उगवतो. · The sun rises.' },
    { symbol: 'मांजर', romanization: 'māñjar', soundHint: 'cat', example: 'मांजर बसले आहे. · The cat is sitting.' },
  ]),
  lesson('reading-nature-colours', 'शब्द व वाचन · Words and reading', 'निसर्ग व रंग · Nature and colours', 'Read useful nouns and colour words.', [
    { symbol: 'फूल', romanization: 'phūl', soundHint: 'flower', example: 'लाल फूल · red flower' },
    { symbol: 'फळ', romanization: 'phaḷ', soundHint: 'fruit', example: 'गोड फळ · sweet fruit' },
    { symbol: 'झाड', romanization: 'jhāḍ', soundHint: 'tree', example: 'हिरवे झाड · green tree' },
    { symbol: 'आकाश', romanization: 'ākāś', soundHint: 'sky', example: 'निळे आकाश · blue sky' },
    { symbol: 'लाल', romanization: 'lāl', soundHint: 'red' },
    { symbol: 'निळा', romanization: 'niḷā', soundHint: 'blue' },
    { symbol: 'हिरवा', romanization: 'hiravā', soundHint: 'green' },
    { symbol: 'पिवळा', romanization: 'pivaḷā', soundHint: 'yellow' },
  ]),
  lesson('reading-everyday-actions', 'शब्द व वाचन · Words and reading', 'रोजच्या क्रिया · Everyday actions', 'Learn common action words in their polite command forms.', [
    { symbol: 'या', romanization: 'yā', soundHint: 'come', example: 'इथे या. · Come here.' },
    { symbol: 'जा', romanization: 'jā', soundHint: 'go', example: 'घरी जा. · Go home.' },
    { symbol: 'बसा', romanization: 'basā', soundHint: 'sit', example: 'इथे बसा. · Sit here.' },
    { symbol: 'उठा', romanization: 'uṭhā', soundHint: 'stand up', example: 'हळू उठा. · Stand up slowly.' },
    { symbol: 'वाचा', romanization: 'vācā', soundHint: 'read', example: 'पुस्तक वाचा. · Read the book.' },
    { symbol: 'लिहा', romanization: 'lihā', soundHint: 'write', example: 'नाव लिहा. · Write the name.' },
    { symbol: 'ऐका', romanization: 'aikā', soundHint: 'listen', example: 'लक्ष देऊन ऐका. · Listen carefully.' },
    { symbol: 'बोला', romanization: 'bolā', soundHint: 'speak', example: 'हळू बोला. · Speak slowly.' },
  ]),
  lesson('reading-sentences', 'शब्द व वाचन · Words and reading', 'पहिली वाक्ये · First sentences', 'Read short complete sentences and notice basic Marathi word order.', [
    { symbol: 'हे घर आहे.', romanization: 'he ghar āhe', soundHint: 'This is a house.' },
    { symbol: 'हे पुस्तक आहे.', romanization: 'he pustak āhe', soundHint: 'This is a book.' },
    { symbol: 'मला पुस्तक आवडते.', romanization: 'malā pustak āvaḍate', soundHint: 'I like the book.' },
    { symbol: 'आई पाणी देते.', romanization: 'āī pāṇī dete', soundHint: 'Mother gives water.' },
    { symbol: 'सूर्य उगवतो.', romanization: 'sūrya ugavato', soundHint: 'The sun rises.' },
    { symbol: 'मांजर बसले आहे.', romanization: 'māñjar basale āhe', soundHint: 'The cat is sitting.' },
  ]),
];

const marathiPhrases = phrasebook.mr ?? [];
const phraseLessons: StarterLesson[] = [
  lesson('phrases-greetings', 'संभाषण · Conversation', 'नमस्कार व ओळख · Greetings', 'Listen, repeat, and use short Marathi greeting and introduction phrases.', marathiPhrases.slice(0, 7).map((phrase) => ({
    symbol: phrase.native,
    romanization: phrase.romanization,
    soundHint: phrase.english,
  }))),
  lesson('phrases-needs', 'संभाषण · Conversation', 'गरजा व मदत · Needs and help', 'Practice phrases for learning, asking for help, and everyday needs.', marathiPhrases.slice(7).map((phrase) => ({
    symbol: phrase.native,
    romanization: phrase.romanization,
    soundHint: phrase.english,
  }))),
];

export const marathiCurriculum: StarterLesson[] = [
  ...vowelLessons,
  ...consonantLessons,
  ...matraLessons,
  ...barakhadiLessons,
  ...numberLessons,
  ...readingLessons,
  ...phraseLessons,
];

export const marathiCurriculumStats = Object.freeze({
  lessons: marathiCurriculum.length,
  units: marathiCurriculum.reduce((total, item) => total + item.units.length, 0),
  barakhadiRows: barakhadiLessons.length,
  formsPerBarakhadiRow: vowelForms.length,
});

export function validateMarathiCurriculum() {
  const lessonIds = new Set<string>();
  const unitIds = new Set<string>();
  const symbols = new Set<string>();
  for (const item of marathiCurriculum) {
    if (lessonIds.has(item.id)) throw new Error(`Duplicate Marathi lesson id: ${item.id}`);
    lessonIds.add(item.id);
    for (const unit of item.units) {
      if (unitIds.has(unit.id)) throw new Error(`Duplicate Marathi unit id: ${unit.id}`);
      unitIds.add(unit.id);
      symbols.add(unit.symbol);
    }
  }

  const requiredLetters = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः', 'ॲ', 'ऑ', ...consonants.map((item) => item.symbol)];
  const missingLetters = requiredLetters.filter((symbol) => !symbols.has(symbol));
  if (missingLetters.length) throw new Error(`Marathi curriculum is missing: ${missingLetters.join(', ')}`);
  if (barakhadiLessons.length !== consonants.length) throw new Error('Every Marathi consonant needs a bārākhaḍī lesson');
  if (barakhadiLessons.some((item) => item.units.length !== vowelForms.length)) throw new Error('Every Marathi bārākhaḍī row needs all vowel forms');
  if (marathiCurriculumStats.lessons !== 56 || marathiCurriculumStats.units !== 689) throw new Error('Marathi foundational curriculum is incomplete');
}
