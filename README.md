# Saheli (सहेली)

Hackathon PoC for WitchHunt 2026 (HopeWorks × AI4India). An Expo React
Native Android app for Indian women: rights, safety, evidence vault,
schemes, health.

> Saheli is the primary, openly-usable app. A "cover" disguise is *opt-in*,
> and when chosen, the user picks which cover to wear. Stealth is
> accommodation, not architecture. Not every user is Hindu, and most women
> don't need to hide a women's-rights app. The cover layer is there for the
> users who do.

## Run it

```bash
nvm use            # Node 20
npm install
npx expo start
# scan QR with Expo Go on Android, or press `a` for the emulator
```

Tested with Expo SDK 54. Build a release APK via `docs/DEPLOYMENT.md`.

## Sarvam AI key (optional)

```bash
cp .env.example .env
# edit .env and set EXPO_PUBLIC_SARVAM_API_KEY=<your key>
```

Without a key, every Sarvam call (`stt`, `tts`, `chat`, `ocr`) returns a
clean mock so the app stays usable end to end.

## Demo flow

### Default (open use)
1. Fresh install → onboarding **Welcome** → tap **Continue**.
2. **Privacy choice** → tap **No, use openly**.
3. Saheli home loads: SOS hero, 4 module tiles (Evidence, Rights, Schemes,
   Health), gear icon top-right for Settings. No EXIT button, no
   shake-to-exit.

### Stealth (picking a cover)
1. From Saheli home, tap **gear** → toggle **Privacy Mode** ON.
2. Cover picker appears. Pick one:
   - **Daily Mantras / दैनिक मंत्र**. Hindu devotional cover (lotus, mala,
     panchang). Audience: Hindu households.
   - **Daily Duas / दैनिक दुआ**. Muslim-household cover (today's dua,
     tasbih 33, namaz times). Audience: Muslim households.
   - **Cycle & Wellness / मासिक चक्र**. Religion-neutral period tracker.
     Audience: anyone who wants a secular cover.

   The cover layer is a registry: `src/covers/index.ts` plus an
   `app/covers/<id>/` folder. Adding a new cover (Christian, Sikh, Jain,
   secular variants) is a drop-in.
3. Confirm the gestures cheat-sheet → app re-launches into the chosen
   cover.
4. From the cover, use a covert gesture to come back. To leave the cover,
   the red **EXIT** button appears in Saheli, and shake-to-exit is enabled.

### Demo cue (sub-30 seconds, on stage)
- Open Settings → flip Privacy Mode → pick a cover → you're in the disguise.
- Use the cover's covert gesture (5 rapid taps on lotus / mala / "Log
  today" button) → back in Saheli.
- Flip Privacy Mode OFF → cover disappears, Saheli is the front door again.

## Covert gestures (when a cover is active)

### Daily Mantras cover
- **Tap the lotus 5 times within 3s.** Open Saheli silently.
- **Long-press the deity title (4s).** Backup unlock.
- **5 rapid taps on the mala bead (under 2s).** Silent SOS to trusted
  contacts.
- **1 → pause → 8 → pause → 1 burst on the mala bead.** Unlock to Saheli
  (mnemonic: 181).

### Daily Duas cover
- **5 rapid taps on the tasbih bead (under 2s).** Silent SOS.
- **1 → pause → 8 → pause → 1 burst on the tasbih bead.** Unlock to Saheli.

### Cycle & Wellness cover
- **5 rapid taps on the "Log today" button (under 2s).** Silent SOS.
- **1 → pause → 8 → pause → 1 burst on the "Log today" button.** Unlock
  to Saheli.

> Conflict note: the 5-rapid-tap silent SOS still wins inside the 8-burst.
> Practice with no trusted contacts configured so SOS is a no-op.

## SOS haptic patterns

The visible Safety Net SOS button and the silent stealth paths share three
haptic signatures so a stressed user knows what happened without looking
at the screen:

- **Sending.** One Heavy bump immediately on dispatch.
- **Success.** Success notification, then Light, then Light (80ms gaps).
- **Failure.** Error notification, then Heavy, then Heavy (100ms gaps).

## Quick exit (only available in Privacy Mode)

From any Saheli screen:
- Tap the red **EXIT** button at the top.
- Press the hardware back button (at home).
- **Shake the phone 3 times** in 1.5s.

All three reset navigation back to the active cover. With Privacy Mode
OFF, none of these are wired up. Saheli is the front door; there is
nothing to exit to.

## Wave 1: what's in

- Onboarding: Welcome → Privacy choice → (optional) Cover picker.
- Cover registry: pluggable. Three covers shipping (`mantras`, `duas`,
  `cycle`).
- Mantras cover: 10 bundled mantras (rotates daily), 108-bead japa mala
  counter, panchang stub, About.
- Duas cover: 7 bundled duas (rotates daily), tasbih 33-counter, namaz
  times stub, qibla compass, About.
- Cycle cover: cycle-day progress ring, Log today, 5 mood states (custom
  SVG faces), Calendar, Insights, About.
- Saheli home: 5 module cards + SOS hero + gear icon (Settings).
- Settings: privacy mode toggle, cover swap, trusted-contacts shortcut,
  clear Rights history, About.
- Evidence Vault: record audio, capture photo, add note. Each item gets
  SHA-256 hash, GPS, timestamp.
- Rights, Safety Net, Entitlements, Health (Wave 1 module screens).
- Sarvam adapter (`src/services/sarvam.ts`): STT, TTS, chat, OCR with
  mock fallbacks.
- 5-rapid-tap silent SOS and 1-8-1 burst unlock are wired through a
  cover-agnostic `registerTrackerTap()`, so any cover with one tap
  surface inherits both gestures.

## Wave 2: todo

- Real PIN / duress-PIN gate over the stealth unlock.
- Encrypt vault files at rest with an `expo-secure-store`-derived key.
- Final icon (currently a placeholder pointing at an existing PNG).

## Layout

```
app/                  expo-router routes
├── index.tsx         entry router (reads settings, decides landing)
├── onboarding/       welcome / privacy / pick-cover
├── covers/<id>/      opt-in disguises (mantras, duas, cycle)
└── saheli/           primary product (vault, rights, safety, health, …)

src/
├── covers/           cover registry and themes
├── components/       monoline SVG icons, shared UI
├── data/             bundled content (mantras, duas, rights, schemes)
├── hooks/            useShakeExit, useStealthSOSGesture
├── services/         AI pipeline, Sarvam adapter, vault, SOS, RAG, etc.
├── state/            global app state (AppContext, tap registry)
└── theme.ts          Saheli palette (covers override)
```

See `DESIGN.md` for the *Editorial Bharat* design system and
`docs/DEPLOYMENT.md` for build instructions.

## Constraints

- Expo-managed; no custom native modules.
- TypeScript strict; `npx tsc --noEmit` is clean. No tests yet.
- Hindi (Devanagari) rendered with Tiro Devanagari Hindi + Mukta from
  `@expo-google-fonts`.

## License

MIT. See `LICENSE`.
