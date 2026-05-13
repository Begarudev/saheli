// Bundled summaries of key Indian women's rights statutes.
// Used as RAG-style context injected into the Sarvam chat system prompt.
// Mix of English + Hindi so an LLM can ground answers in either.

export type RightsDoc = {
  id: string;
  title: string;
  hi: string;
  summary: string;
};

export const RIGHTS_DOCS: RightsDoc[] = [
  {
    id: 'pwdva',
    title: 'PWDVA 2005 — Protection of Women from Domestic Violence Act',
    hi: 'घरेलू हिंसा से महिलाओं का संरक्षण अधिनियम, 2005',
    summary:
      'कोई भी महिला जो घरेलू रिश्ते में है (पत्नी, माँ, बहन, बेटी, लिव-इन पार्टनर) इस कानून के तहत सुरक्षा माँग सकती है। ' +
      'शारीरिक, मानसिक, यौन, मौखिक, आर्थिक हिंसा सब इसमें आते हैं। ' +
      'Magistrate can issue: protection order, residence order (right to stay in shared household), monetary relief, custody order, compensation. ' +
      'Application via Protection Officer (हर ज़िले में) या सीधे magistrate को। शुल्क नहीं।',
  },
  {
    id: 'ipc498a',
    title: 'IPC 498A / BNS 85-86 — Cruelty by husband or relatives',
    hi: 'भारतीय दंड संहिता धारा 498A — पति या ससुराल वालों द्वारा क्रूरता',
    summary:
      'पति या उसके रिश्तेदारों द्वारा क्रूरता (दहेज की माँग, मारपीट, मानसिक उत्पीड़न जो आत्महत्या तक ले जाए) ' +
      'cognizable, non-bailable अपराध है। 3 साल तक की सज़ा + जुर्माना। ' +
      'FIR नज़दीकी थाने में या Mahila Thana में। Refusal हो तो SP को शिकायत या सीधे magistrate को CrPC 156(3) अर्ज़ी।',
  },
  {
    id: 'posh',
    title: 'POSH Act 2013 — Sexual Harassment of Women at Workplace',
    hi: 'कार्यस्थल पर महिलाओं का यौन उत्पीड़न (रोकथाम) अधिनियम, 2013',
    summary:
      '10+ कर्मचारियों वाले हर workplace में Internal Complaints Committee (ICC) ज़रूरी। ' +
      'घटना के 3 महीने (extendable to 6) के अंदर लिखित शिकायत। ' +
      'Domestic workers, unorganised sector के लिए Local Complaints Committee (LCC) ज़िला स्तर पर। ' +
      'Inquiry 90 दिन में पूरी होनी चाहिए। Retaliation भी अपराध।',
  },
  {
    id: 'succession',
    title: 'Hindu Succession (Amendment) Act 2005 — Daughter\'s equal share',
    hi: 'हिंदू उत्तराधिकार (संशोधन) अधिनियम, 2005 — बेटी का बराबर हक़',
    summary:
      '2005 के बाद बेटी coparcener बन गई — पिता की ancestral property में बेटे जितना ही हक़। ' +
      'Vineeta Sharma v Rakesh Sharma (2020 SC) के बाद यह retrospective है, चाहे पिता 2005 से पहले गुज़र चुके हों। ' +
      'शादी के बाद भी हक़ बना रहता है। Self-acquired property में पिता वसीयत से किसी को भी दे सकते हैं।',
  },
  {
    id: 's125crpc',
    title: 'CrPC Section 125 / BNSS 144 — Maintenance',
    hi: 'दंड प्रक्रिया संहिता धारा 125 — भरण-पोषण',
    summary:
      'पत्नी (तलाकशुदा भी, जब तक दोबारा शादी न हो), नाबालिग बच्चे, बूढ़े माँ-बाप अपने हक़ में monthly maintenance माँग सकते हैं। ' +
      'Magistrate के सामने अर्ज़ी, धर्म से कोई फ़र्क़ नहीं पड़ता। ' +
      'Quick relief; Hindu Marriage Act 24/25 या Muslim Women Act 1986 भी parallel options हैं।',
  },
  {
    id: 'custody',
    title: 'Child Custody — Best interest of the child',
    hi: 'बच्चे की कस्टडी — बच्चे का सर्वोत्तम हित',
    summary:
      'Guardians and Wards Act 1890 + Hindu Minority and Guardianship Act 1956. ' +
      '5 साल से छोटे बच्चे की custody आम तौर पर माँ को मिलती है। ' +
      'Court "best interest of the child" देखती है — रहने की जगह, पढ़ाई, emotional bond, माँ/पिता का व्यवहार। ' +
      'Visitation rights दूसरे parent को मिल सकते हैं। File in Family Court of where the child ordinarily lives.',
  },
  {
    id: 'nalsa',
    title: 'NALSA — Free Legal Aid',
    hi: 'राष्ट्रीय विधिक सेवा प्राधिकरण — मुफ़्त कानूनी सहायता',
    summary:
      'हर महिला (आय की कोई शर्त नहीं), SC/ST, बच्चे, मानव तस्करी पीड़ित — सब मुफ़्त वकील के हक़दार हैं। ' +
      'Apply: ज़िला Legal Services Authority (DLSA) के office में, या nalsa.gov.in पर online, या helpline 15100। ' +
      'One-Stop Centre (OSC / Sakhi Centre) हर ज़िले में — police, medical, legal, counselling, shelter एक छत के नीचे।',
  },
  {
    id: 'fir',
    title: 'FIR — Right to register a complaint',
    hi: 'FIR — शिकायत दर्ज कराने का हक़',
    summary:
      'Cognizable अपराध (मारपीट, दहेज, बलात्कार, 498A) में police को FIR दर्ज करना अनिवार्य है — Lalita Kumari (2014 SC). ' +
      'Police मना करें तो: (1) SP को लिखित शिकायत भेजें, (2) Magistrate को CrPC 156(3) के तहत अर्ज़ी, (3) Online — कई राज्यों में e-FIR portal। ' +
      'Zero FIR: कहीं भी थाने में, बाद में सही थाने को transfer हो जाती है।',
  },
  {
    id: 'helplines',
    title: 'Emergency Helplines',
    hi: 'आपातकालीन हेल्पलाइन',
    summary:
      '181 — महिला हेल्पलाइन (24x7, सब राज्यों में)। ' +
      '112 — सब आपात (police+ambulance+fire)। ' +
      '1091 — Women in distress (police)। ' +
      '1098 — Childline। ' +
      '14416 — Tele-MANAS मानसिक स्वास्थ्य। ' +
      '15100 — NALSA legal aid।',
  },
];

