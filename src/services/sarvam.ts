// Sarvam AI adapter. Reads key from EXPO_PUBLIC_SARVAM_API_KEY (build-time injected).
// Falls back to mock responses when key is empty so the app works offline.
//
// AI engineering additions:
//  - embed(): cloud embeddings with deterministic hash-fallback (XOR-based pseudo
//    embedding) so RAG / semantic-cache / scheme-match still degrade gracefully
//    without an API key. The hash embedding is NOT semantically meaningful
//    cross-text but gives us a stable vector for cosine math.
//  - chatStream(): SSE streaming for sarvam chat completions, falls back to
//    non-streaming on first-chunk failure.
//  - track(): lightweight latency/error telemetry persisted to AsyncStorage so
//    Settings → AI Usage can show observability metrics offline.
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log, logErr } from './log';

const BASE = 'https://api.sarvam.ai';
const KEY = (process.env.EXPO_PUBLIC_SARVAM_API_KEY || '').trim();

export const hasSarvamKey = () => KEY.length > 0;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'api-subscription-key': KEY,
    ...extra,
  };
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  // OpenAI-compatible tool-call envelope for function calling.
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

export type ToolDef = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

// ─────────── Telemetry ───────────

const TELEMETRY_KEY = 'saheli.ai.telemetry';
const TELEMETRY_CAP = 200;

export type TelemetryEntry = {
  endpoint: string;
  latencyMs: number;
  ok: boolean;
  errorClass?: string;
  ts: number;
};

/** Wrap any async fn and record latency/ok-ness for AI Usage settings panel. */
export async function track<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const r = await fn();
    void recordTelemetry({ endpoint, latencyMs: Date.now() - t0, ok: true, ts: Date.now() });
    return r;
  } catch (e) {
    void recordTelemetry({
      endpoint,
      latencyMs: Date.now() - t0,
      ok: false,
      errorClass: (e as Error)?.name ?? 'Error',
      ts: Date.now(),
    });
    throw e;
  }
}

async function recordTelemetry(entry: TelemetryEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TELEMETRY_KEY);
    const arr = raw ? (JSON.parse(raw) as TelemetryEntry[]) : [];
    arr.push(entry);
    while (arr.length > TELEMETRY_CAP) arr.shift();
    await AsyncStorage.setItem(TELEMETRY_KEY, JSON.stringify(arr));
  } catch {
    // ignore — telemetry must never break the app
  }
}

/** Read-only accessor for Settings → AI Usage. */
export async function readTelemetry(): Promise<TelemetryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(TELEMETRY_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Wipe all stored telemetry events. */
export async function clearTelemetry(): Promise<void> {
  await AsyncStorage.removeItem(TELEMETRY_KEY);
}

// ─────────── STT / TTS / Chat ───────────

/**
 * sarvam-m is a thinking model — its raw output wraps internal reasoning in
 * `<think>...</think>` tags. Strip them before showing to users or parsing as
 * JSON in the safety classifier. Trim leading/trailing whitespace afterwards.
 */
export function stripThinkTags(s: string): string {
  if (!s) return s;
  return s.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/i, '').trim();
}

/** Transcribe audio file to text via Sarvam Saaras V3. */
export async function stt(audioUri: string, opts?: { language?: string }): Promise<string> {
  if (!hasSarvamKey()) {
    return 'मेरा पति मुझे मारता है'; // mock fallback
  }
  return track('stt', async () => {
    try {
      log('sarvam', 'STT request', { lang: opts?.language ?? 'auto', uri: audioUri.slice(-40) });
      const form = new FormData();
      // Sarvam STT explicitly rejects 'audio/m4a' but accepts 'audio/mp4'.
      // Expo's HIGH_QUALITY preset records m4a (AAC in MP4 container) on
      // Android, which IS audio/mp4 — just labeled differently.
      form.append('file', {
        uri: audioUri,
        name: 'audio.mp4',
        type: 'audio/mp4',
      } as unknown as Blob);
      form.append('model', 'saaras:v3');
      if (opts?.language) form.append('language_code', opts.language);
      const res = await fetch(`${BASE}/speech-to-text`, {
        method: 'POST',
        headers: headers(),
        body: form,
      });
      const txt = await res.text();
      if (!res.ok) {
        logErr('sarvam', `STT http ${res.status}`, txt.slice(0, 200));
        return '';
      }
      const json = JSON.parse(txt) as { transcript?: string };
      log('sarvam', `STT → ${json.transcript?.length ?? 0} chars`, json.transcript ?? '');
      return json.transcript ?? '';
    } catch (e) {
      logErr('sarvam', 'STT error', e);
      return '';
    }
  });
}

