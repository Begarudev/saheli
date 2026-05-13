export type Mantra = {
  id: string;
  devanagari: string;
  transliteration: string;
  meaning: string;
  meaningHi: string;
  deity: string;
};

export const MANTRAS: Mantra[] = [
  {
    id: 'gayatri',
    devanagari: 'ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥',
    transliteration: 'Om Bhur Bhuvah Svah, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Nah Prachodayat',
    meaning: 'We meditate on the divine light of the sun; may it illumine our intellect.',
    meaningHi: 'हम सूर्य के दिव्य तेज का ध्यान करते हैं; वह हमारी बुद्धि को प्रकाशित करे।',
    deity: 'Gayatri',
  },
  {
    id: 'mahamrityunjaya',
    devanagari: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥',
    transliteration: 'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam, Urvarukamiva Bandhanan Mrityor Mukshiya Mamritat',
    meaning: 'We worship the three-eyed Lord Shiva; may he liberate us from death and grant immortality.',
    meaningHi: 'हम त्रिनेत्र शिव की पूजा करते हैं; वे हमें मृत्यु से मुक्त कर अमरत्व प्रदान करें।',
    deity: 'Shiva',
  },
  {
    id: 'ganesh',
    devanagari: 'ॐ गं गणपतये नमः॥',
    transliteration: 'Om Gam Ganapataye Namah',
    meaning: 'Salutations to Lord Ganesha, remover of obstacles.',
    meaningHi: 'विघ्नहर्ता गणेश को नमन।',
    deity: 'Ganesha',
  },
  {
    id: 'saraswati',
    devanagari: 'ॐ ऐं सरस्वत्यै नमः॥',
    transliteration: 'Om Aim Saraswatyai Namah',
    meaning: 'Salutations to Goddess Saraswati, giver of wisdom.',
    meaningHi: 'विद्यादात्री सरस्वती को नमन।',
    deity: 'Saraswati',
  },
  {
    id: 'lakshmi',
    devanagari: 'ॐ श्रीं महालक्ष्म्यै नमः॥',
    transliteration: 'Om Shreem Mahalakshmyai Namah',
    meaning: 'Salutations to Goddess Lakshmi, giver of prosperity.',
    meaningHi: 'समृद्धिदात्री लक्ष्मी को नमन।',
    deity: 'Lakshmi',
  },
  {
    id: 'durga',
    devanagari: 'ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे॥',
    transliteration: 'Om Aim Hreem Kleem Chamundayai Vichche',
    meaning: 'Invocation of Devi Durga for protection and strength.',
    meaningHi: 'रक्षा और शक्ति के लिए दुर्गा का आह्वान।',
    deity: 'Durga',
  },
  {
    id: 'ram',
    devanagari: 'श्री राम जय राम जय जय राम॥',
    transliteration: 'Shri Ram Jai Ram Jai Jai Ram',
    meaning: 'Glory to Lord Rama, embodiment of dharma.',
    meaningHi: 'धर्म-स्वरूप श्रीराम की जय।',
    deity: 'Rama',
  },
  {
    id: 'krishna',
    devanagari: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥',
    transliteration: 'Hare Krishna Hare Krishna, Krishna Krishna Hare Hare, Hare Rama Hare Rama, Rama Rama Hare Hare',
    meaning: 'The Mahamantra invoking Krishna and Rama for divine love.',
    meaningHi: 'महामंत्र — कृष्ण और राम के दिव्य प्रेम का आह्वान।',
    deity: 'Krishna',
  },
  {
    id: 'hanuman',
    devanagari: 'ॐ हं हनुमते नमः॥',
    transliteration: 'Om Hanumate Namah',
    meaning: 'Salutations to Hanuman, giver of courage.',
    meaningHi: 'साहसदाता हनुमान को नमन।',
    deity: 'Hanuman',
  },
  {
    id: 'shanti',
    devanagari: 'ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत्॥',
    transliteration: 'Om Sarve Bhavantu Sukhinah, Sarve Santu Niramayah, Sarve Bhadrani Pashyantu, Ma Kashchid Duhkhabhag Bhavet',
    meaning: 'May all be happy, may all be free from illness, may all see auspiciousness; may none suffer.',
    meaningHi: 'सब सुखी हों, सब निरोग हों, सब का कल्याण हो, कोई दुखी न हो।',
    deity: 'Universal',
  },
];

export function mantraOfTheDay(): Mantra {
  const dayIdx = Math.floor(Date.now() / 86400000) % MANTRAS.length;
  return MANTRAS[dayIdx]!;
}

export const PANCHANG_PLACEHOLDER = {
  tithi: 'शुक्ल पक्ष पंचमी',
  vaar: 'गुरुवार',
  nakshatra: 'रोहिणी',
  festival: 'वसंत पंचमी',
};
