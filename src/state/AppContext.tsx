import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { router } from 'expo-router';
import { getCoverById } from '../covers';
import { loadSettings, saveSettings, type Settings } from '../services/settings';

type Mode = 'cover' | 'saheli';

type Ctx = {
  mode: Mode;
  settings: Settings;
  settingsReady: boolean;
  reloadSettings: () => Promise<Settings>;
  updateSettings: (patch: Partial<Settings>) => Promise<Settings>;
  unlockToSaheli: () => void;
  /** Quick exit — only meaningful when privacy mode is ON. No-op otherwise. */
  quickExit: () => void;
  /** 5-tap stealth gesture on lotus (mantras cover only). */
  registerOmTap: () => void;
  /** Cover-agnostic tap surface used by mantras-mala and cycle "Log today".
   *  Burst pattern [1,8,1] unlocks; SOS rapid-tap is owned by the cover. */
  registerTrackerTap: () => void;
  /** Back-compat alias — same as registerTrackerTap. */
  registerMalaTap: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

const BURST_GAP_MS = 500;
const BURST_PAUSE_MS = 800;
const BURST_WINDOW_MS = 10_000;
const TARGET_PATTERN = [1, 8, 1] as const;

// Simpler universal unlock: 7 rapid taps within 3s, all gaps < 350ms.
// This is intentionally distinct from the 5-tap stealth SOS (which requires
// a trailing pause to dispatch). 7 rapid taps in a row keep the SOS dispatch
// timer cancelled the entire time, so SOS won't fire mid-unlock.
const RAPID_UNLOCK_TAPS = 7;
const RAPID_UNLOCK_WINDOW_MS = 3000;
const RAPID_UNLOCK_GAP_MS = 350;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('cover');
  const [settings, setSettings] = useState<Settings>({
    onboarded: false,
    privacyMode: false,
    coverId: null,
  });
  const [settingsReady, setSettingsReady] = useState(false);

  const lotusTapsRef = useRef<number[]>([]);
  const malaTapsRef = useRef<number[]>([]);
  const malaBurstsRef = useRef<{ size: number; startedAt: number }[]>([]);
  const currentBurstRef = useRef<{ size: number; startedAt: number; lastAt: number } | null>(null);

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setSettingsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const reloadSettings = useCallback(async () => {
    const s = await loadSettings();
    setSettings(s);
    return s;
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
    return next;
  }, []);

  const unlockToSaheli = useCallback(() => {
    setMode('saheli');
    router.replace('/saheli');
  }, []);

  const quickExit = useCallback(() => {
    // Only meaningful in privacy mode. Without a cover, exit is a no-op —
    // Saheli is the front door, there's nothing to "exit to".
    if (!settings.privacyMode) return;
    const cover = getCoverById(settings.coverId);
    setMode('cover');
    router.replace((cover?.route ?? '/saheli') as never);
  }, [settings.privacyMode, settings.coverId]);

  const registerOmTap = useCallback(() => {
    const now = Date.now();
    lotusTapsRef.current = [...lotusTapsRef.current.filter((t) => now - t < 3000), now];
    if (lotusTapsRef.current.length >= 5) {
      lotusTapsRef.current = [];
      unlockToSaheli();
    }
  }, [unlockToSaheli]);

  const resetMalaPattern = useCallback(() => {
    malaTapsRef.current = [];
    malaBurstsRef.current = [];
    currentBurstRef.current = null;
  }, []);

  const registerTrackerTap = useCallback(() => {
    const now = Date.now();

    malaTapsRef.current = malaTapsRef.current.filter((t) => now - t < BURST_WINDOW_MS);
    malaBurstsRef.current = malaBurstsRef.current.filter(
      (b) => now - b.startedAt < BURST_WINDOW_MS
    );
    if (
      currentBurstRef.current &&
      now - currentBurstRef.current.startedAt > BURST_WINDOW_MS
    ) {
      currentBurstRef.current = null;
    }

    const cur = currentBurstRef.current;
    if (!cur) {
      currentBurstRef.current = { size: 1, startedAt: now, lastAt: now };
    } else {
      const gap = now - cur.lastAt;
      if (gap >= BURST_PAUSE_MS) {
        malaBurstsRef.current = [
          ...malaBurstsRef.current,
          { size: cur.size, startedAt: cur.startedAt },
        ];
        currentBurstRef.current = { size: 1, startedAt: now, lastAt: now };
      } else if (gap < BURST_GAP_MS) {
        cur.size += 1;
        cur.lastAt = now;
      } else {
        cur.size += 1;
        cur.lastAt = now;
      }
    }
    malaTapsRef.current.push(now);

    const sealed = malaBurstsRef.current.map((b) => b.size);
    const live = currentBurstRef.current ? [currentBurstRef.current.size] : [];
    const tryMatch = (arr: number[]): boolean => {
      if (arr.length < TARGET_PATTERN.length) return false;
      const tail = arr.slice(arr.length - TARGET_PATTERN.length);
      return tail.every((v, i) => v === TARGET_PATTERN[i]);
    };

    if (tryMatch([...sealed, ...live])) {
      // Only unlock if privacy mode is active — if Saheli is open, there's
      // nothing to unlock to.
      resetMalaPattern();
      if (settings.privacyMode) unlockToSaheli();
      return;
    }

    // Simpler universal unlock: 7 rapid taps within 3s, all gaps < 350ms.
    const recent = malaTapsRef.current.filter((t) => now - t < RAPID_UNLOCK_WINDOW_MS);
    if (recent.length >= RAPID_UNLOCK_TAPS) {
      const lastN = recent.slice(-RAPID_UNLOCK_TAPS);
      let allRapid = true;
      for (let i = 1; i < lastN.length; i++) {
        if (lastN[i] - lastN[i - 1] >= RAPID_UNLOCK_GAP_MS) {
          allRapid = false;
          break;
        }
      }
      if (allRapid) {
        resetMalaPattern();
        if (settings.privacyMode) unlockToSaheli();
      }
    }
  }, [unlockToSaheli, resetMalaPattern, settings.privacyMode]);

  const value = useMemo<Ctx>(
    () => ({
      mode,
      settings,
      settingsReady,
      reloadSettings,
      updateSettings,
      unlockToSaheli,
      quickExit,
      registerOmTap,
      registerTrackerTap,
      registerMalaTap: registerTrackerTap,
    }),
    [
      mode,
      settings,
      settingsReady,
      reloadSettings,
      updateSettings,
      unlockToSaheli,
      quickExit,
      registerOmTap,
      registerTrackerTap,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
