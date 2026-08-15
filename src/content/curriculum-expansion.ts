import { phrasebook } from './phrasebook';
import type { LanguageCourse, ScriptUnit, StarterLesson } from '@/models';

type UnitSeed = [symbol: string, romanization: string, soundHint: string, example?: string];
type Inventory = {
  section: string;
  title: string;
  description: string;
  chunkSize: number;
  units: UnitSeed[];
};

function seedList(source: string): UnitSeed[] {
  return source.trim().split('\n').map((line) => {
    const [symbol, romanization, soundHint, example] = line.split('|').map((part) => part.trim());
    if (!symbol || !romanization || !soundHint) throw new Error(`Invalid curriculum seed: ${line}`);
    return [symbol, romanization, soundHint, example || undefined];
  });
}

const numbers: Record<string, UnitSeed[]> = {
  hi: seedList(`एक|ek|one
दो|do|two
तीन|tīn|three
चार|chār|four
पाँच|pāñch|five
छह|chah|six
सात|sāt|seven
आठ|āṭh|eight
नौ|nau|nine
दस|das|ten`),
  fr: seedList(`un|uhn|one
deux|duh|two
trois|trwah|three
quatre|katr|four
cinq|sank|five
six|sees|six
sept|set|seven
huit|weet|eight
neuf|nuhf|nine
dix|dees|ten`),
  es: seedList(`uno|oo-no|one
dos|dohs|two
tres|trehs|three
cuatro|kwah-tro|four
cinco|seen-ko|five
seis|says|six
siete|syeh-teh|seven
ocho|oh-cho|eight
nueve|nweh-beh|nine
diez|dyehs|ten`),
  it: seedList(`uno|oo-no|one
due|doo-eh|two
tre|treh|three
quattro|kwat-tro|four
cinque|cheen-kweh|five
sei|say|six
sette|set-teh|seven
otto|ot-toh|eight
nove|noh-veh|nine
dieci|dyeh-chee|ten`),
  de: seedList(`eins|ayns|one
zwei|tsvai|two
drei|drai|three
vier|feer|four
fünf|fuenf|five
sechs|zeks|six
sieben|zee-ben|seven
acht|akht|eight
neun|noyn|nine
zehn|tsayn|ten`),
  ru: seedList(`один|odin|one
два|dva|two
три|tri|three
четыре|chetyre|four
пять|pyat|five
шесть|shest|six
семь|sem|seven
восемь|vosem|eight
девять|devyat|nine
десять|desyat|ten`),
  ar: seedList(`واحد|wāḥid|one
اثنان|ithnān|two
ثلاثة|thalātha|three
أربعة|arbaʿa|four
خمسة|khamsa|five
ستة|sitta|six
سبعة|sabʿa|seven
ثمانية|thamāniya|eight
تسعة|tisʿa|nine
عشرة|ʿashara|ten`),
  zh: seedList(`一|yī|one
二|èr|two
三|sān|three
四|sì|four
五|wǔ|five
六|liù|six
七|qī|seven
八|bā|eight
九|jiǔ|nine
十|shí|ten`),
  ja: seedList(`一|ichi|one
二|ni|two
三|san|three
四|yon|four
五|go|five
六|roku|six
七|nana|seven
八|hachi|eight
九|kyū|nine
十|jū|ten`),
  ko: seedList(`하나|hana|one
둘|dul|two
셋|set|three
넷|net|four
다섯|daseot|five
여섯|yeoseot|six
일곱|ilgop|seven
여덟|yeodeol|eight
아홉|ahop|nine
열|yeol|ten`),
  kn: seedList(`ಒಂದು|ondu|one
ಎರಡು|eraḍu|two
ಮೂರು|mūru|three
ನಾಲ್ಕು|nālku|four
ಐದು|aidu|five
ಆರು|āru|six
ಏಳು|ēḷu|seven
ಎಂಟು|eṇṭu|eight
ಒಂಬತ್ತು|ombattu|nine
ಹತ್ತು|hattu|ten`),
  pa: seedList(`ਇੱਕ|ikk|one
ਦੋ|do|two
ਤਿੰਨ|tinn|three
ਚਾਰ|chār|four
ਪੰਜ|pañj|five
ਛੇ|che|six
ਸੱਤ|satt|seven
ਅੱਠ|aṭṭh|eight
ਨੌਂ|nauṁ|nine
ਦਸ|das|ten`),
  gu: seedList(`એક|ek|one
બે|be|two
ત્રણ|traṇ|three
ચાર|chār|four
પાંચ|pāñch|five
છ|cha|six
સાત|sāt|seven
આઠ|āṭh|eight
નવ|nav|nine
દસ|das|ten`),
  te: seedList(`ఒకటి|okaṭi|one
రెండు|reṇḍu|two
మూడు|mūḍu|three
నాలుగు|nālugu|four
ఐదు|aidu|five
ఆరు|āru|six
ఏడు|ēḍu|seven
ఎనిమిది|enimidi|eight
తొమ్మిది|tommidi|nine
పది|padi|ten`),
  sa: seedList(`एकम्|ekam|one
द्वे|dve|two
त्रीणि|trīṇi|three
चत्वारि|catvāri|four
पञ्च|pañca|five
षट्|ṣaṭ|six
सप्त|sapta|seven
अष्ट|aṣṭa|eight
नव|nava|nine
दश|daśa|ten`),
};