/** Synthesize Hindi (default) speech via Bulbul V3. Returns local file path or null. */
export async function tts(
  text: string,
  lang: string = 'hi-IN',
  opts?: { speaker?: string }
): Promise<string | null> {
  if (!hasSarvamKey()) {
    return null;
  }
  return track('tts', async () => {
    try {
      const speaker = opts?.speaker ?? 'priya';
      log('sarvam', `TTS request (${lang}, ${speaker})`, text.slice(0, 80));
      const res = await fetch(`${BASE}/text-to-speech`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          inputs: [text],
          target_language_code: lang,
          speaker,
          model: 'bulbul:v3',
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        logErr('sarvam', `TTS http ${res.status}`, raw.slice(0, 200));
        return null;
      }
      const json = JSON.parse(raw) as { audios?: string[] };
      const b64 = json.audios?.[0];
      if (!b64) {
        logErr('sarvam', 'TTS returned no audio', json);
        return null;
      }
      const path = `${FileSystem.cacheDirectory}tts-${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
      log('sarvam', `TTS → wav (${b64.length} b64 chars)`, path);
      return path;
    } catch (e) {
      logErr('sarvam', 'TTS error', e);
      return null;
    }
  });
}

/** Non-streaming chat completion. Supports tools (OpenAI-compatible). */
export async function chat(
  messages: ChatMessage[],
  opts?: {
    model?: string;
    temperature?: number;
    tools?: ToolDef[];
    tool_choice?: 'auto' | 'none';
  }
): Promise<{
  content: string;
  tool_calls?: ChatMessage['tool_calls'];
}> {
  if (!hasSarvamKey()) {
    return {
      content:
        'नमस्ते बहन। आप अकेली नहीं हैं। मैं आपकी मदद के लिए यहाँ हूँ। क्या आप मुझे थोड़ा और बता सकती हैं?',
    };
  }
  return track('chat', async () => {
    try {
      const body: Record<string, unknown> = {
        model: opts?.model ?? 'sarvam-m',
        messages,
        temperature: opts?.temperature ?? 0.4,
      };
      if (opts?.tools && opts.tools.length) {
        body.tools = opts.tools;
        body.tool_choice = opts.tool_choice ?? 'auto';
      }
      log(
        'sarvam',
        `chat ${messages.length} msgs, ${opts?.tools?.length ?? 0} tools`,
        messages[messages.length - 1]?.content
      );
      const res = await fetch(`${BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      if (!res.ok) {
        logErr('sarvam', `chat http ${res.status}`, raw.slice(0, 200));
        return { content: '' };
      }
      const json = JSON.parse(raw) as {
        choices?: {
          message?: {
            content?: string;
            tool_calls?: ChatMessage['tool_calls'];
          };
        }[];
      };
      const msg = json.choices?.[0]?.message;
      const stripped = stripThinkTags(msg?.content ?? '');
      log(
        'sarvam',
        `chat ← ${stripped.length} chars, ${msg?.tool_calls?.length ?? 0} tool calls`,
        stripped
      );
      return { content: stripped, tool_calls: msg?.tool_calls };
    } catch (e) {
      logErr('sarvam', 'chat error', e);
      return { content: '' };
    }
  });
}

/** Convenience wrapper preserving the pre-AI-pass signature (returns content string). */
export async function chatText(
  messages: ChatMessage[],
  opts?: { model?: string; temperature?: number }
): Promise<string> {
  const r = await chat(messages, opts);
  return r.content;
}

/**
 * Streaming chat — calls onToken(delta) per SSE chunk; resolves with full text.
 * Falls back to non-streaming chat() if streaming fails.
 */
export async function chatStream(
  messages: ChatMessage[],
  onToken: (delta: string) => void,
  opts?: {
    model?: string;
    temperature?: number;
    tools?: ToolDef[];
    tool_choice?: 'auto' | 'none';
  }
): Promise<{ content: string; tool_calls?: ChatMessage['tool_calls'] }> {
  if (!hasSarvamKey()) {
    const fallback = 'नमस्ते बहन। मैं आपकी मदद के लिए यहाँ हूँ।';
    onToken(fallback);
    return { content: fallback };
  }
  const t0 = Date.now();
  try {
    const body: Record<string, unknown> = {
      model: opts?.model ?? 'sarvam-m',
      messages,
      temperature: opts?.temperature ?? 0.4,
      stream: true,
    };
    if (opts?.tools && opts.tools.length) {
      body.tools = opts.tools;
      body.tool_choice = opts.tool_choice ?? 'auto';
    }
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      throw new Error(`stream http ${res.status}`);
    }
    // RN fetch doesn't always expose ReadableStream — try text() and parse SSE blob.
    // Most production-grade RN runtimes return body as a stream-ish object; we
    // best-effort split by "\n\n" frames after reading text.
    const text = await res.text();
    let raw = '';
    let toolCalls: ChatMessage['tool_calls'] | undefined;
    const frames = text.split('\n\n');
    // Buffer raw deltas; sarvam-m emits <think>...</think> reasoning before the
    // user-facing answer, so we collect the full content, strip think tags,
    // then re-emit clean content via onToken in chunks for the streaming feel.
    for (const f of frames) {
      const line = f.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload) as {
          choices?: {
            delta?: {
              content?: string;
              tool_calls?: ChatMessage['tool_calls'];
            };
          }[];
        };
        const delta = j.choices?.[0]?.delta;
        if (delta?.content) raw += delta.content;
        if (delta?.tool_calls) toolCalls = delta.tool_calls;
      } catch {
        // ignore malformed frame
      }
    }
    const full = stripThinkTags(raw);
    if (full) {
      // Re-emit cleaned text in ~12-char chunks to preserve the streaming UX.
      const CHUNK = 12;
      for (let i = 0; i < full.length; i += CHUNK) {
        onToken(full.slice(i, i + CHUNK));
      }
    }
    void recordTelemetry({
      endpoint: 'chatStream',
      latencyMs: Date.now() - t0,
      ok: true,
      ts: Date.now(),
    });
    if (!full && !toolCalls) {
      // Empty stream — fall back to non-streaming.
      const r = await chat(messages, opts);
      if (r.content) onToken(r.content);
      return r;
    }
    return { content: full, tool_calls: toolCalls };
  } catch (e) {
    // Streaming may not be supported by all Sarvam configurations. Silent
    // fallback to non-streaming chat. Telemetry still records the failed
    // attempt for the AI Usage panel.
    void recordTelemetry({
      endpoint: 'chatStream',
      latencyMs: Date.now() - t0,
      ok: false,
      errorClass: (e as Error)?.name ?? 'Error',
      ts: Date.now(),
    });
    const r = await chat(messages, opts);
    if (r.content) onToken(r.content);
    return r;
  }
}

