// PII redaction. Used before sending OCR text or chat content to cloud LLMs,
// and on persisted entitlements text. Conservative — preserves helpline numbers
// (181, 112, 1091, 1098, 14416, 15100, 56161) so the model can keep referring
// to them. Returns redacted text + a count for analytics.
import type { ChatMessage } from './sarvam';

const HELPLINE_WHITELIST = new Set(['181', '112', '1091', '1098', '14416', '15100', '56161']);

// Small in-app dictionary of common Indian first names. Intentionally limited;
// expand over time. Matched case-insensitively at word boundaries.
const NAMES = [
  'Ravi', 'Suresh', 'Priya', 'Anjali', 'Sunita', 'Geeta', 'Pooja', 'Rohit',
  'Amit', 'Rahul', 'Sneha', 'Kavita', 'Manju', 'Rekha', 'Lakshmi', 'Sita',
  'Radha', 'Meena', 'Vijay', 'Arjun', 'Sandeep', 'Manoj', 'Vikram', 'Asha',
  'Neha', 'Nisha', 'Divya', 'Shreya', 'Anita', 'Deepak',
];
const NAME_RE = new RegExp(`\\b(${NAMES.join('|')})\\b`, 'gi');

// 12-digit Aadhaar (with optional spaces between groups of 4).
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;

// 10-digit phone number — also catches +91-prefixed forms. Helplines whitelisted below.
const PHONE_RE = /(?:\+?91[-\s]?)?\b\d{10}\b/g;

export type RedactionResult = { redacted: string; foundCount: number };

/**
 * Redact PII from `text`. Replaces Aadhaar, phone numbers, and common Indian
 * first names with placeholder tokens. Helpline numbers are preserved.
 */
export function redactPII(text: string): RedactionResult {
  if (!text) return { redacted: text, foundCount: 0 };
  let count = 0;
  let out = text.replace(AADHAAR_RE, () => {
    count++;
    return '[AADHAAR]';
  });
  out = out.replace(PHONE_RE, (m) => {
    const digits = m.replace(/\D/g, '').replace(/^91/, '');
    if (HELPLINE_WHITELIST.has(digits)) return m;
    if (digits.length === 10 && HELPLINE_WHITELIST.has(digits.slice(-3))) return m;
    count++;
    return '[PHONE]';
  });
  // Also redact bare 3-5 digit numbers that aren't helplines? No — too noisy.
  // Just preserve standalone helpline tokens explicitly.
  out = out.replace(NAME_RE, () => {
    count++;
    return '[NAME]';
  });
  return { redacted: out, foundCount: count };
}

/** Convenience: redact PII inside a ChatMessage's `content` field. */
export function redactPIIInMessage(msg: ChatMessage): ChatMessage {
  return { ...msg, content: redactPII(msg.content).redacted };
}

/** Returns true if `redactPII` would touch this text. */
export function containsPII(text: string): boolean {
  return redactPII(text).foundCount > 0;
}
