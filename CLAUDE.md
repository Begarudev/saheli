# Saheli — Agent Instructions

## Design System
**Always read `DESIGN.md` before making any visual or UI decisions.** All font choices, colors, spacing, and aesthetic direction are defined there. Do not deviate without explicit user approval. In QA / design-review mode, flag any code that doesn't match DESIGN.md.

The system is **Editorial Bharat**:
- Cream `#fefae0` bg, indigo `#1c2454` text, ink-teal `#0e3b3c` body, taupe `#7a6f47` muted
- **Sindoor `#c5443c` is reserved for distress only — never decoration**
- Typography: Tiro Devanagari Hindi (display) + Mukta (body, both scripts) + Fraunces (Latin display)
- **Devanagari leads, English follows as smaller secondary translation**
- Monoline SVG icons only (`src/components/icons.tsx`), no emoji, no flat-color icon libs
- Block-print divider as the only ornament

## Cover overrides
The three covers (Mantras, Duas, Cycle) intentionally diverge from the Saheli core palette. Their themes live in their respective folders. Don't unify them.

## Architectural notes
- Expo Router app. Saheli is the open default. Privacy Mode + cover is opt-in.
- Stealth gestures (5-tap, 1-8-1 burst) only fire when privacy mode is on.
- AI services orchestrated by `src/services/aiPipeline.ts`: PII redaction → semantic cache → RAG retrieval → tool-aware Sarvam chat → safety guardrail → cache writeback.
- Sarvam adapter is `src/services/sarvam.ts`. Mock fallbacks ship with empty key.