// ─────────── OCR ───────────

/** Extract text from a card / document image via Sarvam OCR. */
export async function ocr(imageUri: string): Promise<string> {
  if (!hasSarvamKey()) {
    return '[mock OCR] पंचायत प्रमाण पत्र — आवेदन संख्या 12345';
  }
  return track('ocr', async () => {
    try {
      const form = new FormData();
      form.append('file', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      const res = await fetch(`${BASE}/ocr`, {
        method: 'POST',
        headers: headers(),
        body: form,
      });
      const json = (await res.json()) as { text?: string };
      return json.text ?? '';
    } catch (e) {
      console.warn('[sarvam.ocr]', e);
      return '';
    }
  });
}

// ─────────── Embeddings ───────────

// One-time notice so devs aren't surprised: hash-fallback is engaged for
// embeddings on every call (Sarvam doesn't expose /embeddings on this key).
let _embedNoticeShown = false;
function noteEmbedFallback() {
  if (_embedNoticeShown) return;
  _embedNoticeShown = true;
  console.log('[sarvam.embed] using hash-embedding fallback (no /embeddings endpoint on this key)');
}

const EMBED_DIM = 384;

/**
 * Get embedding vector for `text`. Tries Sarvam embeddings endpoint
 * (model `sarvam-embedding-v1`); on failure or missing key, returns a
 * deterministic hash-based pseudo-embedding so cosine math still works
 * (cache hits, retrieval fallback). The hash embedding is NOT a real
 * semantic vector — same words → same vector, different words → different
 * vectors, but synonyms have no relation. Good enough as a graceful-degrade.
 */
export async function embed(text: string): Promise<number[]> {
  if (!hasSarvamKey()) {
    noteEmbedFallback();
    return hashEmbed(text);
  }
  try {
    return await track('embed', async () => {
      const res = await fetch(`${BASE}/embeddings`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          model: 'sarvam-embedding-v1',
          input: text,
        }),
      });
      if (!res.ok) throw new Error(`embed http ${res.status}`);
      const json = (await res.json()) as {
        data?: { embedding?: number[] }[];
        embedding?: number[];
      };
      const vec = json.data?.[0]?.embedding ?? json.embedding;
      if (Array.isArray(vec) && vec.length > 0) return vec;
      return hashEmbed(text);
    });
  } catch {
    // Silent fallback — embedding endpoint may not be provisioned on this key.
    // hashEmbed gives stable cosine math for cache + retrieval.
    noteEmbedFallback();
    return hashEmbed(text);
  }
}

