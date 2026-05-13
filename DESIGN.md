# Design System — Saheli (सहेली)

> **The memorable thing**: After 60 seconds with Saheli, the user remembers — *"This is mine. Designed for me, not a translated American app."*

Devanagari leads. English follows. Sindoor is reserved for distress.

---

## Product Context

- **What it is**: A women's rights, safety, evidence, schemes, and health companion for Indian women.
- **Who it's for**: Women aged 18–45 in tier-2 / tier-3 India. Default users use it openly. Users on monitored phones turn on Privacy Mode and the app wears a cover (Mantras, Duas, or Cycle).
- **Space**: Women's tech, civic tech, health, government schemes — historically dominated by NGO sites that look like translated US templates and Bharat-tech apps that converge on white-bg + cartoon-illustration + Hinglish-marketing-header. We reject both.
- **Project type**: Native Android (Expo React Native). Hindi-first. Phone-only. No web.

## Aesthetic Direction

- **Direction**: **Editorial Bharat** — closer to a contemporary Hindi magazine (Sarita, Outlook Hindi) than to Cred or Razorpay. Strong typographic hierarchy, asymmetric grid, generous typographic space.
- **Decoration level**: Intentional — block-print pattern bands as section dividers. NO cartoon illustrations. NO stock photos.
- **Mood**: Calm, dignified, adult. Indian textile warmth, not corporate cool. Editorial restraint, not playful exuberance. The opposite of clinical.
- **Reference posture**: Indian magazine layout + textile-print color memory + monoline SVG iconography. Avoid: NGO-template, SaaS dashboard, Material 3 default.

## Memorable Moves (the deliberate risks)

### 1. Sindoor is reserved for danger, never decoration
The most charged color in Indian visual culture (sindoor at marriage, kumkum at temple, vermilion at festival) is **only** used for SOS, emergency, distress. Never for buttons, links, accents, badges. **If sindoor appears on screen, something serious is happening.** Forces hierarchy honesty — you cannot bury the SOS.

### 2. Devanagari leads, English follows
Default headline language is Hindi-Devanagari, primary type weight, full size, indigo. English appears as *secondary translation* in muted teal, smaller, below or beside. Inverts the universal "English-first with Hindi label appended" pattern.

This forces every screen to confront whether it stands on Hindi alone. It also signals — to the user, to the abuser, to the judge in a hackathon — that this app's center of gravity is Bharat, not English-medium India.

## Typography

| Role | Font | Notes |
|---|---|---|
| Display / Hero (Devanagari) | **Tiro Devanagari Hindi** | Variable, designed for editorial Devanagari, proper ascenders/descenders |
| Display / Hero (Latin) | **Fraunces** | Editorial energy in Latin, pairs with Tiro |
| Body (both scripts) | **Mukta** | Designed for Indic; consistent texture between Devanagari + Latin in one face |
| Numerals / Tabular | Mukta Mahee tabular variant | Devanagari numerals supported |
| Code / Mono | JetBrains Mono | Only for vault hashes / debug |

**Banned from this project**: Inter, Roboto, Noto Sans Devanagari (default-y), Poppins, Montserrat. These are Indian-app convergence tells.

**Loading**: Google Fonts CDN at runtime (`expo-google-fonts/tiro-devanagari-hindi`, `expo-google-fonts/mukta`, `expo-google-fonts/fraunces`).

**Scale** (Devanagari needs ~15% more vertical room than Latin):

| Token | Size | Line-height | Usage |
|---|---|---|---|
| `display` | 36 | 48 | SOS headline "मदद चाहिए?" |
| `h1` | 28 | 40 | Screen titles |
| `h2` | 22 | 32 | Section headings, tile Devanagari labels |
| `body` | 16 | 24 | Default running text |
| `bodyHi` | 17 | 26 | Devanagari running text (slightly larger) |
| `caption` | 13 | 20 | English secondary translations, metadata |
| `micro` | 11 | 16 | Footnotes, telemetry numerals |

