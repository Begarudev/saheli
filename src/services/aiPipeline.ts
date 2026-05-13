// AI orchestrator for the Rights chat. Single entry point that wires together:
//   PII redaction → semantic cache lookup → RAG retrieval → tool-aware chat
//   (streaming where possible) → safety guardrail → cache writeback.
//
// All cloud calls are routed through `track()` for telemetry.
import { redactPII } from './pii';
import { getCachedResponse, cacheResponse, prewarmCache } from './semcache';
import { retrieveRights } from './rag';
import { buildRightsSystemPrompt, type RightsDoc } from '../data/rights';
import { chat, chatStream, type ChatMessage } from './sarvam';
import { runTool } from './tools';
import { verifyResponse } from './safety';
import { log } from './log';

// Intent detection — runs deterministically because sarvam-m doesn't expose
// tool-call protocol. Pattern matches the user's question and returns which
// tools to invoke with what args.
type DetectedIntent = { name: string; args: Record<string, unknown> };

const INDIAN_DISTRICTS = [
  'Lucknow', 'Delhi', 'Mumbai', 'Bombay', 'Bangalore', 'Bengaluru',
  'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Surat',
  'Jaipur', 'Patna', 'Nagpur', 'Indore', 'Bhopal', 'Kanpur', 'Nashik',
  'Varanasi', 'Agra', 'Allahabad', 'Prayagraj', 'Meerut', 'Ranchi',
  'Faridabad', 'Ghaziabad', 'Gurgaon', 'Gurugram', 'Noida',
];

function detectIntents(q: string): DetectedIntent[] {
  const out: DetectedIntent[] = [];
  const lower = q.toLowerCase();

  // OSC / Sakhi / nearby help
  if (
    /osc|sakhi|one[- ]?stop|वन[- ]?स्टॉप|सखी|नज़दीक|पास[\s ]*में|where|कहाँ/i.test(q)
  ) {
    let district: string | undefined;
    for (const d of INDIAN_DISTRICTS) {
      if (lower.includes(d.toLowerCase())) {
        district = d;
        break;
      }
    }
    out.push({ name: 'find_nearest_osc', args: district ? { district } : {} });
  }

  // Zero-FIR / FIR drafting
  if (/fir|शिकायत[\s ]*दर्ज|complaint|case file|draft/i.test(q)) {
    out.push({ name: 'draft_zero_fir', args: { complaint: q } });
  }

  // Maintenance / गुज़ारा / S.125
  if (/maintenance|गुज़ारा|गुजारा|भरण[- ]?पोषण|125\s*crpc/i.test(q)) {
    out.push({ name: 'compute_maintenance_eligibility', args: {} });
  }

  // Schemes — "योजना", "scheme", or descriptive personal-situation phrases
  if (
    /योजना|scheme|कौन[\s ]*सी[\s ]*मदद|qualif|पात्र|eligible/i.test(q) ||
    /पति[\s ]*की[\s ]*मृत्यु|widow|विधवा|गर्भवती|pregnant|बच्च/i.test(q)
  ) {
    out.push({ name: 'match_schemes', args: { situation_description: q } });
  }

  return out;
}

export type AskRightsResult = {
  text: string;
  toolResults?: Array<{ name: string; result: unknown }>;
  retrievedDocs: RightsDoc[];
  fromCache: boolean;
  guardrailFlagged: boolean;
};

let prewarmed = false;

/**
 * Single-call orchestration for the Rights chat. Pass an optional `onToken`
 * to stream the assistant's reply (delta-by-delta).
 */
