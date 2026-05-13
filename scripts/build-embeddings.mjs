#!/usr/bin/env node
// Pre-build embeddings for RIGHTS_DOCS (and SCHEMES) → JSON files bundled
// with the app. If EXPO_PUBLIC_SARVAM_API_KEY is unset, writes zero-vectors
// + a warning so the app falls back to its lazy hashEmbed path.
//
// Usage:
//   node scripts/build-embeddings.mjs
//
// We avoid TypeScript imports here — instead we lightly parse the data files
// with a regex-driven approach so this script works without tsx/ts-node.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RIGHTS_PATH = path.join(ROOT, 'src/data/rights.ts');
const SCHEMES_PATH = path.join(ROOT, 'src/data/schemes.ts');
const RIGHTS_OUT = path.join(ROOT, 'src/data/rights.embeddings.json');
const SCHEMES_OUT = path.join(ROOT, 'src/data/schemes.embeddings.json');

const KEY = (process.env.EXPO_PUBLIC_SARVAM_API_KEY || '').trim();
const BASE = 'https://api.sarvam.ai';
const EMBED_DIM = 384;

async function callEmbed(text) {
  if (!KEY) return null;
  try {
    const res = await fetch(`${BASE}/embeddings`, {
      method: 'POST',
      headers: {
        'api-subscription-key': KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'sarvam-embedding-v1', input: text }),
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const j = await res.json();
    return j?.data?.[0]?.embedding ?? j?.embedding ?? null;
  } catch (e) {
    console.warn('[embed]', text.slice(0, 40), e.message);
    return null;
  }
}

function zeros() {
  return Array(EMBED_DIM).fill(0);
}

function extractRightsDocs(src) {
  // Cheap parse of the const literal — relies on trailing-comma per entry.
  const out = [];
  const re = /\{\s*id:\s*'([^']+)',[\s\S]*?summary:\s*([\s\S]*?),\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const id = m[1];
    // Concatenate all string literals inside the summary expression.
    const summaryExpr = m[2];
    const strRe = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    let s;
    let summary = '';
    while ((s = strRe.exec(summaryExpr)) !== null) summary += s[1].replace(/\\'/g, "'");
    out.push({ id, summary });
  }
  return out;
}

function extractSchemes(src) {
  const out = [];
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameHi:[\s\S]*?summary:\s*'([^']+)',\s*summaryHi:\s*'([^']+)',/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push({ id: m[1], text: `${m[2]} — ${m[3]} ${m[4]}` });
  }
  return out;
}

async function build(label, items, outPath, getText) {
  const out = {};
  let real = 0;
  for (const item of items) {
    const txt = getText(item);
    const v = await callEmbed(txt);
    if (v) {
      out[item.id] = v;
      real++;
    } else {
      out[item.id] = zeros();
    }
  }
  await fs.writeFile(outPath, JSON.stringify(out));
  console.log(
    `[${label}] wrote ${Object.keys(out).length} embeddings (${real} real, ${
      Object.keys(out).length - real
    } zero) → ${path.relative(ROOT, outPath)}`
  );
}

async function main() {
  if (!KEY) {
    console.warn(
      '⚠ EXPO_PUBLIC_SARVAM_API_KEY not set — writing zero-vectors. App will fall back to runtime hashEmbed.'
    );
  }
  const rightsSrc = await fs.readFile(RIGHTS_PATH, 'utf8');
  const rights = extractRightsDocs(rightsSrc);
  if (rights.length === 0) {
    console.warn('No rights docs parsed — check rights.ts format.');
  }
  await build('rights', rights, RIGHTS_OUT, (d) => d.summary);

  try {
    const schemesSrc = await fs.readFile(SCHEMES_PATH, 'utf8');
    const schemes = extractSchemes(schemesSrc);
    await build('schemes', schemes, SCHEMES_OUT, (s) => s.text);
  } catch (e) {
    console.warn('[schemes] skipped:', e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