// These six-unit groups keep the original milestone lesson and unit IDs alive,
// so existing offline completions and recordings remain usable after expansion.
const legacyScriptContinuation: Record<string, UnitSeed[]> = {
  hi: seedList(`ए|e|long e
ऐ|ai|ai sound
ओ|o|long o
औ|au|au sound
अं|aṃ|nasal vowel
अः|aḥ|visarga`),
  fr: seedList(`G g|gé|zhay
H h|ache|ahsh
I i|i|ee
J j|ji|zhee
K k|ka|kah
L l|elle|el`),
  es: seedList(`B b|be|beh
C c|ce|seh
D d|de|deh
F f|efe|eh-feh
G g|ge|heh
H h|hache|silent h`),
  it: seedList(`B b|bi|bee
C c|ci|chee
D d|di|dee
F f|effe|ef-feh
G g|gi|jee
L l|elle|el-leh`),
  de: seedList(`G g|ge|gay
H h|ha|hah
I i|i|ee
J j|jot|yot
K k|ka|kah
L l|el|el`),
  ru: seedList(`М м|em|m sound
Н н|en|n sound
О о|o|o sound
П п|pe|p sound
Р р|er|rolled r
С с|es|s sound`),
  ar: seedList(`ش|shīn|sh sound
ص|ṣād|emphatic s
ض|ḍād|emphatic d
ط|ṭāʼ|emphatic t
ظ|ẓāʼ|emphatic dh
ع|ʿayn|deep throat sound`),
  zh: seedList(`七|qī|seven
八|bā|eight
九|jiǔ|nine
十|shí|ten
日|rì|sun or day
月|yuè|moon or month`),
  ja: seedList(`さ|sa|sa
し|shi|shi
す|su|su
せ|se|se
そ|so|so
た|ta|ta`),
  ko: seedList(`ㅐ|ae|ae vowel
ㅔ|e|e vowel
ㅚ|oe|oe vowel
ㅟ|wi|wi vowel
ㅡ|eu|eu vowel
ㅣ|i|ee vowel`),
  kn: seedList(`ಎ|e|short e
ಏ|ē|long e
ಐ|ai|ai sound
ಒ|o|short o
ಓ|ō|long o
ಔ|au|au sound`),
  pa: seedList(`ਘ|ghagghā|aspirated gh
ਙ|ṅaṅṅā|nasal ng
ਚ|chachā|ch sound
ਛ|chhachhā|aspirated ch
ਜ|jajjā|j sound
ਝ|jhajjhā|aspirated j`),
  gu: seedList(`એ|e|long e
ઐ|ai|ai sound
ઓ|o|long o
ઔ|au|au sound
અં|aṃ|nasal vowel
અઃ|aḥ|visarga`),
  te: seedList(`ఎ|e|short e
ఏ|ē|long e
ఐ|ai|ai sound
ఒ|o|short o
ఓ|ō|long o
ఔ|au|au sound`),
  sa: seedList(`ए|e|long e
ऐ|ai|diphthong ai
ओ|o|long o
औ|au|diphthong au
अं|aṃ|anusvāra
अः|aḥ|visarga`),
};

