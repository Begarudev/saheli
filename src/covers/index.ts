// Cover registry — opt-in disguise themes a user can pick.
// Saheli is the primary app; covers are accommodation, not architecture.

export type CoverIconKey = 'lotus' | 'crescent' | 'cycle' | 'recipe';

export type CoverDef = {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  audience: string;
  route: string; // expo-router route
  iconKey: CoverIconKey;
  /** Hindi+English cheat sheet of covert gestures available in this cover. */
  gesturesHi: string[];
  gestures: string[];
};

export const COVERS: CoverDef[] = [
  {
    id: 'mantras',
    name: 'Daily Mantras',
    nameHi: 'दैनिक मंत्र',
    description: 'Hindu devotional cover — mantras, japa mala, panchang.',
    descriptionHi: 'हिन्दू भक्ति आवरण — मंत्र, जप माला, पंचांग।',
    audience: 'Hindu households',
    route: '/covers/mantras',
    iconKey: 'lotus',
    gesturesHi: [
      'कमल को 5 बार जल्दी दबाएं — Saheli खुलेगी।',
      'देवता-नाम को 4 सेकंड दबाए रखें — Saheli खुलेगी।',
      'माला बीज पर 5 तेज़ tap (2s में) — चुपचाप SOS।',
      'माला बीज पर 1 tap — रुकें — 8 तेज़ tap — रुकें — 1 tap = unlock।',
    ],
    gestures: [
      'Tap the lotus 5 times within 3s to open Saheli.',
      'Long-press the deity title for 4s to open Saheli.',
      'Tap the mala bead 5 times rapidly (under 2s) to silently fire SOS.',
      'Tap the bead in 1 → pause → 8 → pause → 1 burst pattern to unlock.',
    ],
  },
  {
    id: 'duas',
    name: 'Daily Duas',
    nameHi: 'दैनिक दुआ',
    description: "Today's dua + tasbih counter + namaz times",
    descriptionHi: 'आज की दुआ + तसबीह + नमाज़ का समय',
    audience: 'Muslim households',
    route: '/covers/duas',
    iconKey: 'crescent',
    gesturesHi: [
      'तसबीह बीज पर 5 तेज़ tap (2s में) — चुपचाप SOS।',
      'तसबीह बीज पर 1 tap — रुकें — 8 तेज़ tap — रुकें — 1 tap = unlock।',
    ],
    gestures: [
      'Tap the tasbih bead 5 times rapidly (under 2s) to silently fire SOS.',
      'Tap the bead in 1 → pause → 8 → pause → 1 burst pattern to unlock.',
    ],
  },
  {
    id: 'cycle',
    name: 'Cycle & Wellness',
    nameHi: 'मासिक चक्र',
    description: 'Religion-neutral period and wellness tracker cover.',
    descriptionHi: 'धर्म-निरपेक्ष मासिक चक्र एवं सेहत ट्रैकर आवरण।',
    audience: 'Anyone who wants a secular cover',
    route: '/covers/cycle',
    iconKey: 'cycle',
    gesturesHi: [
      '"Log today" बटन को 5 बार जल्दी दबाएं — चुपचाप SOS।',
      'बटन पर 1 tap — रुकें — 8 तेज़ tap — रुकें — 1 tap = unlock।',
    ],
    gestures: [
      'Tap "Log today" 5 times rapidly (under 2s) to silently fire SOS.',
      'Tap in 1 → pause → 8 → pause → 1 burst pattern to unlock to Saheli.',
    ],
  },
];

export function getCoverById(id: string | null | undefined): CoverDef | null {
  if (!id) return null;
  return COVERS.find((c) => c.id === id) ?? null;
}