## Color

**Approach**: Restrained. 5 colors. Sindoor reserved for distress.

| Token | Hex | Usage |
|---|---|---|
| `cream` | `#fefae0` | Primary background. Surface of every cream-mode screen. |
| `creamSoft` | `#f5e9d3` | Card surfaces against cream bg, modal sheets |
| `indigo` | `#1c2454` | Primary text. Devanagari headlines. Lock icon. Cover-mode bg. |
| `indigoSoft` | `#2c3a7a` | Borders, secondary surfaces in indigo mode |
| `inkTeal` | `#0e3b3c` | Body text, English secondary, monoline icons |
| `taupe` | `#7a6f47` | Metadata, captions, disabled states |
| **`sindoor`** | **`#c5443c`** | **SOS only. Distress alerts. Failed-state banners. Never decoration.** |
| `sindoorSoft` | `#e09c97` | Sindoor at low opacity for haptic-ack glow |
| `palette/cover/duas` | inherits emerald + warm gold | Per-cover override only |
| `palette/cover/cycle` | inherits violet + cream | Per-cover override only |

**Source**: pulled from Bagh and Ajrakh block prints. Indigo + cream + vermilion is a thousand-year-old Indian textile combination.

**Dark mode**: Inverted Editorial Bharat — `indigo` becomes the bg, `cream` becomes the text, sindoor stays sindoor. Saturation reduced 10% on indigo for OLED.

