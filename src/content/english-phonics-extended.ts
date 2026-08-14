import type { ContentLevel, GraphemePhonemeMapping, IdentifyUnitActivity, OrthographicUnit, Phoneme } from '@/models';

type Pattern = [id: string, symbol: string, name: string, phonemeId: string, soundHint: string, examples: [string, string, string]];

const groups: { id: string; title: string; description: string; patterns: Pattern[] }[] = [
  { id: 'silent-e-y', title: 'Silent E & Vowel Y', description: 'Silent E changes a short vowel, while Y can act like a vowel.', patterns: [
    ['a-e', 'a_e', 'Silent E: long A', 'en-ay', '/eɪ/', ['cake', 'name', 'late']], ['e-e', 'e_e', 'Silent E: long E', 'en-ee', '/iː/', ['these', 'theme', 'complete']], ['i-e', 'i_e', 'Silent E: long I', 'en-eye', '/aɪ/', ['bike', 'time', 'smile']], ['o-e', 'o_e', 'Silent E: long O', 'en-oh', '/oʊ/', ['home', 'rope', 'stone']], ['u-e', 'u_e', 'Silent E: long U', 'en-oo', '/uː/ or /juː/', ['cube', 'tune', 'rule']], ['y-eye', 'y', 'Y says long I', 'en-eye', '/aɪ/', ['my', 'fly', 'sky']], ['y-ee', 'y', 'Y says long E', 'en-ee', '/iː/', ['happy', 'baby', 'sunny']],
  ]},
  { id: 'long-vowel-alternatives', title: 'More Long-Vowel Spellings', description: 'Meet less obvious spellings for familiar long-vowel sounds.', patterns: [
    ['eigh-ay', 'eigh', 'EIGH says long A', 'en-ay', '/eɪ/', ['eight', 'weigh', 'sleigh']], ['ey-ee', 'ey', 'EY says long E', 'en-ee', '/iː/', ['key', 'money', 'valley']], ['ie-eye', 'ie', 'IE says long I', 'en-eye', '/aɪ/', ['pie', 'tie', 'cried']], ['oe-oh', 'oe', 'OE says long O', 'en-oh', '/oʊ/', ['toe', 'hoe', 'foe']], ['ow-oh', 'ow', 'OW says long O', 'en-oh', '/oʊ/', ['snow', 'grow', 'yellow']], ['ue-oo', 'ue', 'UE says OO', 'en-oo', '/uː/', ['blue', 'true', 'glue']], ['ew-oo', 'ew', 'EW says OO', 'en-oo', '/uː/ or /juː/', ['new', 'chew', 'grew']],
  ]},
  { id: 'consonant-alternatives-1', title: 'Hidden Consonant Sounds', description: 'Several letter teams spell a single familiar consonant sound.', patterns: [
    ['ph-f', 'ph', 'PH says F', 'en-f', '/f/', ['phone', 'photo', 'graph']], ['gh-f', 'gh', 'GH says F', 'en-f', '/f/', ['laugh', 'cough', 'rough']], ['kn-n', 'kn', 'Silent K before N', 'en-n', '/n/', ['knee', 'knife', 'know']], ['gn-n', 'gn', 'Silent G before N', 'en-n', '/n/', ['gnome', 'sign', 'design']], ['wr-r', 'wr', 'Silent W before R', 'en-r', '/r/', ['write', 'wrap', 'wrong']], ['mb-m', 'mb', 'Silent B after M', 'en-m', '/m/', ['lamb', 'comb', 'thumb']], ['qu-kw', 'qu', 'QU says KW', 'en-k', '/kw/', ['queen', 'quick', 'quiet']],
  ]},
  { id: 'consonant-alternatives-2', title: 'CH, J, SH & Z Spellings', description: 'Read common multi-letter spellings for consonant sounds.', patterns: [
    ['tch-ch', 'tch', 'TCH says CH', 'en-ch', '/tʃ/', ['match', 'kitchen', 'catch']], ['dge-j', 'dge', 'DGE says J', 'en-j', '/dʒ/', ['bridge', 'badge', 'edge']], ['ge-j', 'ge', 'GE can say J', 'en-j', '/dʒ/', ['gem', 'giant', 'cage']], ['ci-sh', 'ci', 'CI can say SH', 'en-sh', '/ʃ/', ['special', 'social', 'musician']], ['ti-sh', 'ti', 'TI can say SH', 'en-sh', '/ʃ/', ['station', 'motion', 'patient']], ['si-zh', 'si', 'SI can say ZH', 'en-zh', '/ʒ/', ['vision', 'usual', 'measure']], ['s-z', 's', 'S can say Z', 'en-z', '/z/', ['rose', 'music', 'has']],
  ]},
  { id: 'soft-hard-borrowed', title: 'Soft, Hard & Borrowed Sounds', description: 'The same letters can change sound in different words.', patterns: [
    ['c-s', 'c', 'Soft C', 'en-s', '/s/', ['city', 'cent', 'cycle']], ['g-j', 'g', 'Soft G', 'en-j', '/dʒ/', ['giant', 'gem', 'gym']], ['x-z', 'x', 'X says Z', 'en-z', '/z/', ['xylophone', 'xenon', 'Xavier']], ['x-gz', 'x', 'X says GZ', 'en-g', '/gz/', ['exam', 'exact', 'exist']], ['ch-k', 'ch', 'CH says K', 'en-k', '/k/', ['school', 'chorus', 'chemist']], ['ch-sh', 'ch', 'CH says SH', 'en-sh', '/ʃ/', ['chef', 'machine', 'parachute']], ['sc-s', 'sc', 'SC says S', 'en-s', '/s/', ['science', 'scene', 'scent']],
  ]},
  { id: 'vowel-teams-more', title: 'Flexible Vowel Teams', description: 'These vowel teams make sounds that learners often meet in reading.', patterns: [
    ['ea-e', 'ea', 'EA says short E', 'en-e', '/ɛ/', ['head', 'bread', 'ready']], ['ie-ee', 'ie', 'IE says long E', 'en-ee', '/iː/', ['field', 'chief', 'piece']], ['ei-ee', 'ei', 'EI says long E', 'en-ee', '/iː/', ['ceiling', 'receive', 'protein']], ['eo-ee', 'eo', 'EO says long E', 'en-ee', '/iː/', ['people', 'theory', 'leotard']], ['ui-oo', 'ui', 'UI says OO', 'en-oo', '/uː/', ['fruit', 'suit', 'juice']], ['ou-oo', 'ou', 'OU says OO', 'en-oo', '/uː/', ['soup', 'group', 'you']], ['ew-yoo', 'ew', 'EW says YOO', 'en-oo', '/juː/', ['few', 'pew', 'new']],
  ]},
  { id: 'oo-ou-variants', title: 'OO & OU Sound Families', description: 'OO and OU are flexible teams with several common sounds.', patterns: [
    ['oo-short', 'oo', 'Short OO', 'en-u', '/ʊ/', ['book', 'look', 'foot']], ['ou-uh', 'ou', 'OU says short U', 'en-uh', '/ʌ/', ['young', 'touch', 'country']], ['ou-u', 'ou', 'OU says short OO', 'en-u', '/ʊ/', ['could', 'would', 'should']], ['ou-oh', 'ou', 'OU says long O', 'en-oh', '/oʊ/', ['soul', 'shoulder', 'mould']], ['a-was', 'a', 'A says short O', 'en-o', '/ɒ/', ['was', 'want', 'watch']], ['o-do', 'o', 'O says OO', 'en-oo', '/uː/', ['do', 'to', 'who']], ['o-son', 'o', 'O says short U', 'en-uh', '/ʌ/', ['son', 'love', 'come']],
  ]},
  { id: 'r-controlled-more', title: 'More R-Controlled Spellings', description: 'R-coloured sounds appear in several spelling families.', patterns: [
    ['ear-ur', 'ear', 'EAR says ER', 'en-ur', '/ɜːr/', ['learn', 'earth', 'early']], ['wor-ur', 'wor', 'WOR says WER', 'en-ur', '/wɜːr/', ['word', 'work', 'world']], ['er-schwa', 'er', 'Unstressed ER', 'en-schwa', '/ər/', ['teacher', 'farmer', 'sister']], ['re-er', 're', 'RE ending', 'en-schwa', '/ər/', ['centre', 'metre', 'fibre']], ['ar-or', 'ar', 'AR says OR', 'en-aw', '/ɔːr/', ['warm', 'war', 'quarter']], ['our-or', 'our', 'OUR says OR', 'en-aw', '/ɔːr/', ['four', 'course', 'court']], ['ore-or', 'ore', 'ORE says OR', 'en-aw', '/ɔːr/', ['more', 'shore', 'store']],
  ]},
  { id: 'air-ear-ure', title: 'AIR, EAR & URE', description: 'Hear vowel sounds that glide toward R in many accents.', patterns: [
    ['air-air', 'air', 'AIR sound', 'en-air', '/eə/', ['chair', 'fair', 'hair']], ['are-air', 'are', 'ARE says AIR', 'en-air', '/eə/', ['care', 'share', 'square']], ['ear-ear', 'ear', 'EAR sound', 'en-ear', '/ɪə/', ['ear', 'hear', 'near']], ['eer-ear', 'eer', 'EER says EAR', 'en-ear', '/ɪə/', ['deer', 'cheer', 'steer']], ['ere-ear', 'ere', 'ERE says EAR', 'en-ear', '/ɪə/', ['here', 'mere', 'sincere']], ['oor-ure', 'oor', 'OOR sound', 'en-ure', '/ʊə/', ['poor', 'moor', 'boor']], ['ure-ure', 'ure', 'URE sound', 'en-ure', '/ʊə/', ['pure', 'cure', 'secure']],
  ]},
  { id: 'silent-letters', title: 'Silent-Letter Teams', description: 'One letter is quiet in each of these common teams.', patterns: [
    ['lk-k', 'lk', 'Silent L before K', 'en-k', '/k/', ['walk', 'talk', 'chalk']], ['lm-m', 'lm', 'Silent L before M', 'en-m', '/m/', ['calm', 'palm', 'salmon']], ['bt-t', 'bt', 'Silent B before T', 'en-t', '/t/', ['doubt', 'debt', 'subtle']], ['mn-m', 'mn', 'Silent N after M', 'en-m', '/m/', ['column', 'autumn', 'hymn']], ['ps-s', 'ps', 'Silent P before S', 'en-s', '/s/', ['psychology', 'psalm', 'pseudo']], ['rh-r', 'rh', 'Silent H after R', 'en-r', '/r/', ['rhyme', 'rhino', 'rhythm']], ['wh-h', 'wh', 'WH says H', 'en-h', '/h/', ['who', 'whole', 'whose']],
  ]},
  { id: 'inflection-endings', title: 'Word Endings by Sound', description: 'Common endings change pronunciation after different sounds.', patterns: [
    ['ed-t', 'ed', 'ED says T', 'en-t', '/t/', ['jumped', 'washed', 'helped']], ['ed-d', 'ed', 'ED says D', 'en-d', '/d/', ['played', 'called', 'cleaned']], ['ed-id', 'ed', 'ED adds a syllable', 'en-i', '/ɪd/', ['wanted', 'needed', 'started']], ['plural-s', 's', 'Plural S', 'en-s', '/s/', ['cats', 'cups', 'books']], ['plural-z', 's', 'Plural Z', 'en-z', '/z/', ['dogs', 'pens', 'trees']], ['plural-iz', 'es', 'Plural IZ', 'en-i', '/ɪz/', ['buses', 'wishes', 'boxes']], ['tion-shun', 'tion', 'TION ending', 'en-sh', '/ʃən/', ['nation', 'station', 'action']],
  ]},
  { id: 'syllable-endings', title: 'Common Syllable Endings', description: 'Read familiar endings as whole sound chunks.', patterns: [
    ['cian-shun', 'cian', 'CIAN ending', 'en-sh', '/ʃən/', ['musician', 'magician', 'electrician']], ['sion-zhun', 'sion', 'SION says ZHUN', 'en-zh', '/ʒən/', ['vision', 'division', 'occasion']], ['ture-cher', 'ture', 'TURE ending', 'en-ch', '/tʃər/', ['picture', 'nature', 'future']], ['le-ul', 'le', 'Consonant-LE', 'en-schwa', '/əl/', ['table', 'little', 'apple']], ['al-ul', 'al', 'AL ending', 'en-schwa', '/əl/', ['animal', 'hospital', 'capital']], ['el-ul', 'el', 'EL ending', 'en-schwa', '/əl/', ['travel', 'camel', 'tunnel']], ['il-ul', 'il', 'IL ending', 'en-schwa', '/əl/', ['pencil', 'fossil', 'nostril']],
  ]},
  { id: 'short-vowel-surprises', title: 'Surprising Short Vowels', description: 'Some high-frequency words use unexpected vowel spellings.', patterns: [
    ['y-i', 'y', 'Y says short I', 'en-i', '/ɪ/', ['gym', 'myth', 'symbol']], ['ui-i', 'ui', 'UI says short I', 'en-i', '/ɪ/', ['build', 'guilt', 'biscuit']], ['a-e-any', 'a', 'A says short E', 'en-e', '/ɛ/', ['any', 'many', 'Thames']], ['o-u-love', 'o', 'O says short U', 'en-uh', '/ʌ/', ['love', 'month', 'other']], ['u-short-oo', 'u', 'U says short OO', 'en-u', '/ʊ/', ['put', 'push', 'full']], ['ea-short-e', 'ea', 'EA says short E', 'en-e', '/ɛ/', ['bread', 'heavy', 'weather']], ['ie-short-e', 'ie', 'IE says short E', 'en-e', '/ɛ/', ['friend', 'friendly', 'friendship']],
  ]},
  { id: 'ough-family', title: 'The OUGH Family', description: 'One famous letter group appears with many different sounds.', patterns: [
    ['augh-aw', 'augh', 'AUGH says AW', 'en-aw', '/ɔː/', ['caught', 'taught', 'daughter']], ['ough-aw', 'ough', 'OUGH says AW', 'en-aw', '/ɔː/', ['thought', 'bought', 'brought']], ['ough-oh', 'ough', 'OUGH says long O', 'en-oh', '/oʊ/', ['though', 'dough', 'although']], ['ough-oo', 'ough', 'OUGH says OO', 'en-oo', '/uː/', ['through', 'throughout', 'breakthrough']], ['ough-ow', 'ough', 'OUGH says OW', 'en-ow', '/aʊ/', ['bough', 'plough', 'drought']], ['ough-uff', 'ough', 'OUGH says UFF', 'en-f', '/ʌf/', ['rough', 'tough', 'enough']], ['ough-uh', 'ough', 'OUGH says UH', 'en-schwa', '/ə/', ['thorough', 'borough', 'furlough']],
  ]},
];

