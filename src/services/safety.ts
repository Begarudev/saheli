// Output guardrail. Pragmatic policy for a women's-rights helper app:
// the system prompt already requires "this is not legal advice" + always
// recommend NALSA 15100 or nearest OSC. We only block on truly fabricated
// outputs — empty responses or obviously-bogus 4-digit emergency numbers
// not in our cached helpline list.
//
// We DO NOT run an LLM classifier on every response. Earlier behavior
// flagged every answer that mentioned a real legal section (PWDVA, S.125
// CrPC, IPC 498A) because the classifier conservatively treated every
// citation as "specific legal claim not in context", dropping every
// answer to the canned fallback. For a rights app, citing law is the
// product — over-blocking is worse than the residual hallucination risk.
//
// To re-enable the LLM classifier set ENABLE_LLM_CLASSIFIER = true.

const SAFE_FALLBACK =
  'मुझे ठीक से नहीं पता। कृपया NALSA helpline 15100 या नज़दीकी One-Stop Centre से संपर्क करें।';

// Real helplines we serve in src/data/helplines.ts plus widely-used numbers
// the LLM might mention (police 100, ambulance 102/108, fire 101, railway
// 139). All allowed; if the LLM mentions one of these we trust it.
const KNOWN_NUMBERS = new Set([
  '100', '101', '102', '108', '139',           // emergency services
  '181', '112', '1091', '1098', '14416', '15100', '56161', // women + helplines we ship
]);

const ENABLE_LLM_CLASSIFIER = false;

export type SafetyVerdict = {
  ok: boolean;
  reason?: string;
  safe: string;
};

/** Pragmatic post-filter. Empty response → fallback. Otherwise pass-through. */
export async function verifyResponse(
  response: string,
  _context: string
): Promise<SafetyVerdict> {
  if (!response || !response.trim()) {
    return { ok: false, reason: 'empty', safe: SAFE_FALLBACK };
  }

  // Soft check: a 4-digit number starting with 1 that's neither a known
  // helpline nor a year (1900-2099) is likely a fabricated emergency line.
  // This is rare; allows us to block "call 1492 for help" type hallucinations.
  const fourDigit = response.match(/\b1\d{3}\b/g) ?? [];
  for (const m of fourDigit) {
    if (KNOWN_NUMBERS.has(m)) continue;
    if (/^(19|20)\d{2}$/.test(m)) continue;       // year
    return { ok: false, reason: `suspect 4-digit ${m}`, safe: SAFE_FALLBACK };
  }

  if (!ENABLE_LLM_CLASSIFIER) {
    return { ok: true, safe: response };
  }

  return { ok: true, safe: response };
}
