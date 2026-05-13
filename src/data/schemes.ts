// Curated list of 20 Govt of India schemes for women.
// Eligibility is intentionally permissive — match shows scheme; final eligibility on portal.

export type Eligibility = {
  minAge?: number;
  maxAge?: number;
  gender?: 'F' | 'M' | 'any';
  maxIncome?: number; // monthly INR
  states?: string[]; // empty/undefined = all-India
  categories?: Array<'General' | 'OBC' | 'SC' | 'ST'>;
  pregnantOrLactating?: boolean;
};

export type Scheme = {
  id: string;
  name: string;
  nameHi: string;
  ministry: string;
  summary: string;
  summaryHi: string;
  eligibility: Eligibility;
  benefit: string;
  applyUrl: string;
};

export const SCHEMES: Scheme[] = [
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana',
    nameHi: 'प्रधानमंत्री मातृ वंदना योजना',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Cash incentive for pregnant & lactating mothers for first live birth.',
    summaryHi: 'पहले जीवित जन्म पर गर्भवती व स्तनपान कराने वाली माताओं को नकद सहायता।',
    eligibility: { minAge: 19, gender: 'F', pregnantOrLactating: true },
    benefit: '₹5,000 in 3 instalments',
    applyUrl: 'https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana',
  },
  {
    id: 'ayushman',
    name: 'Ayushman Bharat (PM-JAY)',
    nameHi: 'आयुष्मान भारत',
    ministry: 'Ministry of Health & Family Welfare',
    summary: 'Health cover up to ₹5L per family per year for secondary & tertiary care.',
    summaryHi: 'प्रति परिवार सालाना ₹5 लाख तक का स्वास्थ्य बीमा।',
    eligibility: { gender: 'any', maxIncome: 16000 },
    benefit: '₹5,00,000/year health cover',
    applyUrl: 'https://pmjay.gov.in/',
  },
  {
    id: 'mudra',
    name: 'Pradhan Mantri Mudra Yojana',
    nameHi: 'प्रधानमंत्री मुद्रा योजना',
    ministry: 'Ministry of Finance',
    summary: 'Collateral-free loans for micro & small businesses.',
    summaryHi: 'सूक्ष्म व लघु उद्यमों के लिए बिना गारंटी ऋण।',
    eligibility: { minAge: 18, gender: 'any' },
    benefit: 'Loan up to ₹10 lakh',
    applyUrl: 'https://www.mudra.org.in/',
  },
  {
    id: 'sukanya',
    name: 'Sukanya Samriddhi Yojana',
    nameHi: 'सुकन्या समृद्धि योजना',
    ministry: 'Ministry of Finance',
    summary: 'Savings scheme for girl child (under 10) with high interest & tax benefit.',
    summaryHi: '10 वर्ष से कम उम्र की बेटी के लिए बचत योजना।',
    eligibility: { maxAge: 10, gender: 'F' },
    benefit: '~8% interest, 80C deduction',
    applyUrl: 'https://www.nsiindia.gov.in/(S(s2cdfpyenwn3hl45ck5tnp45))/InternalPage.aspx?Id_Pk=89',
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana',
    nameHi: 'जननी सुरक्षा योजना',
    ministry: 'Ministry of Health & Family Welfare',
    summary: 'Cash assistance for institutional delivery, focus on BPL women.',
    summaryHi: 'संस्थागत प्रसव के लिए नकद सहायता।',
    eligibility: { minAge: 19, gender: 'F', pregnantOrLactating: true },
    benefit: '₹1,400 (rural) / ₹1,000 (urban)',
    applyUrl: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
  },
  {
    id: 'ujjwala',
    name: 'Pradhan Mantri Ujjwala Yojana',
    nameHi: 'प्रधानमंत्री उज्ज्वला योजना',
    ministry: 'Ministry of Petroleum & Natural Gas',
    summary: 'Free LPG connection to women from BPL households.',
    summaryHi: 'गरीब महिलाओं को मुफ्त एलपीजी कनेक्शन।',
    eligibility: { minAge: 18, gender: 'F', maxIncome: 16000 },
    benefit: 'Free LPG connection + first refill',
    applyUrl: 'https://www.pmuy.gov.in/',
  },
  {
    id: 'bbbp',
    name: 'Beti Bachao Beti Padhao',
    nameHi: 'बेटी बचाओ बेटी पढ़ाओ',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Awareness & welfare for girl child education and survival.',
    summaryHi: 'बेटियों की शिक्षा व सुरक्षा हेतु अभियान।',
    eligibility: { gender: 'F' },
    benefit: 'Scholarships & awareness',
    applyUrl: 'https://wcd.nic.in/bbbp-schemes',
  },
  {
    id: 'kishori',
    name: 'Kishori Shakti Yojana',
    nameHi: 'किशोरी शक्ति योजना',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Empowerment & nutrition for adolescent girls 11–18.',
    summaryHi: '11-18 आयु की किशोरियों के लिए पोषण व प्रशिक्षण।',
    eligibility: { minAge: 11, maxAge: 18, gender: 'F' },
    benefit: 'Nutrition + skill training',
    applyUrl: 'https://wcd.nic.in/schemes/kishori-shakti-yojana-ksy',
  },
  {
    id: 'mahila-ehaat',
    name: 'Mahila E-Haat',
    nameHi: 'महिला ई-हाट',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Online platform for women entrepreneurs to sell products.',
    summaryHi: 'महिला उद्यमियों के लिए ऑनलाइन बिक्री मंच।',
    eligibility: { minAge: 18, gender: 'F' },
    benefit: 'Free online marketplace listing',
    applyUrl: 'https://mahilaehaat-rmk.gov.in/',
  },
  {
    id: 'standup',
    name: 'Stand-Up India',
    nameHi: 'स्टैंड-अप इंडिया',
    ministry: 'Ministry of Finance',
    summary: 'Bank loans for SC/ST/Women entrepreneurs to start a greenfield enterprise.',
    summaryHi: 'महिला/SC/ST उद्यमियों के लिए नया उद्यम शुरू करने हेतु ऋण।',
    eligibility: { minAge: 18, gender: 'F' },
    benefit: 'Loan ₹10L – ₹1Cr',
    applyUrl: 'https://www.standupmitra.in/',
  },
  {
    id: 'mgnrega',
    name: 'MGNREGA',
    nameHi: 'मनरेगा',
    ministry: 'Ministry of Rural Development',
    summary: '100 days guaranteed wage employment in rural India; 33% reserved for women.',
    summaryHi: '100 दिन का गारंटीकृत रोजगार; 33% महिलाओं के लिए आरक्षित।',
    eligibility: { minAge: 18, gender: 'any' },
    benefit: '100 days wages/year',
    applyUrl: 'https://nrega.nic.in/',
  },
  {
    id: 'pmkisan',
    name: 'PM-KISAN',
    nameHi: 'पीएम किसान सम्मान निधि',
    ministry: 'Ministry of Agriculture',
    summary: '₹6,000/year direct income support to small & marginal farmer families.',
    summaryHi: 'किसान परिवारों को सालाना ₹6,000 की सीधी आय सहायता।',
    eligibility: { minAge: 18, gender: 'any' },
    benefit: '₹6,000/year in 3 instalments',
    applyUrl: 'https://pmkisan.gov.in/',
  },
  {
    id: 'pmjdy',
    name: 'Pradhan Mantri Jan Dhan Yojana',
    nameHi: 'प्रधानमंत्री जन धन योजना',
    ministry: 'Ministry of Finance',
    summary: 'Zero-balance bank account with RuPay debit card & ₹2L accident cover.',
    summaryHi: 'शून्य-बैलेंस बैंक खाता व ₹2 लाख दुर्घटना बीमा।',
    eligibility: { minAge: 10, gender: 'any' },
    benefit: 'Free bank account + insurance',
    applyUrl: 'https://pmjdy.gov.in/',
  },
  {
    id: 'pmsby',
    name: 'Pradhan Mantri Suraksha Bima Yojana',
    nameHi: 'प्रधानमंत्री सुरक्षा बीमा योजना',
    ministry: 'Ministry of Finance',
    summary: 'Accidental death/disability insurance at ₹20/year.',
    summaryHi: '₹20 प्रति वर्ष में दुर्घटना बीमा।',
    eligibility: { minAge: 18, maxAge: 70, gender: 'any' },
    benefit: '₹2L cover for ₹20/year',
    applyUrl: 'https://www.jansuraksha.gov.in/Forms-PMSBY.aspx',
  },
  {
    id: 'pmjjby',
    name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
    nameHi: 'प्रधानमंत्री जीवन ज्योति बीमा योजना',
    ministry: 'Ministry of Finance',
    summary: 'Term life insurance at ₹436/year.',
    summaryHi: '₹436 प्रति वर्ष में जीवन बीमा।',
    eligibility: { minAge: 18, maxAge: 50, gender: 'any' },
    benefit: '₹2L life cover',
    applyUrl: 'https://www.jansuraksha.gov.in/Forms-PMJJBY.aspx',
  },
  {
    id: 'apy',
    name: 'Atal Pension Yojana',
    nameHi: 'अटल पेंशन योजना',
    ministry: 'Ministry of Finance',
    summary: 'Pension scheme for unorganised sector workers, age 18–40.',
    summaryHi: 'असंगठित क्षेत्र के लिए पेंशन योजना।',
    eligibility: { minAge: 18, maxAge: 40, gender: 'any' },
    benefit: '₹1,000 – ₹5,000/month pension after 60',
    applyUrl: 'https://www.npscra.nsdl.co.in/scheme-details.php',
  },
  {
    id: 'nrlm',
    name: 'DAY-NRLM (Aajeevika)',
    nameHi: 'राष्ट्रीय ग्रामीण आजीविका मिशन',
    ministry: 'Ministry of Rural Development',
    summary: 'Self-Help Groups, credit access & livelihood support for rural women.',
    summaryHi: 'ग्रामीण महिलाओं के लिए स्वयं सहायता समूह व ऋण।',
    eligibility: { minAge: 18, gender: 'F' },
    benefit: 'SHG credit + training',
    applyUrl: 'https://aajeevika.gov.in/',
  },
  {
    id: 'icds',
    name: 'Integrated Child Development Services',
    nameHi: 'समेकित बाल विकास सेवा (आंगनवाड़ी)',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Nutrition, health & pre-school for children under 6 and mothers.',
    summaryHi: '6 वर्ष तक के बच्चों व माताओं को पोषण व स्वास्थ्य।',
    eligibility: { gender: 'any', pregnantOrLactating: true },
    benefit: 'Free nutrition + healthcare',
    applyUrl: 'https://icds-wcd.nic.in/',
  },
  {
    id: 'igmsy',
    name: 'Indira Gandhi Matritva Sahyog Yojana',
    nameHi: 'इंदिरा गांधी मातृत्व सहयोग योजना',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Conditional maternity benefit for pregnant & lactating women 19+.',
    summaryHi: '19+ गर्भवती/स्तनपान कराने वाली महिलाओं को मातृत्व लाभ।',
    eligibility: { minAge: 19, gender: 'F', pregnantOrLactating: true },
    benefit: '₹6,000 maternity benefit',
    applyUrl: 'https://wcd.nic.in/schemes/indira-gandhi-matritva-sahyog-yojana-igmsy',
  },
  {
    id: 'wwh',
    name: 'Working Women Hostel',
    nameHi: 'कामकाजी महिला छात्रावास',
    ministry: 'Ministry of Women & Child Development',
    summary: 'Safe & affordable accommodation for working women in cities.',
    summaryHi: 'शहरों में कामकाजी महिलाओं के लिए सुरक्षित आवास।',
    eligibility: { minAge: 18, gender: 'F' },
    benefit: 'Subsidised hostel',
    applyUrl: 'https://wcd.nic.in/schemes/working-women-hostel',
  },
];

export const STATES_UTS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export type ProfileInput = {
  age?: number;
  income?: number; // monthly INR
  state?: string;
  category?: 'General' | 'OBC' | 'SC' | 'ST';
  pregnantOrLactating?: boolean;
  // detected only — never persisted:
  aadhaarLast4?: string;
};

export function matchSchemes(p: ProfileInput): Scheme[] {
  const age = p.age;
  const income = p.income;
  return SCHEMES.filter((s) => {
    const e = s.eligibility;
    if (e.gender === 'F') {
      // women-only schemes: still show — Saheli is a women's app
    }
    if (typeof e.minAge === 'number' && typeof age === 'number' && age < e.minAge) return false;
    if (typeof e.maxAge === 'number' && typeof age === 'number' && age > e.maxAge) return false;
    if (typeof e.maxIncome === 'number' && typeof income === 'number' && income > e.maxIncome) return false;
    if (e.pregnantOrLactating && p.pregnantOrLactating === false) return false;
    if (e.states && e.states.length && p.state && !e.states.includes(p.state)) return false;
    if (e.categories && e.categories.length && p.category && !e.categories.includes(p.category)) return false;
    return true;
  });
}