export async function askRights(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  onToken?: (delta: string) => void
): Promise<AskRightsResult> {
  // 0. Lazy-prewarm semcache exactly once per app session.
  if (!prewarmed) {
    prewarmed = true;
    void prewarmCache();
  }

  const original = userMessage.trim();
  log('pipeline', '── askRights start ──', { q: original });

  const { redacted, foundCount } = redactPII(original);
  if (foundCount > 0) log('pii', `redacted ${foundCount} PII match(es)`, redacted);

  // 1. Cache lookup.
  const cached = await getCachedResponse(redacted);
  if (cached) {
    log('cache', 'HIT — returning cached response', cached.response);
    if (onToken) onToken(cached.response);
    return {
      text: cached.response,
      retrievedDocs: [],
      fromCache: true,
      guardrailFlagged: false,
    };
  }
  log('cache', 'miss');

  // 2. RAG retrieve.
  const retrievedDocs = await retrieveRights(redacted, 3);
  log(
    'rag',
    `retrieved ${retrievedDocs.length} docs`,
    retrievedDocs.map((d) => d.id).join(', ')
  );
  const systemPrompt = buildRightsSystemPrompt(retrievedDocs);

  // 3. Compose messages with strict user/assistant alternation. sarvam-m
  // requires the conversation to start with `user` and alternate from there
  // (system messages are treated separately at the front). Drop any orphan
  // user turn at the end of history (previous chat where the assistant
  // never replied) and keep only valid pairs.
  const cleanedHistory: ChatMessage[] = [];
  let expecting: 'user' | 'assistant' = 'user';
  for (const m of history) {
    if (!m.text || !m.text.trim()) continue;
    if (m.role !== expecting) continue;            // skip out-of-order turn
    cleanedHistory.push({ role: m.role, content: m.text });
    expecting = m.role === 'user' ? 'assistant' : 'user';
  }
  // Final history must end on assistant (so next message is user).
  if (cleanedHistory.length && cleanedHistory[cleanedHistory.length - 1].role === 'user') {
    cleanedHistory.pop();
  }
  // Take last 6 turns (3 round-trips).
  const recent = cleanedHistory.slice(-6);
  const olderCount = Math.max(0, cleanedHistory.length - 6);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];
  if (olderCount > 0) {
    messages.push({
      role: 'system',
      content: `(पहले की बातचीत — सारांश: ${olderCount} संदेश छोड़े गए।)`,
    });
  }
  messages.push(...recent);
  messages.push({ role: 'user', content: redacted });

  // 4. Model call. sarvam-m does NOT support tool calling, so we never send
  // the tools field through the OpenAI-compat tool_calls protocol. Instead
  // we run a deterministic intent router AFTER the chat so demos like
  // "Lucknow में OSC" still surface tool-result cards.
  log('pipeline', `chat() with ${messages.length} msgs (no tools — model unsupported)`);
  let firstReply: { content: string; tool_calls?: ChatMessage['tool_calls'] };
  if (onToken) {
    firstReply = await chatStream(messages, onToken);
  } else {
    firstReply = await chat(messages);
  }
  log(
    'pipeline',
    `first reply: ${firstReply.content.length} chars`,
    firstReply.content
  );

  // 5. Deterministic intent router. sarvam-m can't call tools, so we
  // pattern-match the user's question and call the relevant tool ourselves.
  // The tool result is rendered as a card alongside the chat answer.
  const toolResults: Array<{ name: string; result: unknown }> = [];
  let finalText = firstReply.content;
  const detected = detectIntents(redacted);
  for (const { name, args } of detected) {
    log('tools', `→ ${name} (intent-detected)`, args);
    const result = await runTool(name, args);
    log('tools', `← ${name} result`, result);
    let parsedResult: unknown = result;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }
    toolResults.push({ name, result: parsedResult });
  }

  let isFallback = false;
  if (!finalText || !finalText.trim()) {
    finalText =
      'माफ़ कीजिए, अभी जवाब नहीं मिल पाया। कृपया NALSA helpline 15100 से संपर्क करें।';
    isFallback = true;
    log('pipeline', 'WARN: model returned empty — using error fallback');
  }

  // 6. Safety guardrail.
  const verdict = await verifyResponse(
    finalText,
    retrievedDocs.map((d) => d.summary).join('\n')
  );
  const guardrailFlagged = !verdict.ok;
  if (guardrailFlagged) {
    log('safety', `BLOCKED → fallback (${verdict.reason ?? 'no reason'})`);
  } else {
    log('safety', 'pass');
  }
  const safeText = verdict.safe;

  // 7. Cache writeback (only if guardrail passed AND we got a real reply,
  // never the empty/fallback message — caching that means every subsequent
  // identical question returns the same fallback forever).
  if (!guardrailFlagged && safeText && !isFallback) {
    void cacheResponse(redacted, safeText, null);
    log('cache', 'wrote');
  } else if (isFallback) {
    log('cache', 'skipped writeback (fallback response)');
  }

  log('pipeline', `── askRights done (${safeText.length} chars) ──`);
  return {
    text: safeText,
    toolResults: toolResults.length ? toolResults : undefined,
    retrievedDocs,
    fromCache: false,
    guardrailFlagged,
  };
}
