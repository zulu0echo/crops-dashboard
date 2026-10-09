// Pillar rollup (methodology 2.4) and cell freshness (2.6). Used by the build,
// the PR rollup diff, and nothing else.
//
//   node scripts/rollup.mjs [data-dir]          print { slug: { pillar: {score, limiting} } } as JSON
//   node scripts/rollup.mjs --diff a.json b.json print a markdown table of changed pillars
//   node scripts/rollup.mjs --self-check
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

export const STALE_DAYS = 180;

export function loadData(dir = 'data') {
  const criteria = parse(readFileSync(join(dir, 'criteria.yaml'), 'utf8'));
  let regions = { countries: [], regions: {} };
  try { regions = parse(readFileSync(join(dir, 'regions.yaml'), 'utf8')); } catch { /* optional in forks */ }
  const providers = readdirSync(join(dir, 'providers'))
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => parse(readFileSync(join(dir, 'providers', f), 'utf8')));
  return { criteria, providers, regions };
}

// A cell is treated as unknown when it has no score, or when the nightly re-check found drift
// in any of its evidence: a changed fact cannot keep supporting the old score until a human re-checks it.
export const isUnknown = (cell) => !cell || typeof cell.score !== 'number' || (cell.evidence ?? []).some((e) => e.drift === true);
// Score used for rollup: unknown counts as 0.
export const value = (cell) => (isUnknown(cell) ? 0 : cell.score);

// Pillar score = min of its criteria. `limiting` lists every criterion at that minimum.
export function rollup(provider, criteria) {
  const out = {};
  for (const pillar of criteria.pillars) {
    const ids = criteria.criteria.filter((c) => c.pillar === pillar.id).map((c) => c.id);
    const score = Math.min(...ids.map((id) => value(provider.scores?.[id])));
    out[pillar.id] = { score, limiting: ids.filter((id) => value(provider.scores?.[id]) === score) };
  }
  return out;
}

// Freshness of one criterion cell, relative to `today` (YYYY-MM-DD).
export function cellStatus(cell, today) {
  const ev = cell?.evidence ?? [];
  const newest = ev.map((e) => e.checked_at).sort().at(-1) ?? null;
  const age = newest ? (Date.parse(today) - Date.parse(newest)) / 864e5 : null;
  const tiers = ['verified', 'documented', 'claimed'];
  return {
    newest,
    stale: age !== null && age > STALE_DAYS,
    drift: ev.some((e) => e.drift === true),
    tier: tiers.find((t) => ev.some((e) => e.tier === t)) ?? null,
  };
}

// Country availability. Returns 'yes', 'no', or 'unknown' for one ISO code.
// `regions` maps region names (EU, EEA) to code lists; unknown when the provider has no availability evidence.
export function availableIn(p, cc, regions = {}) {
  const a = p.availability;
  if (!a) return 'unknown';
  if (a.model === 'global') return 'yes';
  const list = new Set((a.countries ?? []).flatMap((c) => regions[c] ?? [c]));
  return (a.model === 'allowlist') === list.has(cc) ? 'yes' : 'no';
}

export function diff(before, after) {
  const rows = [];
  for (const slug of new Set([...Object.keys(before), ...Object.keys(after)])) {
    for (const p of new Set([...Object.keys(before[slug] ?? {}), ...Object.keys(after[slug] ?? {})])) {
      const a = before[slug]?.[p], b = after[slug]?.[p];
      const fmt = (x) => (x ? `${x.score} (${x.limiting.join(', ')})` : '—');
      if (fmt(a) !== fmt(b)) rows.push(`| ${slug} | ${p} | ${fmt(a)} | ${fmt(b)} |`);
    }
  }
  if (!rows.length) return 'No pillar scores changed.';
  return ['| Provider | Pillar | Before (limiting) | After (limiting) |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function selfCheck() {
  const assert = (ok, msg) => { if (!ok) throw new Error('rollup self-check failed: ' + msg); };
  const criteria = {
    pillars: [{ id: 'C' }, { id: 'O' }],
    criteria: [{ id: 'C1', pillar: 'C' }, { id: 'C2', pillar: 'C' }, { id: 'C3', pillar: 'C' }, { id: 'O1', pillar: 'O' }],
  };
  const p = { scores: { C1: { score: 3 }, C2: { score: 1 }, C3: { score: 1 }, O1: { unknown: true } } };
  const r = rollup(p, criteria);
  assert(r.C.score === 1, 'min of 3,1,1 should be 1');
  assert(r.C.limiting.join() === 'C2,C3', 'limiting should be C2,C3');
  assert(r.O.score === 0 && r.O.limiting.join() === 'O1', 'unknown counts as 0');
  const drifted = rollup({ scores: { C1: { score: 3, evidence: [{ drift: true }] }, C2: { score: 3 }, C3: { score: 3 }, O1: { score: 2 } } }, criteria);
  assert(drifted.C.score === 0 && drifted.C.limiting.join() === 'C1', 'drifted cell must count as unknown');
  const s = cellStatus({ evidence: [{ checked_at: '2026-01-01', tier: 'documented' }, { checked_at: '2025-01-01', tier: 'verified', drift: true }] }, '2026-10-07');
  assert(s.newest === '2026-01-01' && s.stale && s.drift && s.tier === 'verified', 'cellStatus');
  assert(!cellStatus({ evidence: [{ checked_at: '2026-06-01' }] }, '2026-10-07').stale, 'fresh cell marked stale');
  assert(diff({ x: { C: { score: 1, limiting: ['C2'] } } }, { x: { C: { score: 2, limiting: ['C2'] } } }).includes('| x | C | 1 (C2) | 2 (C2) |'), 'diff');
  const regions = { EU: ['DE', 'FR'] };
  assert(availableIn({}, 'KE') === 'unknown', 'no availability is unknown');
  assert(availableIn({ availability: { model: 'global' } }, 'KE') === 'yes', 'global');
  assert(availableIn({ availability: { model: 'allowlist', countries: ['EU', 'GB'] } }, 'FR', regions) === 'yes', 'allowlist via region');
  assert(availableIn({ availability: { model: 'allowlist', countries: ['EU'] } }, 'US', regions) === 'no', 'allowlist miss');
  assert(availableIn({ availability: { model: 'blocklist', countries: ['US'] } }, 'US') === 'no', 'blocklist hit');
  assert(availableIn({ availability: { model: 'blocklist', countries: ['US'] } }, 'KE') === 'yes', 'blocklist miss');
  console.log('rollup self-check: ok');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [arg, a, b] = process.argv.slice(2);
  if (arg === '--self-check') selfCheck();
  else if (arg === '--diff') console.log(diff(JSON.parse(readFileSync(a, 'utf8')), JSON.parse(readFileSync(b, 'utf8'))));
  else {
    const { criteria, providers } = loadData(arg ?? 'data');
    console.log(JSON.stringify(Object.fromEntries(providers.map((p) => [p.slug, rollup(p, criteria)])), null, 2));
  }
}
