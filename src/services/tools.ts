// Function-calling tools exposed to the chat model. OpenAI-compatible schema —
// Sarvam's chat completions follow the same `tools` / `tool_calls` shape.
import { OSCS, type OSC } from '../data/osc';
import { SCHEMES, type Scheme } from '../data/schemes';
import { embed, type ToolDef } from './sarvam';
import { cosine } from './rag';

// ─────────── Tool definitions (schema for the model) ───────────

export const TOOL_DEFS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'find_nearest_osc',
      description:
        'Find the nearest One-Stop Centre (OSC / Sakhi Centre) — government women-support hubs that combine police, medical, legal, and counselling under one roof. Use when the user asks "where can I go", "OSC near me", "nearest help".',
      parameters: {
        type: 'object',
        properties: {
          district: {
            type: 'string',
            description: 'District name (English). Substring matched.',
          },
          state: {
            type: 'string',
            description: 'State name (English).',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_zero_fir',
      description:
        'Draft a Zero-FIR template in Hindi the user can copy or share. Use when the user mentions filing a complaint or "FIR".',
      parameters: {
        type: 'object',
        properties: {
          complaint: { type: 'string', description: 'Short description of the incident' },
          accused_name: { type: 'string' },
          location: { type: 'string' },
          witnesses: { type: 'array', items: { type: 'string' } },
        },
        required: ['complaint'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compute_maintenance_eligibility',
      description:
        'Estimate eligibility for maintenance under CrPC Section 125 / BNSS 144 and produce an application skeleton. Use when the user asks about maintenance, गुज़ारा भत्ता, separation, or alimony.',
      parameters: {
        type: 'object',
        properties: {
          profile: {
            type: 'object',
            properties: {
              age: { type: 'number' },
              monthly_income: { type: 'number' },
              marital_status: { type: 'string' },
              has_children: { type: 'boolean' },
              num_children: { type: 'number' },
              husband_income: { type: 'number' },
            },
          },
        },
        required: ['profile'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'match_schemes',
      description:
        'Semantic-match a user\'s situation description to top-5 government schemes from the curated list. Use when the user asks "what schemes do I qualify for", "मुझे कौन सी योजना मिलेगी", or describes their life situation.',
      parameters: {
        type: 'object',
        properties: {
          situation_description: { type: 'string' },
        },
        required: ['situation_description'],
      },
    },
  },
];

// ─────────── Tool implementations ───────────

type FindOscResult = { name: string; district: string; phone: string };

/** Top-3 OSCs whose district / state match (substring, case-insensitive). */
function findNearestOsc(args: { district?: string; state?: string }): FindOscResult[] {
  const dLower = (args.district ?? '').toLowerCase().trim();
  const sLower = (args.state ?? '').toLowerCase().trim();
  let pool: OSC[] = OSCS;
  if (dLower) pool = pool.filter((o) => o.district.toLowerCase().includes(dLower));
  if (sLower && pool.length === 0) {
    pool = OSCS.filter((o) => o.state.toLowerCase().includes(sLower));
  } else if (sLower) {
    pool = pool.filter((o) => o.state.toLowerCase().includes(sLower));
  }
  if (pool.length === 0) pool = OSCS; // fall back to all if no match
  return pool.slice(0, 3).map((o) => ({ name: o.name, district: o.district, phone: o.phone }));
}

/** Hindi Zero-FIR template (fill-in, no LLM). */
function draftZeroFir(args: {
  complaint: string;
  accused_name?: string;
  location?: string;
  witnesses?: string[];
}): string {
  const today = new Date().toLocaleDateString('hi-IN');
  const witnesses = (args.witnesses ?? []).filter(Boolean);
  return [
    'सेवा में,',
    'थाना प्रभारी,',
    '[नज़दीकी थाने का नाम]',
    '',
    `दिनांक: ${today}`,
    '',
    'विषय: Zero-FIR दर्ज करने हेतु प्रार्थना पत्र',
    '',
    'महोदय,',
    '',
    `मैं [आपका नाम], निवासी [पता] यह शिकायत दर्ज कराना चाहती हूँ। घटना का संक्षिप्त विवरण इस प्रकार है:`,
    '',
    args.complaint,
    '',
    args.accused_name ? `आरोपी का नाम: ${args.accused_name}` : 'आरोपी की जानकारी: [जो ज्ञात हो]',
    args.location ? `घटना स्थान: ${args.location}` : 'घटना स्थान: [स्थान]',
    witnesses.length
      ? `गवाह: ${witnesses.join(', ')}`
      : 'गवाह: [यदि कोई हो]',
    '',
    'चूँकि यह संज्ञेय अपराध है, कृपया मेरी शिकायत Zero-FIR के रूप में दर्ज करें और संबंधित अधिकार-क्षेत्र वाले थाने को अग्रसारित करें (Lalita Kumari v State of UP, 2014 SC के अनुसार)।',
    '',
    'भवदीय,',
    '[हस्ताक्षर]',
    '[नाम]',
    '[मोबाइल नंबर]',
    '',
    '— सहायता हेतु: NALSA 15100 · महिला हेल्पलाइन 181 · 112',
  ].join('\n');
}

/** Rule-based S.125 CrPC maintenance eligibility verdict + skeleton. */
function computeMaintenanceEligibility(args: {
  profile: {
    age?: number;
    monthly_income?: number;
    marital_status?: string;
    has_children?: boolean;
    num_children?: number;
    husband_income?: number;
  };
}): {
  eligible: boolean;
  reasons: string[];
  skeleton: string;
} {
  const p = args.profile ?? {};
  const reasons: string[] = [];
  let eligible = false;

  // Spouse / ex-spouse maintenance
  if (
    p.marital_status === 'married' ||
    p.marital_status === 'separated' ||
    p.marital_status === 'divorced' ||
    p.marital_status === 'widow' ||
    !p.marital_status
  ) {
    eligible = true;
    reasons.push('पत्नी / तलाकशुदा (दोबारा विवाह न होने तक) S.125 CrPC के तहत भरण-पोषण की हक़दार हैं।');
  }
  if (p.has_children || (p.num_children ?? 0) > 0) {
    eligible = true;
    reasons.push('नाबालिग बच्चे भी पिता से भरण-पोषण के हक़दार हैं।');
  }
  if ((p.monthly_income ?? 0) > 0 && (p.monthly_income ?? 0) >= (p.husband_income ?? 0)) {
    reasons.push(
      'ध्यान दें: यदि आपकी आय पति की आय के बराबर/अधिक है, तो magistrate amount तय करते समय इसे देखेंगे।'
    );
  }

  const skeleton = [
    '— S.125 CrPC अर्ज़ी का खाका —',
    '',
    'न्यायालय: श्रीमान न्यायाधीश महोदय, [संबंधित Family Court / Magistrate]',
    '',
    'अर्ज़ीदार: [नाम], आयु [' + (p.age ?? '__') + '], निवासी [पता]',
    'विरुद्ध: [पति का नाम]',
    '',
    'धारा 125 CrPC / BNSS 144 के तहत भरण-पोषण हेतु अर्ज़ी।',
    '',
    'मुख्य तथ्य:',
    '1. विवाह की तिथि व स्थान',
    '2. वर्तमान स्थिति (साथ रह रहे हैं/अलग/तलाक)',
    p.has_children ? `3. बच्चों की संख्या: ${p.num_children ?? 1}` : '3. बच्चे: नहीं',
    `4. अर्ज़ीदार की मासिक आय: ₹${p.monthly_income ?? '____'}`,
    `5. प्रतिवादी की मासिक आय: ₹${p.husband_income ?? '____'}`,
    '',
    'प्रार्थना: मासिक भरण-पोषण के रूप में उचित राशि दिलाई जाए।',
    '',
    '— मुफ़्त वकील के लिए: NALSA 15100 या DLSA कार्यालय',
  ].join('\n');

  return { eligible, reasons, skeleton };
}

type SchemeMatch = {
  id: string;
  name: string;
  nameHi: string;
  benefit: string;
  applyUrl: string;
  score: number;
};

let schemeIdx: Record<string, number[]> | null = null;
async function ensureSchemeIndex(): Promise<Record<string, number[]>> {
  if (schemeIdx) return schemeIdx;
  // Try prebuilt JSON.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pre = require('../data/schemes.embeddings.json') as Record<string, number[]>;
    if (pre && Object.keys(pre).length === SCHEMES.length) {
      schemeIdx = pre;
      return pre;
    }
  } catch {
    // ignore
  }
  const idx: Record<string, number[]> = {};
  for (const s of SCHEMES) {
    idx[s.id] = await embed(`${s.name} ${s.nameHi} ${s.summary} ${s.summaryHi} ${s.benefit}`);
  }
  schemeIdx = idx;
  return idx;
}

/** Semantic top-5 scheme match against `situation_description`. */
async function matchSchemesTool(args: { situation_description: string }): Promise<SchemeMatch[]> {
  const idx = await ensureSchemeIndex();
  const qv = await embed(args.situation_description);
  return SCHEMES.map((s: Scheme) => ({ s, score: cosine(qv, idx[s.id] ?? []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ s, score }) => ({
      id: s.id,
      name: s.name,
      nameHi: s.nameHi,
      benefit: s.benefit,
      applyUrl: s.applyUrl,
      score,
    }));
}

// ─────────── Runner ───────────

/**
 * Execute a tool by name with model-supplied args. Returns a string suitable
 * to round-trip back to the LLM as the "tool" message content.
 */
export async function runTool(name: string, args: unknown): Promise<string> {
  const a = (args ?? {}) as Record<string, unknown>;
  try {
    switch (name) {
      case 'find_nearest_osc':
        return JSON.stringify(
          findNearestOsc({
            district: typeof a.district === 'string' ? a.district : undefined,
            state: typeof a.state === 'string' ? a.state : undefined,
          })
        );
      case 'draft_zero_fir':
        return draftZeroFir({
          complaint: String(a.complaint ?? ''),
          accused_name: typeof a.accused_name === 'string' ? a.accused_name : undefined,
          location: typeof a.location === 'string' ? a.location : undefined,
          witnesses: Array.isArray(a.witnesses) ? (a.witnesses as string[]) : undefined,
        });
      case 'compute_maintenance_eligibility':
        return JSON.stringify(
          computeMaintenanceEligibility({
            profile: (a.profile ?? {}) as never,
          })
        );
      case 'match_schemes':
        return JSON.stringify(
          await matchSchemesTool({
            situation_description: String(a.situation_description ?? ''),
          })
        );
      default:
        return JSON.stringify({ error: `unknown tool ${name}` });
    }
  } catch (e) {
    return JSON.stringify({ error: (e as Error)?.message ?? 'tool error' });
  }
}

// Re-export typed helpers for UI rendering of tool result cards.
export type { FindOscResult, SchemeMatch };
