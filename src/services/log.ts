// Lightweight debug logger. Filter Metro logs with `[saheli/...]` prefix.
// Toggle DEBUG=false to silence everything except errors.
const DEBUG = true;

export type LogTag =
  | 'sarvam'
  | 'pipeline'
  | 'rag'
  | 'safety'
  | 'pii'
  | 'tools'
  | 'cache'
  | 'rights'
  | 'health'
  | 'vault';

export function log(tag: LogTag, msg: string, data?: unknown): void {
  if (!DEBUG) return;
  if (data === undefined) {
    console.log(`[saheli/${tag}] ${msg}`);
  } else {
    let preview = data;
    if (typeof data === 'string') {
      preview = data.length > 200 ? data.slice(0, 200) + '…' : data;
    }
    console.log(`[saheli/${tag}] ${msg}`, preview);
  }
}

export function logErr(tag: LogTag, msg: string, err: unknown): void {
  console.warn(`[saheli/${tag}] ${msg}`, err);
}