**Anti-patterns** (banned at the system level):
- Purple, violet, lavender as accent (the "AI Lila" tell)
- Saffron-on-navy (this project's prior aesthetic — anti-convergence rule)
- Gradients on cards or buttons
- Neon glows, drop shadows over 8% opacity
- Pure black `#000000`
- Pure white `#ffffff` (use cream)
- Red used for any non-distress purpose

## Spacing

- **Base unit**: 4
- **Density**: Comfortable. Devanagari needs room.
- **Scale**: `2xs(2) xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48) 4xl(64)`
- **Vertical rhythm**: 8px baseline grid. All Devanagari blocks line up to 8px.
- **Touch targets**: Minimum 48dp.

## Layout

- **Approach**: Creative-editorial within a phone-portrait constraint. Asymmetric in subtle ways — not chaotic.
- **Grid**: Single column with intentional left-bleed indents on Devanagari headlines (Devanagari sits ~8px left of the English caption, magazine pull-quote feel).
- **Max content width**: full phone (no max — it's a phone).
- **Border radius scale**:
  - `sm` 4 — chips, small badges
  - `md` 12 — cards, tiles
  - `lg` 18 — hero cards, modals
  - `pill` 999 — circular buttons (SOS), pill toggles
- **Block-print divider**: 4-8 px tall horizontal stripe of stylized Ajrakh/Bagh motifs (diamonds, dots, lines), used between major page sections. Implement as inline react-native-svg pattern, not image asset. Sits on cream bg in indigo at 30% opacity.

## Iconography

- **Style**: monoline SVG, stroke 1.5, no fill, color `inkTeal` by default.
- **Source**: hand-rolled in `src/components/icons.tsx`. Never import lucide-react-native or @expo/vector-icons (they pull a flat-color set that fights the editorial posture).
- **Existing icons**: VaultIcon, ScaleIcon, ClipboardCheckIcon, HeartPulseIcon, ChevronRight, GearIcon, MicIcon, CrescentIcon. Add new ones in the same file with the same conventions.
- **Sizing**: 18–24 in tile labels, 28–32 in screen headers, 56 for SOS-button glyph if needed.
- **No emoji anywhere in the app.**

## Motion

- **Approach**: Intentional, magazine-feel.
- **Page transitions**: subtle horizontal slide (page-turn metaphor), not iOS sheet-up.
- **Press feedback**: scale `0.96` on press-in, spring back on release. Stiffness 180, damping 18 (Reanimated v4 `withSpring`).
- **SOS breathing**: scale `1.0 ↔ 1.04` over 2s, infinite, ease-in-out. Subtle.
- **Easing**: enter `ease-out` (300ms), exit `ease-in` (200ms), move `ease-in-out` (250ms).
- **No parallax. No scroll-driven choreography. No ambient particles.**

## The Three Covers (per-cover palette inheritance)

The Editorial Bharat system is the **Saheli core**. Each cover overrides the palette while preserving typography, spacing, motion, and iconography conventions.

| Cover | Bg | Accent | Notes |
|---|---|---|---|
| Saheli (default) | `cream #fefae0` | indigo + sindoor | Editorial Bharat full-strength |
| Mantras (Hindu) | retain prior `bg #1a1145` navy | saffron `#f59e0b` | Devotional tradition; cover identity matters more than system uniformity |
| Duas (Muslim) | emerald `#0e2b27` | warm gold `#d4a24c` | Aniconic; geometric only |
| Cycle (secular) | lavender `#f3f0ff` | violet `#7c5cff` | Religion-neutral; calmer accent |

The three covers are **deliberately different from the Saheli core** — that's the whole point of a cover. Inside Saheli, Editorial Bharat governs.

## State Patterns

- **Loading**: skeleton blocks in `creamSoft`, never a spinning circle.
- **Empty**: full-screen Devanagari headline + small English caption + a single primary action. No illustrations.
- **Error / failure**: sindoor banner, full-width, with a Devanagari headline + recovery action.
- **Success**: indigo banner with a brief Devanagari ack. Never green checkmark — green is not in the system.
- **Tactile**: `scale(0.96)` on press-in, spring back. Heavy haptic on SOS dispatch (handled in `src/services/sos.ts`, see haptic patterns).

## Haptic patterns (referenced from system)

- Sending: heavy impact (one bump)
- Success: success-notification + light + light (triple pulse)
- Failure: error-notification + heavy + heavy (anxious double-thump)

## Forbidden patterns

- AI-purple gradients
- 3-column feature grid with icons in colored circles
- Centered-everything with uniform spacing
- "Built for X / Designed for Y" marketing copy
- Stock photo people
- Cartoon illustrations
- Emoji as iconography
- Inter / Poppins / Roboto as body or display
- Saffron-on-navy as a Saheli (non-cover) accent (anti-convergence with prior session)
- Red for any non-distress purpose
- Drop shadows > 8% opacity
- Pure black, pure white

## Anti-slop self-test for any new screen

Before merging, every screen passes:
- [ ] Devanagari headline is the first thing you read
- [ ] English appears smaller, below or beside, in muted color
- [ ] If sindoor is on screen, it's because of distress
- [ ] Border-radius matches the scale (no arbitrary `borderRadius: 7`)
- [ ] Touch targets ≥ 48dp
- [ ] Tested at 1.5x system font scale (low-vision users)
- [ ] Renders correctly with Mukta + Tiro fonts loaded; falls back gracefully to system

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-09 | Adopted Editorial Bharat as Saheli design system | Anti-convergence with the prior saffron+navy devotional aesthetic; rejects both Western-SaaS and Bharat-tech-template convergence. The memorable thing: "designed for me, not a translated American app." |
| 2026-05-09 | Sindoor reserved for distress only | Charged color in Indian visual culture deserves charged usage |
| 2026-05-09 | Devanagari leads, English follows | Inverts Indian-SaaS convention; signals center-of-gravity is Bharat |
| 2026-05-09 | Tiro Devanagari Hindi + Mukta + Fraunces | None of these are convergence picks. Tiro is editorial, Mukta is dual-script-balanced, Fraunces matches Tiro's tone. |
| 2026-05-09 | Block-print divider as the only decoration | Replaces cartoon illustrations with stylized textile motif — Indian visual root, not Western flat-design root |