const inventories: Record<string, Inventory[]> = {
  hi: [
    { section: 'Letters & script', title: 'स्वर · Complete vowels', description: 'Read all independent Hindi vowels and nasal signs.', chunkSize: 13, units: seedList(`अ|a|short a
आ|ā|long aa
इ|i|short i
ई|ī|long ee
उ|u|short u
ऊ|ū|long oo
ऋ|ṛ|vocalic r
ए|e|long e
ऐ|ai|ai sound
ओ|o|long o
औ|au|au sound
अं|aṃ|nasal vowel
अः|aḥ|visarga breath`) },
    { section: 'Letters & script', title: 'व्यंजन · Complete consonants', description: 'Learn the consonant families in their traditional sound order.', chunkSize: 10, units: seedList(`क|ka|k sound
ख|kha|aspirated kh
ग|ga|g sound
घ|gha|aspirated gh
ङ|ṅa|nasal ng
च|ca|ch sound
छ|cha|aspirated ch
ज|ja|j sound
झ|jha|aspirated j
ञ|ña|palatal nasal
ट|ṭa|retroflex t
ठ|ṭha|aspirated retroflex t
ड|ḍa|retroflex d
ढ|ḍha|aspirated retroflex d
ण|ṇa|retroflex n
त|ta|dental t
थ|tha|aspirated dental t
द|da|dental d
ध|dha|aspirated dental d
न|na|dental n
प|pa|p sound
फ|pha|aspirated p
ब|ba|b sound
भ|bha|aspirated b
म|ma|m sound
य|ya|y sound
र|ra|flapped r
ल|la|l sound
व|va|v or w sound
श|śa|palatal sh
ष|ṣa|retroflex sh
स|sa|s sound
ह|ha|h sound
क्ष|kṣa|ksh blend
त्र|tra|tr blend
ज्ञ|jña|gy or jny blend
श्र|śra|shr blend`) },
    { section: 'Sounds & spelling', title: 'मात्राएँ · Vowel signs', description: 'Attach each vowel sign to क and read the syllable.', chunkSize: 13, units: seedList(`क|ka|inherent a
का|kā|long aa
कि|ki|short i
की|kī|long ee
कु|ku|short u
कू|kū|long oo
कृ|kṛ|vocalic r
के|ke|long e
कै|kai|ai sound
को|ko|long o
कौ|kau|au sound
कं|kaṃ|nasalised syllable
कः|kaḥ|visarga ending`) },
  ],
  fr: [
    { section: 'Letters & script', title: 'Alphabet A–Z', description: 'Learn all 26 French letter names.', chunkSize: 9, units: seedList(`A a|a|ah
B b|bé|bay
C c|cé|say
D d|dé|day
E e|e|uh
F f|effe|ef
G g|gé|zhay
H h|ache|ahsh
I i|i|ee
J j|ji|zhee
K k|ka|kah
L l|elle|el
M m|emme|em
N n|enne|en
O o|o|oh
P p|pé|pay
Q q|ku|koo
R r|erre|French r
S s|esse|es
T t|té|tay
U u|u|rounded u
V v|vé|vay
W w|double vé|double vay
X x|ix|eeks
Y y|i grec|ee grek
Z z|zède|zed`) },
    { section: 'Sounds & spelling', title: 'Phonics and accents', description: 'Hear common French spellings inside useful words.', chunkSize: 10, units: seedList(`chat|ch|sh sound
garçon|ç|soft s sound
gare|g|hard g before a
girafe|g|zh sound before i
question|qu|k sound
photo|ph|f sound
fille|ill|y glide
été|é|closed ay sound
père|è|open eh sound
eau|eau|oh sound
deux|eu|rounded uh sound
pain|ain|nasal eh sound
bon|on|nasal oh sound
un|un|nasal vowel`) },
  ],
  es: [
    { section: 'Letters & script', title: 'Abecedario A–Z', description: 'Learn the 27-letter modern Spanish alphabet.', chunkSize: 9, units: seedList(`A a|a|ah
B b|be|beh
C c|ce|seh
D d|de|deh
E e|e|eh
F f|efe|eh-feh
G g|ge|heh
H h|hache|silent h
I i|i|ee
J j|jota|strong h
K k|ka|kah
L l|ele|eh-leh
M m|eme|eh-meh
N n|ene|eh-neh
Ñ ñ|eñe|ny sound
O o|o|oh
P p|pe|peh
Q q|cu|koo
R r|erre|tap or trill
S s|ese|eh-seh
T t|te|teh
U u|u|oo
V v|uve|oo-beh
W w|uve doble|double uve
X x|equis|eh-kees
Y y|ye|yeh
Z z|zeta|seh-tah`) },
    { section: 'Sounds & spelling', title: 'Sonidos clave · Key phonics', description: 'Read predictable Spanish sound patterns.', chunkSize: 12, units: seedList(`casa|ca|hard k sound
cena|ce|s or th sound
gato|ga|hard g sound
gente|ge|strong h sound
queso|que|k sound
guitarra|gui|hard g sound
chico|ch|ch sound
llave|ll|y sound
niño|ñ|ny sound
perro|rr|strong trill
hola|h|h is silent
jamón|j|strong h sound`) },
  ],
  it: [
    { section: 'Letters & script', title: 'Alfabeto italiano', description: 'Learn 21 native letters and five common loanword letters.', chunkSize: 9, units: seedList(`A a|a|ah
B b|bi|bee
C c|ci|chee
D d|di|dee
E e|e|eh
F f|effe|ef-feh
G g|gi|jee
H h|acca|ak-kah
I i|i|ee
L l|elle|el-leh
M m|emme|em-meh
N n|enne|en-neh
O o|o|oh
P p|pi|pee
Q q|cu|koo
R r|erre|rolled r
S s|esse|es-seh
T t|ti|tee
U u|u|oo
V v|vi|vee
Z z|zeta|dzet-ah
J j|i lunga|loanword j
K k|cappa|loanword k
W w|doppia vu|loanword w
X x|ics|loanword x
Y y|ipsilon|loanword y`) },
    { section: 'Sounds & spelling', title: 'Suoni e combinazioni', description: 'Practise high-value Italian spelling combinations.', chunkSize: 12, units: seedList(`casa|ca|hard k sound
cena|ce|ch sound
chiesa|chi|hard k sound
gatto|ga|hard g sound
gelato|ge|j sound
spaghetti|ghe|hard g sound
gnocchi|gn|ny sound
figlio|gli|ly sound
scena|sce|sh sound
scuola|scu|sk sound
quadro|qu|kw sound
pizza|zz|strong ts sound`) },
  ],
  de: [
    { section: 'Letters & script', title: 'Alphabet A–Z', description: 'Learn German letter names plus Ä, Ö, Ü, and ß.', chunkSize: 10, units: seedList(`A a|a|ah
B b|be|bay
C c|ce|tsay
D d|de|day
E e|e|ay
F f|ef|ef
G g|ge|gay
H h|ha|hah
I i|i|ee
J j|jot|yot
K k|ka|kah
L l|el|el
M m|em|em
N n|en|en
O o|o|oh
P p|pe|pay
Q q|ku|koo
R r|er|German r
S s|es|es
T t|te|tay
U u|u|oo
V v|fau|fow
W w|we|vay
X x|ix|iks
Y y|ypsilon|uepsilon
Z z|zett|tset
Ä ä|ä|open eh
Ö ö|ö|rounded e
Ü ü|ü|rounded ee
ß|Eszett|sharp s`) },
    { section: 'Sounds & spelling', title: 'Laute · Key phonics', description: 'Read common German vowel and consonant spellings.', chunkSize: 12, units: seedList(`mein|ei|eye sound
Liebe|ie|long ee
Haus|au|ow sound
heute|eu|oy sound
Schule|sch|sh sound
ich|ich-Laut|soft ch
Buch|ach-Laut|throaty ch
Zeit|z|ts sound
Vater|v|f sound
Wasser|w|v sound
Straße|ß|ss sound
Jahr|j|y sound`) },
  ],
  ru: [
    { section: 'Letters & script', title: 'Русский алфавит', description: 'Learn all 33 letters of the modern Russian alphabet.', chunkSize: 11, units: seedList(`А а|a|a as in father
Б б|be|b sound
В в|ve|v sound
Г г|ge|g sound
Д д|de|d sound
Е е|ye|ye or e
Ё ё|yo|yo sound
Ж ж|zhe|zh sound
З з|ze|z sound
И и|i|ee sound
Й й|short i|y glide
К к|ka|k sound
Л л|el|l sound
М м|em|m sound
Н н|en|n sound
О о|o|o sound
П п|pe|p sound
Р р|er|rolled r
С с|es|s sound
Т т|te|t sound
У у|u|oo sound
Ф ф|ef|f sound
Х х|kha|kh sound
Ц ц|tse|ts sound
Ч ч|che|ch sound
Ш ш|sha|hard sh
Щ щ|shcha|soft long sh
Ъ|hard sign|separates and hardens
Ы ы|y|central vowel
Ь|soft sign|softens a consonant
Э э|e|open eh
Ю ю|yu|yu sound
Я я|ya|ya sound`) },
    { section: 'Sounds & spelling', title: 'Читаем · Reading patterns', description: 'Practise common Cyrillic letter combinations in words.', chunkSize: 10, units: seedList(`мама|mama|mama
папа|papa|papa
дом|dom|house
кот|kot|cat
мир|mir|peace or world
чай|chai|tea
хлеб|khleb|bread
щука|shchuka|pike fish
день|den|soft n ending
объект|obyekt|hard sign separates sounds`) },
  ],
  ar: [
    { section: 'Letters & script', title: 'الحروف · Complete alphabet', description: 'Learn all 28 Arabic letters from right to left.', chunkSize: 7, units: seedList(`ا|alif|long a
ب|bāʼ|b sound
ت|tāʼ|t sound
ث|thāʼ|th as in thin
ج|jīm|j sound
ح|ḥāʼ|deep breathy h
خ|khāʼ|kh sound
د|dāl|d sound
ذ|dhāl|th as in this
ر|rāʼ|rolled r
ز|zāy|z sound
س|sīn|s sound
ش|shīn|sh sound
ص|ṣād|emphatic s
ض|ḍād|emphatic d
ط|ṭāʼ|emphatic t
ظ|ẓāʼ|emphatic dh
ع|ʿayn|voiced throat sound
غ|ghayn|gh sound
ف|fāʼ|f sound
ق|qāf|deep q sound
ك|kāf|k sound
ل|lām|l sound
م|mīm|m sound
ن|nūn|n sound
ه|hāʼ|h sound
و|wāw|w or long oo
ي|yāʼ|y or long ee`) },
    { section: 'Sounds & spelling', title: 'الحركات · Vowels and joining', description: 'Read vowel marks and connected letters inside words.', chunkSize: 8, units: seedList(`بَ|ba|fatḥa short a
بِ|bi|kasra short i
بُ|bu|ḍamma short u
بْ|b|sukūn no vowel
بَّ|bba|shadda doubled b
باب|bāb|long aa, door
بيت|bayt|joined letters, house
كتاب|kitāb|joined letters, book
مدرسة|madrasa|joined letters, school
شمس|shams|sun
قمر|qamar|moon
ماء|māʼ|water
سلام|salām|peace or hello`) },
  ],
  zh: [
    { section: 'Sounds & spelling', title: '拼音声母 · Pinyin initials', description: 'Learn the Mandarin consonant initials and glides.', chunkSize: 11, units: seedList(`b|b|unaspirated p-like sound
p|p|aspirated p
m|m|m sound
f|f|f sound
d|d|unaspirated t-like sound
t|t|aspirated t
n|n|n sound
l|l|l sound
g|g|unaspirated k-like sound
k|k|aspirated k
h|h|h sound
j|j|unaspirated soft j
q|q|aspirated soft ch
x|x|soft sh
zh|zh|retroflex j
ch|ch|retroflex aspirated ch
sh|sh|retroflex sh
r|r|Mandarin r
z|z|unaspirated ts
c|c|aspirated ts
s|s|s sound
y|y|y glide
w|w|w glide`) },
    { section: 'Sounds & spelling', title: '拼音韵母 · Pinyin finals', description: 'Build syllables with simple, compound, and nasal finals.', chunkSize: 12, units: seedList(`a|a|open a
o|o|rounded o
e|e|central e
i|i|ee
u|u|oo
ü|ü|front rounded u
ai|ai|eye
ei|ei|ay
ao|ao|ow
ou|ou|oh
ia|ia|ya
ie|ie|yeh
ua|ua|wah
uo|uo|woh
an|an|a plus n
en|en|e plus n
in|in|i plus n
un|un|u plus n
ün|ün|ü plus n
ang|ang|back nasal ang
eng|eng|back nasal eng
ing|ing|back nasal ing
ong|ong|rounded back nasal
ian|ian|yan
uan|uan|wan
uang|uang|wang`) },
    { section: 'Sounds & spelling', title: '声调 · Tone contrast', description: 'Hear how tone changes meaning in one syllable family.', chunkSize: 5, units: seedList(`妈|mā|mother, first tone
麻|má|hemp, second tone
马|mǎ|horse, third tone
骂|mà|scold, fourth tone
吗|ma|question particle, neutral tone`) },
    { section: 'Letters & script', title: '汉字 · Starter characters', description: 'Recognise high-frequency Hanzi by sound and meaning.', chunkSize: 10, units: seedList(`我|wǒ|I or me
你|nǐ|you
他|tā|he
她|tā|she
好|hǎo|good
是|shì|to be
不|bù|not
有|yǒu|to have
人|rén|person
大|dà|big
小|xiǎo|small
中|zhōng|middle
国|guó|country
日|rì|sun or day
月|yuè|moon or month
山|shān|mountain
水|shuǐ|water
火|huǒ|fire
木|mù|wood
口|kǒu|mouth`) },
  ],
  ja: [
    { section: 'Letters & script', title: 'ひらがな · Complete Hiragana', description: 'Learn the 46 basic Hiragana in sound order.', chunkSize: 10, units: seedList(`あ|a|ah
い|i|ee
う|u|oo
え|e|eh
お|o|oh
か|ka|ka
き|ki|ki
く|ku|ku
け|ke|ke
こ|ko|ko
さ|sa|sa
し|shi|shi
す|su|su
せ|se|se
そ|so|so
た|ta|ta
ち|chi|chi
つ|tsu|tsu
て|te|te
と|to|to
な|na|na
に|ni|ni
ぬ|nu|nu
ね|ne|ne
の|no|no
は|ha|ha
ひ|hi|hi
ふ|fu|fu
へ|he|he
ほ|ho|ho
ま|ma|ma
み|mi|mi
む|mu|mu
め|me|me
も|mo|mo
や|ya|ya
ゆ|yu|yu
よ|yo|yo
ら|ra|ra
り|ri|ri
る|ru|ru
れ|re|re
ろ|ro|ro
わ|wa|wa
を|o|object marker o
ん|n|final n`) },
    { section: 'Letters & script', title: 'カタカナ · Complete Katakana', description: 'Learn the 46 basic Katakana used especially for loanwords.', chunkSize: 10, units: seedList(`ア|a|ah
イ|i|ee
ウ|u|oo
エ|e|eh
オ|o|oh
カ|ka|ka
キ|ki|ki
ク|ku|ku
ケ|ke|ke
コ|ko|ko
サ|sa|sa
シ|shi|shi
ス|su|su
セ|se|se
ソ|so|so
タ|ta|ta
チ|chi|chi
ツ|tsu|tsu
テ|te|te
ト|to|to
ナ|na|na
ニ|ni|ni
ヌ|nu|nu
ネ|ne|ne
ノ|no|no
ハ|ha|ha
ヒ|hi|hi
フ|fu|fu
ヘ|he|he
ホ|ho|ho
マ|ma|ma
ミ|mi|mi
ム|mu|mu
メ|me|me
モ|mo|mo
ヤ|ya|ya
ユ|yu|yu
ヨ|yo|yo
ラ|ra|ra
リ|ri|ri
ル|ru|ru
レ|re|re
ロ|ro|ro
ワ|wa|wa
ヲ|o|object marker o
ン|n|final n`) },
    { section: 'Sounds & spelling', title: '濁音・拗音 · Sound changes', description: 'Use marks and small kana to build more syllables.', chunkSize: 12, units: seedList(`が|ga|voiced ka
ざ|za|voiced sa
だ|da|voiced ta
ば|ba|voiced ha
ぱ|pa|p sound
きゃ|kya|contracted kya
きゅ|kyu|contracted kyu
きょ|kyo|contracted kyo
しゃ|sha|contracted sha
ちゃ|cha|contracted cha
っ|small tsu|doubles next consonant
ー|long mark|lengthens Katakana vowel`) },
    { section: 'Letters & script', title: '漢字 · First Kanji', description: 'Recognise ten useful beginner Kanji.', chunkSize: 10, units: seedList(`日|hi / nichi|sun or day
月|tsuki / getsu|moon or month
火|hi / ka|fire
水|mizu / sui|water
木|ki / moku|tree or wood
金|kane / kin|gold or money
土|tsuchi / do|earth
人|hito / jin|person
山|yama / san|mountain
川|kawa / sen|river`) },
  ],
  ko: [
    { section: 'Letters & script', title: '자음 · Complete consonants', description: 'Learn 14 basic and five tense Hangul consonants.', chunkSize: 10, units: seedList(`ㄱ|g/k|g or k
ㄴ|n|n sound
ㄷ|d/t|d or t
ㄹ|r/l|r or l
ㅁ|m|m sound
ㅂ|b/p|b or p
ㅅ|s|s sound
ㅇ|silent/ng|silent first or ng final
ㅈ|j|j sound
ㅊ|ch|aspirated ch
ㅋ|k|aspirated k
ㅌ|t|aspirated t
ㅍ|p|aspirated p
ㅎ|h|h sound
ㄲ|kk|tense k
ㄸ|tt|tense t
ㅃ|pp|tense p
ㅆ|ss|tense s
ㅉ|jj|tense j`) },
    { section: 'Letters & script', title: '모음 · Complete vowels', description: 'Learn 10 basic and 11 compound Hangul vowels.', chunkSize: 11, units: seedList(`ㅏ|a|ah
ㅑ|ya|yah
ㅓ|eo|uh
ㅕ|yeo|yuh
ㅗ|o|oh
ㅛ|yo|yoh
ㅜ|u|oo
ㅠ|yu|yoo
ㅡ|eu|flat eu
ㅣ|i|ee
ㅐ|ae|ae
ㅒ|yae|yae
ㅔ|e|eh
ㅖ|ye|yeh
ㅘ|wa|wah
ㅙ|wae|weh
ㅚ|oe|weh
ㅝ|wo|wuh
ㅞ|we|weh
ㅟ|wi|wee
ㅢ|ui|ui`) },
    { section: 'Sounds & spelling', title: '음절 · Build syllable blocks', description: 'Combine consonants and vowels into square Hangul blocks.', chunkSize: 12, units: seedList(`가|ga|ㄱ plus ㅏ
나|na|ㄴ plus ㅏ
다|da|ㄷ plus ㅏ
마|ma|ㅁ plus ㅏ
바|ba|ㅂ plus ㅏ
사|sa|ㅅ plus ㅏ
아|a|ㅇ plus ㅏ
자|ja|ㅈ plus ㅏ
한|han|ㅎ plus ㅏ plus ㄴ
글|geul|ㄱ plus ㅡ plus ㄹ
집|jip|ㅈ plus ㅣ plus ㅂ
물|mul|ㅁ plus ㅜ plus ㄹ`) },
  ],
  kn: [
    { section: 'Letters & script', title: 'ಸ್ವರಗಳು · Complete vowels', description: 'Learn the full beginner Kannada vowel set.', chunkSize: 8, units: seedList(`ಅ|a|short a
ಆ|ā|long aa
ಇ|i|short i
ಈ|ī|long ee
ಉ|u|short u
ಊ|ū|long oo
ಋ|ṛ|vocalic r
ೠ|ṝ|long vocalic r
ಎ|e|short e
ಏ|ē|long e
ಐ|ai|ai sound
ಒ|o|short o
ಓ|ō|long o
ಔ|au|au sound
ಅಂ|aṃ|anusvāra
ಅಃ|aḥ|visarga`) },
    { section: 'Letters & script', title: 'ವ್ಯಂಜನಗಳು · Complete consonants', description: 'Learn the Kannada consonant families in sound order.', chunkSize: 10, units: seedList(`ಕ|ka|k sound
ಖ|kha|aspirated kh
ಗ|ga|g sound
ಘ|gha|aspirated gh
ಙ|ṅa|nasal ng
ಚ|ca|ch sound
ಛ|cha|aspirated ch
ಜ|ja|j sound
ಝ|jha|aspirated j
ಞ|ña|palatal nasal
ಟ|ṭa|retroflex t
ಠ|ṭha|aspirated retroflex t
ಡ|ḍa|retroflex d
ಢ|ḍha|aspirated retroflex d
ಣ|ṇa|retroflex n
ತ|ta|dental t
ಥ|tha|aspirated dental t
ದ|da|dental d
ಧ|dha|aspirated dental d
ನ|na|dental n
ಪ|pa|p sound
ಫ|pha|aspirated p
ಬ|ba|b sound
ಭ|bha|aspirated b
ಮ|ma|m sound
ಯ|ya|y sound
ರ|ra|r sound
ಲ|la|l sound
ವ|va|v or w sound
ಶ|śa|palatal sh
ಷ|ṣa|retroflex sh
ಸ|sa|s sound
ಹ|ha|h sound
ಳ|ḷa|retroflex l`) },
    { section: 'Sounds & spelling', title: 'ಗುಣಿತಾಕ್ಷರಗಳು · Vowel signs', description: 'Attach Kannada vowel signs to ಕ.', chunkSize: 8, units: seedList(`ಕ|ka|inherent a
ಕಾ|kā|long aa
ಕಿ|ki|short i
ಕೀ|kī|long ee
ಕು|ku|short u
ಕೂ|kū|long oo
ಕೃ|kṛ|vocalic r
ಕೆ|ke|short e
ಕೇ|kē|long e
ಕೈ|kai|ai sound
ಕೊ|ko|short o
ಕೋ|kō|long o
ಕೌ|kau|au sound
ಕಂ|kaṃ|anusvāra
ಕಃ|kaḥ|visarga`) },
  ],
  pa: [
    { section: 'Letters & script', title: 'ਪੈਂਤੀ ਅੱਖਰੀ · 35 letters', description: 'Learn the complete traditional Gurmukhi letter inventory.', chunkSize: 9, units: seedList(`ੳ|uṛā|vowel carrier
ਅ|aiṛā|a sound
ੲ|īṛī|vowel carrier
ਸ|sassā|s sound
ਹ|hāhā|h sound
ਕ|kakkā|k sound
ਖ|khakhā|aspirated kh
ਗ|gaggā|g sound
ਘ|ghagghā|aspirated gh
ਙ|ṅaṅṅā|nasal ng
ਚ|chachā|ch sound
ਛ|chhachhā|aspirated ch
ਜ|jajjā|j sound
ਝ|jhajjhā|aspirated j
ਞ|ñaññā|palatal nasal
ਟ|ṭaiṅkā|retroflex t
ਠ|ṭhaṭhā|aspirated retroflex t
ਡ|ḍaḍḍā|retroflex d
ਢ|ḍhaḍḍhā|aspirated retroflex d
ਣ|ṇāṇā|retroflex n
ਤ|tattā|dental t
ਥ|thathā|aspirated dental t
ਦ|daddā|dental d
ਧ|dhaddā|aspirated dental d
ਨ|nannā|n sound
ਪ|pappā|p sound
ਫ|phapphā|aspirated p
ਬ|babbā|b sound
ਭ|bhabbhā|aspirated b
ਮ|mammā|m sound
ਯ|yayyā|y sound
ਰ|rārā|r sound
ਲ|lallā|l sound
ਵ|vāvā|v or w sound
ੜ|ṛāṛā|flapped retroflex r`) },
    { section: 'Sounds & spelling', title: 'ਲਗਾਂ ਮਾਤਰਾਂ · Vowel signs', description: 'Build syllables with Gurmukhi vowel and nasal signs.', chunkSize: 12, units: seedList(`ਕ|ka|inherent a
ਕਾ|kā|kannā long aa
ਕਿ|ki|sihārī short i
ਕੀ|kī|bihārī long ee
ਕੁ|ku|auṅkaṛ short u
ਕੂ|kū|dulaiṅkaṛ long oo
ਕੇ|ke|lā̃ vowel e
ਕੈ|kai|dulāvā̃ vowel ai
ਕੋ|ko|hōṛā vowel o
ਕੌ|kau|kanauṛā vowel au
ਕੰ|kaṃ|ṭippī nasal
ਕਾਂ|kā̃|bindī nasal`) },
  ],
  gu: [
    { section: 'Letters & script', title: 'સ્વર · Complete vowels', description: 'Learn Gujarati independent vowels and signs.', chunkSize: 13, units: seedList(`અ|a|short a
આ|ā|long aa
ઇ|i|short i
ઈ|ī|long ee
ઉ|u|short u
ઊ|ū|long oo
ઋ|ṛ|vocalic r
એ|e|long e
ઐ|ai|ai sound
ઓ|o|long o
ઔ|au|au sound
અં|aṃ|anusvāra
અઃ|aḥ|visarga`) },
    { section: 'Letters & script', title: 'વ્યંજન · Complete consonants', description: 'Learn Gujarati consonant families in sound order.', chunkSize: 10, units: seedList(`ક|ka|k sound
ખ|kha|aspirated kh
ગ|ga|g sound
ઘ|gha|aspirated gh
ઙ|ṅa|nasal ng
ચ|ca|ch sound
છ|cha|aspirated ch
જ|ja|j sound
ઝ|jha|aspirated j
ઞ|ña|palatal nasal
ટ|ṭa|retroflex t
ઠ|ṭha|aspirated retroflex t
ડ|ḍa|retroflex d
ઢ|ḍha|aspirated retroflex d
ણ|ṇa|retroflex n
ત|ta|dental t
થ|tha|aspirated dental t
દ|da|dental d
ધ|dha|aspirated dental d
ન|na|dental n
પ|pa|p sound
ફ|pha|aspirated p
બ|ba|b sound
ભ|bha|aspirated b
મ|ma|m sound
ય|ya|y sound
ર|ra|r sound
લ|la|l sound
વ|va|v or w sound
શ|śa|palatal sh
ષ|ṣa|retroflex sh
સ|sa|s sound
હ|ha|h sound
ળ|ḷa|retroflex l
ક્ષ|kṣa|ksh blend
જ્ઞ|jña|jny blend`) },
    { section: 'Sounds & spelling', title: 'માત્રાઓ · Vowel signs', description: 'Attach Gujarati vowel signs to ક.', chunkSize: 13, units: seedList(`ક|ka|inherent a
કા|kā|long aa
કિ|ki|short i
કી|kī|long ee
કુ|ku|short u
કૂ|kū|long oo
કૃ|kṛ|vocalic r
કે|ke|long e
કૈ|kai|ai sound
કો|ko|long o
કૌ|kau|au sound
કં|kaṃ|anusvāra
કઃ|kaḥ|visarga`) },
  ],
  te: [
    { section: 'Letters & script', title: 'అచ్చులు · Complete vowels', description: 'Learn the full beginner Telugu vowel set.', chunkSize: 8, units: seedList(`అ|a|short a
ఆ|ā|long aa
ఇ|i|short i
ఈ|ī|long ee
ఉ|u|short u
ఊ|ū|long oo
ఋ|ṛ|vocalic r
ౠ|ṝ|long vocalic r
ఎ|e|short e
ఏ|ē|long e
ఐ|ai|ai sound
ఒ|o|short o
ఓ|ō|long o
ఔ|au|au sound
అం|aṃ|anusvāra
అః|aḥ|visarga`) },
    { section: 'Letters & script', title: 'హల్లులు · Complete consonants', description: 'Learn Telugu consonant families in sound order.', chunkSize: 10, units: seedList(`క|ka|k sound
ఖ|kha|aspirated kh
గ|ga|g sound
ఘ|gha|aspirated gh
ఙ|ṅa|nasal ng
చ|ca|ch sound
ఛ|cha|aspirated ch
జ|ja|j sound
ఝ|jha|aspirated j
ఞ|ña|palatal nasal
ట|ṭa|retroflex t
ఠ|ṭha|aspirated retroflex t
డ|ḍa|retroflex d
ఢ|ḍha|aspirated retroflex d
ణ|ṇa|retroflex n
త|ta|dental t
థ|tha|aspirated dental t
ద|da|dental d
ధ|dha|aspirated dental d
న|na|dental n
ప|pa|p sound
ఫ|pha|aspirated p
బ|ba|b sound
భ|bha|aspirated b
మ|ma|m sound
య|ya|y sound
ర|ra|r sound
ల|la|l sound
వ|va|v or w sound
శ|śa|palatal sh
ష|ṣa|retroflex sh
స|sa|s sound
హ|ha|h sound
ళ|ḷa|retroflex l
క్ష|kṣa|ksh blend
ఱ|ṟa|strong alveolar r`) },
    { section: 'Sounds & spelling', title: 'గుణింతాలు · Vowel signs', description: 'Attach Telugu vowel signs to క.', chunkSize: 8, units: seedList(`క|ka|inherent a
కా|kā|long aa
కి|ki|short i
కీ|kī|long ee
కు|ku|short u
కూ|kū|long oo
కృ|kṛ|vocalic r
కె|ke|short e
కే|kē|long e
కై|kai|ai sound
కొ|ko|short o
కో|kō|long o
కౌ|kau|au sound
కం|kaṃ|anusvāra
కః|kaḥ|visarga`) },
  ],
  sa: [
    { section: 'Letters & script', title: 'स्वराः · Complete vowels', description: 'Learn Sanskrit vowels with precise length.', chunkSize: 8, units: seedList(`अ|a|short a
आ|ā|long aa
इ|i|short i
ई|ī|long ee
उ|u|short u
ऊ|ū|long oo
ऋ|ṛ|vocalic r
ॠ|ṝ|long vocalic r
ऌ|ḷ|vocalic l
ए|e|long e
ऐ|ai|diphthong ai
ओ|o|long o
औ|au|diphthong au
अं|aṃ|anusvāra
अः|aḥ|visarga`) },
    { section: 'Letters & script', title: 'व्यञ्जनानि · Complete consonants', description: 'Learn Sanskrit consonants in their phonetic classes.', chunkSize: 10, units: seedList(`क|ka|unaspirated k
ख|kha|aspirated k
ग|ga|unaspirated g
घ|gha|aspirated g
ङ|ṅa|velar nasal
च|ca|unaspirated ch
छ|cha|aspirated ch
ज|ja|unaspirated j
झ|jha|aspirated j
ञ|ña|palatal nasal
ट|ṭa|retroflex t
ठ|ṭha|aspirated retroflex t
ड|ḍa|retroflex d
ढ|ḍha|aspirated retroflex d
ण|ṇa|retroflex nasal
त|ta|dental t
थ|tha|aspirated dental t
द|da|dental d
ध|dha|aspirated dental d
न|na|dental n
प|pa|unaspirated p
फ|pha|aspirated p
ब|ba|unaspirated b
भ|bha|aspirated b
म|ma|labial nasal
य|ya|palatal glide
र|ra|flapped r
ल|la|dental l
व|va|labial glide
श|śa|palatal sibilant
ष|ṣa|retroflex sibilant
स|sa|dental sibilant
ह|ha|voiced h
क्ष|kṣa|ksh conjunct
त्र|tra|tr conjunct
ज्ञ|jña|jny conjunct
श्र|śra|shr conjunct`) },
    { section: 'Sounds & spelling', title: 'मात्राः · Vowel signs', description: 'Read each Sanskrit vowel sign with क.', chunkSize: 8, units: seedList(`क|ka|inherent a
का|kā|long aa
कि|ki|short i
की|kī|long ee
कु|ku|short u
कू|kū|long oo
कृ|kṛ|vocalic r
कॄ|kṝ|long vocalic r
कॢ|kḷ|vocalic l
के|ke|long e
कै|kai|ai diphthong
को|ko|long o
कौ|kau|au diphthong
कं|kaṃ|anusvāra
कः|kaḥ|visarga`) },
  ],
};