/**
 * Deterministic hash-based pseudo-embedding (XOR + char-code mixing).
 * Stable per input text, normalized to unit length. Not semantic — but
 * gives RAG / semcache something to cosine-rank when cloud is unavailable.
 */
export function hashEmbed(text: string): number[] {
  const v = new Array<number>(EMBED_DIM).fill(0);
  const normalized = text.toLowerCase().trim();
  // Word-level hashing — each token contributes to a few buckets.
  const words = normalized.split(/\s+/).filter(Boolean);
  for (const w of words) {
    let h1 = 2166136261;
    let h2 = 5381;
    for (let i = 0; i < w.length; i++) {
      const c = w.charCodeAt(i);
      h1 = (h1 ^ c) >>> 0;
      h1 = Math.imul(h1, 16777619) >>> 0;
      h2 = ((h2 << 5) + h2 + c) >>> 0;
    }
    const a = h1 % EMBED_DIM;
    const b = h2 % EMBED_DIM;
    const c = (h1 ^ h2) % EMBED_DIM;
    v[a] += 1;
    v[b] += 1;
    v[c] += 0.5;
  }
  // Char-bigram contribution to widen the signature.
  for (let i = 0; i < normalized.length - 1; i++) {
    const bg = normalized.charCodeAt(i) * 31 + normalized.charCodeAt(i + 1);
    v[bg % EMBED_DIM] += 0.25;
  }
  // L2 normalize.
  let mag = 0;
  for (const x of v) mag += x * x;
  mag = Math.sqrt(mag) || 1;
  return v.map((x) => x / mag);
}
