// Semantic response cache. Cosine-matches incoming query embeddings against
// previously cached entries; returns a cached response when similarity ≥ threshold.
// Pre-warms with embeddings of common questions so the very first miss is
// still seeded for the next query.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { embed } from './sarvam';
import { cosine } from './rag';

const KEY = 'saheli.semcache';
const PREWARM_FLAG = 'saheli.semcache.prewarmed';
const CAP = 100;

// Substrings that mark a response as a fallback we should NOT serve from cache.
// If any of these appear, we treat the entry as poisoned and remove it.
const POISON_MARKERS = [
  'जवाब नहीं मिल पाया',
  'मुझे ठीक से नहीं पता',
];

function isPoison(response: string): boolean {
  return POISON_MARKERS.some((m) => response.includes(m));
}

export type CacheEntry = {
  queryEmbedding: number[];
  response: string;
  ttsPath: string | null;
  ts: number;
};

async function readCache(): Promise<CacheEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as CacheEntry[]) : [];
    // Self-heal: silently drop any previously-cached fallback responses.
    const clean = items.filter((e) => !isPoison(e.response));
    if (clean.length !== items.length) {
      await AsyncStorage.setItem(KEY, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return [];
  }
}

async function writeCache(items: CacheEntry[]): Promise<void> {
  while (items.length > CAP) items.shift();
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

/**
 * Look up the most similar cached response. Returns its text+ttsPath when
 * similarity ≥ `threshold`, else null.
 */
export async function getCachedResponse(
  query: string,
  threshold = 0.92
): Promise<{ response: string; ttsPath: string | null } | null> {
  const items = await readCache();
  if (items.length === 0) return null;
  const qv = await embed(query);
  let best: { entry: CacheEntry; score: number } | null = null;
  for (const e of items) {
    const s = cosine(qv, e.queryEmbedding);
    if (!best || s > best.score) best = { entry: e, score: s };
  }
  if (best && best.score >= threshold && best.entry.response) {
    return { response: best.entry.response, ttsPath: best.entry.ttsPath };
  }
  return null;
}

/** Append a new cache entry (FIFO-evict at CAP=100). */
export async function cacheResponse(
  query: string,
  response: string,
  ttsPath: string | null
): Promise<void> {
  if (!response) return;
  try {
    const qv = await embed(query);
    const items = await readCache();
    items.push({ queryEmbedding: qv, response, ttsPath, ts: Date.now() });
    await writeCache(items);
  } catch (e) {
    console.warn('[semcache.cacheResponse]', e);
  }
}

/** Wipe the entire cache (Settings → Clear AI cache). */
export async function clearCache(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  await AsyncStorage.removeItem(PREWARM_FLAG);
}

const PREWARM_QUERIES = [
  'मुझे free वकील चाहिए',
  'मेरा पति मारता है',
  'तलाक कैसे लूँ',
  'बच्चे की custody',
  'FIR कैसे करूँ',
  'OSC कहाँ है',
  'NALSA helpline number',
  'दहेज की शिकायत',
  'workplace harassment',
  'PCOS के लक्षण',
  'मुझे योजना चाहिए',
  'गुज़ारा भत्ता',
  'pregnancy benefits',
  'Sukanya Samriddhi',
  'Ayushman card कैसे बनवाऊँ',
  'मातृ वंदना योजना',
  'Mahila helpline',
  'Zero FIR',
  'घरेलू हिंसा',
  'protection order',
];

/**
 * Pre-warm cache with embedded common questions (no responses).
 * Idempotent — runs only once per install.
 */
export async function prewarmCache(): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(PREWARM_FLAG);
    if (flag === '1') return;
    const items = await readCache();
    for (const q of PREWARM_QUERIES) {
      try {
        const qv = await embed(q);
        items.push({ queryEmbedding: qv, response: '', ttsPath: null, ts: Date.now() });
      } catch {
        // ignore
      }
    }
    await writeCache(items);
    await AsyncStorage.setItem(PREWARM_FLAG, '1');
  } catch (e) {
    console.warn('[semcache.prewarmCache]', e);
  }
}

/** Approx storage size of the cache in bytes (string length). */
export async function cacheSize(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? raw.length : 0;
  } catch {
    return 0;
  }
}
