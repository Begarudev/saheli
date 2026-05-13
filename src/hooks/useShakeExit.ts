import { useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';

// Detect 3 sharp shakes within 1.5s and call onShake.
export function useShakeExit(onShake: () => void, enabled: boolean = true): void {
  const lastShakeRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let sub: { remove: () => void } | null = null;
    let active = true;
    (async () => {
      try {
        const ok = await DeviceMotion.isAvailableAsync();
        if (!ok || !active) return;
        DeviceMotion.setUpdateInterval(150);
        sub = DeviceMotion.addListener((e) => {
          const a = e.accelerationIncludingGravity;
          if (!a) return;
          const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
          if (mag > 25) {
            const now = Date.now();
            lastShakeRef.current = [
              ...lastShakeRef.current.filter((t) => now - t < 1500),
              now,
            ];
            if (lastShakeRef.current.length >= 3) {
              lastShakeRef.current = [];
              onShake();
            }
          }
        });
      } catch {
        // sensor unavailable — silently no-op
      }
    })();
    return () => {
      active = false;
      sub?.remove();
    };
  }, [onShake, enabled]);
}
