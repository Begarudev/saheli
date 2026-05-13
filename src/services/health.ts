// Health Journal storage. AsyncStorage-only (no FS).
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SymptomEntry = {
  id: string;
  ts: number;
  transcript: string;
  painScale: number; // 1..10
};

export type EpdsResult = { ts: number; score: number; max: number };
export type PcosResult = { ts: number; score: number; total: number };
export type CervicalResult = { ts: number; score: number; total: number };

const K_SYM = 'saheli.health.symptoms';
const K_EPDS = 'saheli.health.epds';
const K_PCOS = 'saheli.health.pcos';
const K_CERV = 'saheli.health.cervical';
const K_MED = 'saheli.health.meds';

const MAX_SYM = 100;

export async function loadSymptoms(): Promise<SymptomEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(K_SYM);
    if (!raw) return [];
    return (JSON.parse(raw) as SymptomEntry[]).sort((a, b) => b.ts - a.ts);
  } catch {
    return [];
  }
}

export async function addSymptom(entry: SymptomEntry): Promise<void> {
  const all = await loadSymptoms();
  all.unshift(entry);
  await AsyncStorage.setItem(K_SYM, JSON.stringify(all.slice(0, MAX_SYM)));
}

export async function deleteSymptom(id: string): Promise<void> {
  const all = await loadSymptoms();
  await AsyncStorage.setItem(K_SYM, JSON.stringify(all.filter((s) => s.id !== id)));
}

export async function loadEpds(): Promise<EpdsResult | null> {
  const raw = await AsyncStorage.getItem(K_EPDS);
  return raw ? (JSON.parse(raw) as EpdsResult) : null;
}
export async function saveEpds(r: EpdsResult): Promise<void> {
  await AsyncStorage.setItem(K_EPDS, JSON.stringify(r));
}

export async function loadPcos(): Promise<PcosResult | null> {
  const raw = await AsyncStorage.getItem(K_PCOS);
  return raw ? (JSON.parse(raw) as PcosResult) : null;
}
export async function savePcos(r: PcosResult): Promise<void> {
  await AsyncStorage.setItem(K_PCOS, JSON.stringify(r));
}

export async function loadCervical(): Promise<CervicalResult | null> {
  const raw = await AsyncStorage.getItem(K_CERV);
  return raw ? (JSON.parse(raw) as CervicalResult) : null;
}
export async function saveCervical(r: CervicalResult): Promise<void> {
  await AsyncStorage.setItem(K_CERV, JSON.stringify(r));
}

// ─────────── Drafts (partial-save for screening modals) ───────────

export type DraftKind = 'epds' | 'pcos' | 'cervical';
export type ScreeningDraft = {
  answers: Record<number, number>;
  startedAt: number;
};

const draftKey = (kind: DraftKind) => `saheli.health.draft.${kind}`;

export async function getDraft(kind: DraftKind): Promise<ScreeningDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(kind));
    if (!raw) return null;
    const d = JSON.parse(raw) as ScreeningDraft;
    if (!d || typeof d.startedAt !== 'number' || !d.answers) return null;
    return d;
  } catch {
    return null;
  }
}

export async function saveDraft(kind: DraftKind, draft: ScreeningDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(draftKey(kind), JSON.stringify(draft));
  } catch {}
}

export async function clearDraft(kind: DraftKind): Promise<void> {
  try {
    await AsyncStorage.removeItem(draftKey(kind));
  } catch {}
}

export async function loadMeds(): Promise<string> {
  return (await AsyncStorage.getItem(K_MED)) ?? '';
}
export async function saveMeds(s: string): Promise<void> {
  await AsyncStorage.setItem(K_MED, s);
}

// ─────────── Doctor-card AI summary cache ───────────

const K_DOC_SUMMARY = 'saheli.health.doctor.summary';

export type DoctorSummary = { hash: string; text: string; ts: number };

/** Stable hash of inputs so we only re-call the LLM when something changed. */
export function doctorInputHash(input: string): string {
  // FNV-1a 32-bit — good enough for a cache key.
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export async function loadDoctorSummary(): Promise<DoctorSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(K_DOC_SUMMARY);
    return raw ? (JSON.parse(raw) as DoctorSummary) : null;
  } catch {
    return null;
  }
}

export async function saveDoctorSummary(s: DoctorSummary): Promise<void> {
  await AsyncStorage.setItem(K_DOC_SUMMARY, JSON.stringify(s));
}

export async function clearDoctorSummary(): Promise<void> {
  await AsyncStorage.removeItem(K_DOC_SUMMARY);
}
