// Saheli persistent settings — onboarding, privacy mode, cover choice.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'saheli.settings';

export type Settings = {
  onboarded: boolean;
  privacyMode: boolean;
  coverId: string | null;
};

const DEFAULTS: Settings = {
  onboarded: false,
  privacyMode: false,
  coverId: null,
};

let cached: Settings | null = null;

export async function loadSettings(): Promise<Settings> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      cached = { ...DEFAULTS };
      return cached;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    cached = { ...DEFAULTS, ...parsed };
    return cached;
  } catch {
    cached = { ...DEFAULTS };
    return cached;
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await loadSettings();
  const next: Settings = { ...cur, ...patch };
  cached = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore — best effort
  }
  return next;
}

/** Synchronous read of last-loaded settings. Returns null if never loaded. */
export function peekSettings(): Settings | null {
  return cached;
}

export async function resetSettings(): Promise<Settings> {
  cached = { ...DEFAULTS };
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return cached;
}
