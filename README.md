# Saheli

Hackathon PoC (WitchHunt 2026, HopeWorks × AI4India). An Expo React Native (TS) Android app
for Indian women — rights, safety, evidence vault, schemes, health.

**Saheli is the primary, openly-usable app.** A "cover" disguise is **opt-in**, and when chosen,
the user **picks which cover** to wear. Stealth is accommodation, not architecture: not every
user is Hindu, and most women don't need to hide a women's-rights app. The cover layer is
there for the users who do.

## Run it

```bash
npm install
npx expo start
# scan QR with Expo Go on Android, or press `a` to launch the Android emulator
```

Tested with Expo SDK 54.

## Sarvam AI key (optional)

```bash
cp .env.example .env
# edit .env and set EXPO_PUBLIC_SARVAM_API_KEY=<your key>
```

Without a key, every Sarvam call (`stt`, `tts`, `chat`, `ocr`) returns a clean mock so the
app is fully usable end-to-end.

## Demo flow

### Default — open use
1. Fresh install → onboarding **Welcome** → tap **Continue**.
2. **Privacy choice** → tap **No, use openly**.
3. Saheli home loads. SOS hero, 4 module tiles (Evidence, Rights, Schemes, Health),
   gear icon top-right for Settings. No EXIT button, no shake-to-exit.

### Stealth — picking a cover
1. From Saheli home, tap **gear** → toggle **Privacy Mode** ON.
2. Cover picker appears. Pick one:
   - **Daily Mantras / दैनिक मंत्र** — Hindu devotional cover (lotus, mala, panchang). _Audience: Hindu households._
   - **Daily Duas / दैनिक दुआ** — Muslim-household cover (today's dua, tasbih 33, namaz times). _Audience: Muslim households._
   - **Cycle & Wellness / मासिक चक्र** — religion-neutral period tracker. _Audience: anyone who wants a secular cover._

   The cover layer is a registry — `src/covers/index.ts` + an `app/covers/<id>/` folder.
   Adding a new cover (Christian, Sikh, Jain, secular variants…) is a drop-in.
3. Confirm the gestures cheat-sheet → app re-launches into the chosen cover.
4. From the cover, use a covert gesture to come back. To leave the cover, the red
   **EXIT** button appears in Saheli, and shake-to-exit is enabled.

### Demo cue (sub-30 seconds, on stage)
- Open Settings → flip Privacy Mode → pick a cover → you're in the disguise.
- Use the cover's covert gesture (5 rapid taps on lotus / mala / "Log today" button)
  → back in Saheli.
- Flip Privacy Mode OFF → cover disappears, Saheli is the front door again.

## Covert gestures (when a cover is active)

### Daily Mantras cover
- **Tap the lotus 5 times within 3s** — open Saheli silently.
- **Long-press the deity title (4s)** — backup unlock.
- **5 rapid taps on the mala bead (under 2s)** — silent SOS to trusted contacts.
- **1 → pause → 8 → pause → 1 burst** on the mala bead — unlock to Saheli (mnemonic: 181).

### Daily Duas cover
- **5 rapid taps on the tasbih bead (under 2s)** — silent SOS.
- **1 → pause → 8 → pause → 1 burst** on the tasbih bead — unlock to Saheli.

### Cycle & Wellness cover
- **5 rapid taps on the "Log today" button (under 2s)** — silent SOS.
- **1 → pause → 8 → pause → 1 burst** on the "Log today" button — unlock to Saheli.

> Conflict note: the 5-rapid-tap silent SOS still wins inside the 8-burst.
> Practice with no trusted contacts configured so SOS is a no-op.

## SOS haptic patterns

The visible Safety Net SOS button and the silent stealth paths share three haptic
signatures so a stressed user knows what happened without looking at the screen:

- **Sending** — one Heavy bump immediately on dispatch.
- **Success** — Success notification → Light → Light (80ms gaps).
- **Failure** — Error notification → Heavy → Heavy (100ms gaps).

## Quick exit (only available in Privacy Mode)

From any Saheli screen:
- Tap the red **EXIT** button at the top
- Press the hardware back button (at home)
- **Shake the phone 3 times** in 1.5s

All three reset navigation back to the active cover. With Privacy Mode OFF, none of
these are wired up — Saheli is the front door, there's nothing to exit to.

## Wave 1 — what's in

- Onboarding: Welcome → Privacy choice → (optional) Cover picker.
- Cover registry: pluggable. Three covers shipping (`mantras`, `duas`, `cycle`), more later.
- Mantras cover: 10 bundled mantras (rotates daily), 108-bead japa mala counter, panchang stub, About.
- Duas cover: 7 bundled duas (rotates daily), tasbih 33-counter, namaz-times stub, qibla compass, About.
- Cycle cover: cycle-day progress ring, Log today, 5 mood states (custom SVG faces),
  Calendar, Insights, About.
- Saheli home: 5 module cards + SOS hero + gear icon (Settings).
- Settings: privacy mode toggle, cover swap, trusted-contacts shortcut, clear Rights
  history, About.
- Evidence Vault (functional): record audio, capture photo, add note. Each item gets
  SHA-256 hash, GPS, timestamp.
- Rights, Safety Net, Entitlements, Health (Wave 1 module screens).
- Sarvam adapter (`src/services/sarvam.ts`): STT, TTS, chat, OCR with mock fallbacks.
- 5-rapid-tap silent SOS + 1-8-1 burst unlock — both wired through a cover-agnostic
  `registerTrackerTap()` so any cover with one tap surface inherits both gestures.

## Wave 2 — todo

- Real PIN/duress-PIN gate over the stealth unlock.
- Encrypt vault files at rest with expo-secure-store-derived key.
- Polished icon (currently a placeholder pointing at an existing PNG).

## Layout

- `app/` — expo-router routes
  - `index.tsx` — entry router (reads settings, decides where to land).
  - `onboarding/` — first-launch flow (welcome / privacy / pick-cover).
  - `covers/<id>/` — opt-in disguise themes.
    - `mantras/` — Daily Mantras cover (Hindu devotional).
    - `duas/` — Daily Duas cover (Muslim devotional).
    - `cycle/` — Cycle & Wellness cover (secular).
  - `saheli/` — primary product (vault, rights, safety, entitlements, health, settings).
- `src/covers/index.ts` — cover registry (`COVERS`, `getCoverById`).
- `src/services/settings.ts` — persisted settings (onboarded / privacyMode / coverId).
- `src/services/sos.ts` — SOS dispatcher (used by Safety screen + stealth paths).
- `src/state/AppContext.tsx` — global mode + tap detectors (`registerTrackerTap`).
- `src/hooks/useShakeExit.ts` — DeviceMotion 3-shake detector (privacy-mode gated).
- `src/theme.ts` — Saheli colors. Each cover ships its own palette.

## Constraints

- Expo-managed; no custom native modules.
- TS strict; `npx tsc --noEmit` is clean. No tests yet.
- Hindi (Devanagari) text rendered with default Android system fonts.