/**
 * Format a subset (or full set) of RIGHTS_DOCS into a CONTEXT block for the
 * Sarvam chat system prompt. After the AI pass this takes the RAG-retrieved
 * subset only — no longer the entire corpus.
 */
export function buildRightsContext(docs: RightsDoc[] = RIGHTS_DOCS): string {
  return docs.map((d) => `### ${d.title} (${d.hi})\n${d.summary}`).join('\n\n');
}

const RIGHTS_PROMPT_HEADER =
  `तुम "सहेली" हो — एक सहानुभूतिपूर्ण महिला अधिकार सहायक। ` +
  `भारतीय कानून के तहत महिलाओं के अधिकारों के बारे में सरल हिंदी में जवाब दो। ` +
  `नीचे दिए गए "CONTEXT" में से तथ्यात्मक जानकारी ही उपयोग करो। ` +
  `अगर सवाल context के बाहर है, तो कहो "मुझे ठीक से नहीं पता, कृपया NALSA helpline 15100 या नज़दीकी One-Stop Centre से संपर्क करें"। ` +
  `जवाब छोटा रखो (3-5 वाक्य), बहन को आश्वस्त करो, फिर एक concrete action step दो। ` +
  `कभी मत कहो कि यह आधिकारिक कानूनी सलाह है। हमेशा relevant helpline number बताओ।`;

/** Build a RAG-aware system prompt scoped to the retrieved subset of docs. */
export function buildRightsSystemPrompt(retrievedDocs: RightsDoc[] = RIGHTS_DOCS): string {
  return `${RIGHTS_PROMPT_HEADER}\n\nCONTEXT:\n${buildRightsContext(retrievedDocs)}`;
}

/** @deprecated Prefer buildRightsSystemPrompt(retrievedDocs) for RAG. */
export const RIGHTS_SYSTEM_PROMPT = buildRightsSystemPrompt();

export const QUICK_QUESTIONS: { hi: string; en: string }[] = [
  { hi: 'क्या मैं तलाक ले सकती हूँ?', en: 'Can I get a divorce?' },
  { hi: 'मेरा पति मारता है, क्या करूँ?', en: 'My husband beats me, what do I do?' },
  { hi: 'बच्चे की कस्टडी किसे मिलती है?', en: 'Who gets child custody?' },
  { hi: 'मुफ्त वकील कैसे मिलेगा?', en: 'How do I get a free lawyer?' },
];