function units(languageId: string, lessonId: string, seeds: UnitSeed[]): ScriptUnit[] {
  return seeds.map(([symbol, romanization, soundHint, example], index) => ({
    id: `${languageId}-${lessonId}-${index + 1}`,
    symbol,
    name: symbol,
    romanization,
    soundHint,
    example,
  }));
}

function inventoryLessons(languageId: string, inventory: Inventory, inventoryIndex: number): StarterLesson[] {
  const lessons: StarterLesson[] = [];
  for (let offset = 0; offset < inventory.units.length; offset += inventory.chunkSize) {
    const part = Math.floor(offset / inventory.chunkSize) + 1;
    const partCount = Math.ceil(inventory.units.length / inventory.chunkSize);
    const id = `foundation-${inventoryIndex + 1}-${part}`;
    lessons.push({
      id: `${languageId}-${id}`,
      section: inventory.section,
      title: partCount > 1 ? `${inventory.title} · ${part}` : inventory.title,
      description: inventory.description,
      units: units(languageId, id, inventory.units.slice(offset, offset + inventory.chunkSize)),
    });
  }
  return lessons;
}

export function buildCurriculumExpansion(course: LanguageCourse): StarterLesson[] {
  if (course.id === 'en' || course.id === 'mr') return [];
  const foundationLessons = (inventories[course.id] ?? []).flatMap((inventory, index) => inventoryLessons(course.id, inventory, index));
  const numberSeeds = numbers[course.id] ?? [];
  const legacyScriptSeeds = legacyScriptContinuation[course.id] ?? [];
  const phraseSeeds: UnitSeed[] = (phrasebook[course.id] ?? []).map((phrase) => [phrase.native, phrase.romanization, phrase.english]);
  const wordSeeds: UnitSeed[] = course.vocabulary.map((word) => [word.native, word.romanization, word.english]);
  return [
    { id: `${course.id}-script-more`, section: 'Letters & script', title: `${course.scriptName} · Next symbols`, description: 'The original starter group, preserved with your previous progress.', units: units(course.id, 'script-more', legacyScriptSeeds) },
    { id: `${course.id}-numbers-1-5`, section: 'Numbers & vocabulary', title: 'Numbers 1–5 · Original review', description: 'The original counting lesson, preserved with your previous progress.', units: units(course.id, 'numbers', numberSeeds.slice(0, 5)) },
    ...foundationLessons,
    { id: `${course.id}-numbers-1-10`, section: 'Numbers & vocabulary', title: 'Numbers 1–10', description: 'Listen, recognise, say, and review the first ten counting words.', units: units(course.id, 'numbers-1-10', numberSeeds) },
    { id: `${course.id}-picture-words`, section: 'Numbers & vocabulary', title: 'First picture words', description: 'Build useful vocabulary from six familiar picture concepts.', units: units(course.id, 'picture-words', wordSeeds) },
    { id: `${course.id}-first-phrases`, section: 'Sentences & conversation', title: 'Useful beginner phrases', description: 'Listen to complete phrases, repeat them, and use them in conversation.', units: units(course.id, 'phrases', phraseSeeds) },
  ].filter((lesson) => lesson.units.length > 0);
}
