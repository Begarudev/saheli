// Short, well-known daily duas. Arabic is rendered RTL at the component layer.
// Translations kept conservative and widely-published.

export type Dua = {
  id: string;
  arabic: string;
  transliteration: string;
  meaningEn: string;
  meaningHi: string;
  occasion: string;
  occasionHi: string;
  source?: string;
};

export const DUAS: Dua[] = [
  {
    id: 'before-eating',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    meaningEn: 'In the name of Allah.',
    meaningHi: 'अल्लाह के नाम से।',
    occasion: 'Before eating',
    occasionHi: 'खाने से पहले',
  },
  {
    id: 'on-waking',
    arabic: 'اَلْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdu lillahil-ladhi ahyana ba‘da ma amatana wa ilayhin-nushur',
    meaningEn: 'Praise be to Allah who gave us life after having taken it from us, and unto Him is the resurrection.',
    meaningHi: 'सब प्रशंसा अल्लाह के लिए है, जिसने हमें मृत्यु जैसी नींद के बाद जीवन दिया, और उसी की ओर लौटना है।',
    occasion: 'On waking',
    occasionHi: 'जागने पर',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'protection',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: 'A‘udhu bi-kalimatil-lahit-tammati min sharri ma khalaq',
    meaningEn: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    meaningHi: 'मैं अल्लाह के पूर्ण वचनों की शरण लेता/लेती हूँ हर उस बुराई से जो उसने रची है।',
    occasion: 'For protection',
    occasionHi: 'सुरक्षा के लिए',
    source: 'Sahih Muslim',
  },
  {
    id: 'for-ease',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    transliteration: 'Rabbi-shrah li sadri wa yassir li amri',
    meaningEn: 'My Lord, expand for me my breast and ease for me my task.',
    meaningHi: 'ऐ मेरे रब, मेरा सीना खोल दे और मेरे काम को आसान कर दे।',
    occasion: 'For ease',
    occasionHi: 'आसानी के लिए',
    source: 'Qur’an 20:25–26',
  },
  {
    id: 'forgiveness',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaningEn: 'I seek forgiveness from Allah.',
    meaningHi: 'मैं अल्लाह से क्षमा चाहता/चाहती हूँ।',
    occasion: 'For forgiveness',
    occasionHi: 'क्षमा के लिए',
  },
  {
    id: 'entering-home',
    arabic: 'اَللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ',
    transliteration: 'Allahumma inni as’aluka khayral-mawliji wa khayral-makhraji',
    meaningEn: 'O Allah, I ask You for the best entrance and the best exit.',
    meaningHi: 'ऐ अल्लाह, मैं तुझसे श्रेष्ठ प्रवेश और श्रेष्ठ निकास माँगता/माँगती हूँ।',
    occasion: 'Entering the home',
    occasionHi: 'घर में प्रवेश पर',
    source: 'Abu Dawud',
  },
  {
    id: 'for-peace',
    arabic: 'اَللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ',
    transliteration: 'Allahumma antas-salam, wa minkas-salam',
    meaningEn: 'O Allah, You are Peace, and from You comes peace.',
    meaningHi: 'ऐ अल्लाह, तू ही शांति है, और तुझी से शांति आती है।',
    occasion: 'For peace',
    occasionHi: 'शांति के लिए',
    source: 'Sahih Muslim',
  },
];

export function duaOfTheDay(): Dua {
  const dayIdx = Math.floor(Date.now() / 86400000) % DUAS.length;
  return DUAS[dayIdx]!;
}

// Static placeholder prayer times — plausibility prop, not a real muezzin.
export const NAMAZ_TIMES_PLACEHOLDER = [
  { name: 'Fajr', nameHi: 'फ़ज्र', time: '4:32 AM' },
  { name: 'Dhuhr', nameHi: 'ज़ुहर', time: '12:08 PM' },
  { name: 'Asr', nameHi: 'अस्र', time: '4:46 PM' },
  { name: 'Maghrib', nameHi: 'मग़रिब', time: '6:54 PM' },
  { name: 'Isha', nameHi: 'इशा', time: '8:18 PM' },
];
