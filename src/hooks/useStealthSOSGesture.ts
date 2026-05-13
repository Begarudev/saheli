import { useCallback, useEffect, useRef } from 'react';
import { dispatchSOS } from '../services/sos';

// Stealth SOS gesture detector for cover-app tap surfaces (mala bead, tasbih,
// cycle "log today" button). Returns a function to call on every tap.
//
// Gesture: 5 rapid taps (each gap < 350ms) followed by a trailing pause
// (>= 400ms with no further tap) → silent dispatchSOS({ silent: true }).
//
// The trailing-pause requirement is what disambiguates this from the middle
// burst of the [1, 8, 1] unlock pattern. The 8-tap unlock burst keeps the
// pending timer cancelled because a new tap arrives every ~150ms; SOS only
// fires when the burst genuinely ends at exactly 5.
//
// dispatchSOS itself supplies haptic feedback (sending → success/failure
// patterns from src/services/sos.ts). No-op if no trusted contacts saved.
const RAPID_GAP_MS = 350;
const REQUIRED_TAPS = 5;
const TRAILING_PAUSE_MS = 400;
const COOLDOWN_MS = 5000;
const WINDOW_MS = 5000;

export function useStealthSOSGesture() {
  const tapsRef = useRef<number[]>([]);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  return useCallback(() => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < WINDOW_MS), now];

    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    if (firingRef.current) return;

    if (tapsRef.current.length < REQUIRED_TAPS) return;

    const last5 = tapsRef.current.slice(-REQUIRED_TAPS);
    for (let i = 1; i < last5.length; i++) {
      if (last5[i] - last5[i - 1] >= RAPID_GAP_MS) return;
    }

    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      firingRef.current = true;
      tapsRef.current = [];
      dispatchSOS({ silent: true })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            firingRef.current = false;
          }, COOLDOWN_MS);
        });
    }, TRAILING_PAUSE_MS);
  }, []);
}