export const completeEnglishPhonemes: Phoneme[] = [
  ['p','p','consonant','p as in pen'],['b','b','consonant','b as in bag'],['t','t','consonant','t as in top'],['d','d','consonant','d as in dog'],['k','k','consonant','k as in cat'],['g','g','consonant','g as in go'],['f','f','consonant','f as in fish'],['v','v','consonant','v as in van'],['th','θ','consonant','unvoiced th as in thin'],['dh','ð','consonant','voiced th as in this'],['s','s','consonant','s as in sun'],['z','z','consonant','z as in zoo'],['sh','ʃ','consonant','sh as in ship'],['zh','ʒ','consonant','zh as in vision'],['h','h','consonant','h as in hat'],['ch','tʃ','consonant','ch as in chip'],['j','dʒ','consonant','j as in jam'],['m','m','consonant','m as in moon'],['n','n','consonant','n as in nest'],['ng','ŋ','consonant','ng as in ring'],['l','l','consonant','l as in leg'],['r','r','consonant','r as in red'],['w','w','consonant','w as in web'],['y','j','consonant','y as in yes'],
  ['ee','iː','vowel','long e as in tree'],['i','ɪ','vowel','short i as in sit'],['e','ɛ','vowel','short e as in bed'],['ae','æ','vowel','short a as in apple'],['ar','ɑː','vowel','open a as in father'],['o','ɒ','vowel','short o as in hot'],['aw','ɔː','vowel','aw as in saw'],['u','ʊ','vowel','short oo as in book'],['oo','uː','vowel','long oo as in moon'],['uh','ʌ','vowel','short u as in sun'],['ur','ɜː','vowel','er as in bird'],['schwa','ə','vowel','unstressed vowel as in about'],['ay','eɪ','diphthong','long a as in day'],['eye','aɪ','diphthong','long i as in light'],['oy','ɔɪ','diphthong','oy as in boy'],['oh','oʊ','diphthong','long o as in home'],['ow','aʊ','diphthong','ow as in cow'],['ear','ɪə','diphthong','ear as in near'],['air','eə','diphthong','air as in chair'],['ure','ʊə','diphthong','ure as in cure'],
].map(([id, ipa, category, description]) => ({ id: `en-${id}`, languageId: 'en', ipa, category: category as Phoneme['category'], description }));

