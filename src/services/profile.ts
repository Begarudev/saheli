// Persists the user's entitlement profile to AsyncStorage.
// Aadhaar number itself is NEVER persisted — only last 4 digits if user opts to keep.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileInput } from '../data/schemes';

const KEY = 'saheli.profile';

export async function loadProfile(): Promise<ProfileInput> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as ProfileInput;
    // Strip any aadhaar full-number remnants — defence in depth.
    if (p && (p as any).aadhaar) delete (p as any).aadhaar;
    return p;
  } catch {
    return {};
  }
}

export async function saveProfile(p: ProfileInput): Promise<void> {
  // Only persist whitelisted fields. NEVER aadhaar.
  const safe: ProfileInput = {
    age: p.age,
    income: p.income,
    state: p.state,
    category: p.category,
    pregnantOrLactating: p.pregnantOrLactating,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(safe));
}

// Best-effort regex parsing of OCR text from Aadhaar / Ration card.
export type OcrParsed = {
  aadhaarLast4?: string;
  dob?: string; // dd/mm/yyyy
  age?: number;
  gender?: 'F' | 'M';
  name?: string;
};

export function parseOcrText(text: string): OcrParsed {
  const out: OcrParsed = {};
  if (!text) return out;

  // 12-digit Aadhaar: usually printed as "1234 5678 9012" or "123456789012"
  const aadhaarMatch = text.match(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/);
  if (aadhaarMatch) {
    out.aadhaarLast4 = aadhaarMatch[3];
  }

  // DOB: dd/mm/yyyy or dd-mm-yyyy
  const dobMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/);
  if (dobMatch) {
    const dd = dobMatch[1].padStart(2, '0');
    const mm = dobMatch[2].padStart(2, '0');
    const yyyy = dobMatch[0].slice(-4);
    out.dob = `${dd}/${mm}/${yyyy}`;
    const yr = parseInt(yyyy, 10);
    const now = new Date().getFullYear();
    if (!Number.isNaN(yr) && yr > 1900 && yr <= now) {
      out.age = now - yr;
    }
  } else {
    // YOB only fallback
    const yob = text.match(/(?:Year of Birth|जन्म\s*वर्ष|YoB)[^\d]*(19|20)\d{2}/i);
    if (yob) {
      const yr = parseInt(yob[0].slice(-4), 10);
      out.age = new Date().getFullYear() - yr;
    }
  }

  // Gender
  if (/\b(female|महिला|स्त्री)\b/i.test(text)) out.gender = 'F';
  else if (/\b(male|पुरुष)\b/i.test(text)) out.gender = 'M';

  // Name — best effort: line of CAPS letters with 2+ words
  const nameMatch = text.match(/\b([A-Z][A-Z]+(?:\s+[A-Z][A-Z]+){1,3})\b/);
  if (nameMatch) out.name = nameMatch[1];

  return out;
}
