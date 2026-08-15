import type { PhraseEntry } from '@/models';

export const phrasebook: Record<string, PhraseEntry[]> = {
  en: [
    { native: 'Hello!', romanization: 'hello', english: 'Hello!' },
    { native: 'My name is ___.', romanization: 'my name is', english: 'My name is ___.' },
    { native: 'I would like water, please.', romanization: 'I would like water, please', english: 'I would like water, please.' },
  ],
  mr: [
    { native: 'नमस्कार!', romanization: 'namaskār', english: 'Hello!' },
    { native: 'माझे नाव ___ आहे.', romanization: 'mājhe nāv ___ āhe', english: 'My name is ___.' },
    { native: 'तुमचे नाव काय आहे?', romanization: 'tumce nāv kāy āhe', english: 'What is your name?' },
    { native: 'तुम्ही कसे आहात?', romanization: 'tumhī kase āhāt', english: 'How are you?' },
    { native: 'मी ठीक आहे.', romanization: 'mī ṭhīk āhe', english: 'I am fine.' },
    { native: 'हो.', romanization: 'ho', english: 'Yes.' },
    { native: 'नाही.', romanization: 'nāhī', english: 'No.' },
    { native: 'मला मराठी शिकायची आहे.', romanization: 'malā marāṭhī śikāyacī āhe', english: 'I want to learn Marathi.' },
    { native: 'कृपया हळू बोला.', romanization: 'kr̥payā haḷū bolā', english: 'Please speak slowly.' },
    { native: 'पुन्हा सांगा, कृपया.', romanization: 'punhā sāṅgā, kr̥payā', english: 'Please say it again.' },
    { native: 'मला समजले.', romanization: 'malā samajale', english: 'I understood.' },
    { native: 'मला समजले नाही.', romanization: 'malā samajale nāhī', english: 'I did not understand.' },
    { native: 'मला पाणी हवे आहे.', romanization: 'malā pāṇī have āhe', english: 'I would like water.' },
    { native: 'धन्यवाद!', romanization: 'dhanyavād', english: 'Thank you!' },
    { native: 'पुन्हा भेटूया.', romanization: 'punhā bheṭūyā', english: 'See you again.' },
  ],
  hi: [
    { native: 'नमस्ते!', romanization: 'namaste', english: 'Hello!' },
    { native: 'मेरा नाम ___ है।', romanization: 'merā nām ___ hai', english: 'My name is ___.' },
    { native: 'मुझे पानी चाहिए।', romanization: 'mujhe pānī chāhiye', english: 'I would like water.' },
  ],
  fr: [
    { native: 'Bonjour !', romanization: 'bohn-zhoor', english: 'Hello!' },
    { native: "Je m’appelle ___.", romanization: 'zhuh mah-pell', english: 'My name is ___.' },
    { native: "Je voudrais de l’eau, s’il vous plaît.", romanization: 'zhuh voo-dray duh loh', english: 'I would like water, please.' },
  ],
  es: [
    { native: '¡Hola!', romanization: 'oh-la', english: 'Hello!' },
    { native: 'Me llamo ___.', romanization: 'meh yah-moh', english: 'My name is ___.' },
    { native: 'Quisiera agua, por favor.', romanization: 'kee-syeh-rah ah-gwah', english: 'I would like water, please.' },
  ],
  it: [
    { native: 'Ciao!', romanization: 'chow', english: 'Hello!' },
    { native: 'Mi chiamo ___.', romanization: 'mee kyah-moh', english: 'My name is ___.' },
    { native: "Vorrei dell’acqua, per favore.", romanization: 'vor-ray dell ah-kwah', english: 'I would like water, please.' },
  ],
  de: [
    { native: 'Hallo!', romanization: 'hah-loh', english: 'Hello!' },
    { native: 'Ich heiße ___.', romanization: 'ikh high-seh', english: 'My name is ___.' },
    { native: 'Ich möchte Wasser, bitte.', romanization: 'ikh merkh-teh vah-ser', english: 'I would like water, please.' },
  ],
  ru: [
    { native: 'Здравствуйте!', romanization: 'zdravstvuyte', english: 'Hello!' },
    { native: 'Меня зовут ___.', romanization: 'menya zovut', english: 'My name is ___.' },
    { native: 'Я хочу воды, пожалуйста.', romanization: 'ya khochu vody, pozhaluysta', english: 'I would like water, please.' },
  ],
  ar: [
    { native: 'مرحبًا!', romanization: 'marḥaban', english: 'Hello!' },
    { native: 'اسمي ___.', romanization: 'ismī ___', english: 'My name is ___.' },
    { native: 'أريد ماءً، من فضلك.', romanization: 'urīdu māʾan, min faḍlik', english: 'I would like water, please.' },
  ],
  zh: [
    { native: '你好！', romanization: 'nǐ hǎo', english: 'Hello!' },
    { native: '我叫___。', romanization: 'wǒ jiào ___', english: 'My name is ___.' },
    { native: '我想要水，谢谢。', romanization: 'wǒ xiǎng yào shuǐ, xièxie', english: 'I would like water, thank you.' },
  ],
  ja: [
    { native: 'こんにちは！', romanization: 'konnichiwa', english: 'Hello!' },
    { native: '私の名前は___です。', romanization: 'watashi no namae wa ___ desu', english: 'My name is ___.' },
    { native: 'お水をください。', romanization: 'omizu o kudasai', english: 'Water, please.' },
  ],
  ko: [
    { native: '안녕하세요!', romanization: 'annyeonghaseyo', english: 'Hello!' },
    { native: '제 이름은 ___예요.', romanization: 'je ireumeun ___yeyo', english: 'My name is ___.' },
    { native: '물 주세요.', romanization: 'mul juseyo', english: 'Water, please.' },
  ],
  kn: [
    { native: 'ನಮಸ್ಕಾರ!', romanization: 'namaskāra', english: 'Hello!' },
    { native: 'ನನ್ನ ಹೆಸರು ___.', romanization: 'nanna hesaru ___', english: 'My name is ___.' },
    { native: 'ನನಗೆ ನೀರು ಬೇಕು.', romanization: 'nanage nīru bēku', english: 'I would like water.' },
  ],
  pa: [
    { native: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!', romanization: 'sat srī akāl', english: 'Hello!' },
    { native: 'ਮੇਰਾ ਨਾਮ ___ ਹੈ।', romanization: 'merā nām ___ hai', english: 'My name is ___.' },
    { native: 'ਮੈਨੂੰ ਪਾਣੀ ਚਾਹੀਦਾ ਹੈ।', romanization: 'mainū̃ pāṇī chāhīdā hai', english: 'I would like water.' },
  ],
  gu: [
    { native: 'નમસ્તે!', romanization: 'namaste', english: 'Hello!' },
    { native: 'મારું નામ ___ છે.', romanization: 'māruṁ nām ___ che', english: 'My name is ___.' },
    { native: 'મને પાણી જોઈએ છે.', romanization: 'mane pāṇī joīe che', english: 'I would like water.' },
  ],
  te: [
    { native: 'నమస్కారం!', romanization: 'namaskāram', english: 'Hello!' },
    { native: 'నా పేరు ___.', romanization: 'nā pēru ___', english: 'My name is ___.' },
    { native: 'నాకు నీళ్లు కావాలి.', romanization: 'nāku nīḷlu kāvāli', english: 'I would like water.' },
  ],
  sa: [
    { native: 'नमस्ते!', romanization: 'namaste', english: 'Hello!' },
    { native: 'मम नाम ___ अस्ति।', romanization: 'mama nāma ___ asti', english: 'My name is ___.' },
    { native: 'मह्यं जलं देहि।', romanization: 'mahyaṁ jalaṁ dehi', english: 'Please give me water.' },
  ],
};