export const extendedEnglishUnits: OrthographicUnit[] = groups.flatMap((group) => group.patterns.map(([id, symbol, name, , soundHint, examples]) => ({
  id: `en-pattern-${id}`,
  languageId: 'en',
  scriptId: 'latin',
  type: 'grapheme' as const,
  symbol,
  displayName: name,
  transliteration: soundHint.replaceAll('/', ''),
  soundHint,
  speechCue: `${symbol} can say ${soundHint}, as in ${examples[0]}. ${examples.join(', ')}.`,
  exampleWords: [...examples],
})));

export const extendedEnglishLevels: ContentLevel[] = groups.map((group, index) => ({
  id: `extended-${group.id}`,
  languageId: 'en',
  title: group.title,
  description: group.description,
  focus: index < 2 ? 'Vowels' : index < 5 ? 'Consonants' : 'Advanced phonics',
  order: 10 + index,
  unitIds: group.patterns.map(([id]) => `en-pattern-${id}`),
}));

export const extendedEnglishMappings: GraphemePhonemeMapping[] = groups.flatMap((group) => group.patterns.map(([id, , , phonemeId, , examples]) => ({
  id: `map-pattern-${id}`,
  graphemeUnitId: `en-pattern-${id}`,
  phonemeIds: [phonemeId],
  examples: [...examples],
})));

export const extendedEnglishActivities: IdentifyUnitActivity[] = groups.map((group) => {
  const target = group.patterns[0];
  const choices = group.patterns.slice(0, 3).map(([id]) => `en-pattern-${id}`);
  return {
    id: `quiz-extended-${group.id}`,
    unitId: `en-pattern-${target[0]}`,
    languageId: 'en',
    title: `Find ${target[1]}`,
    prompt: `Which spelling appears in ${target[5][0]}?`,
    skill: 'recognition',
    type: 'identify-unit',
    choices,
    correctUnitId: choices[0],
  };
});
