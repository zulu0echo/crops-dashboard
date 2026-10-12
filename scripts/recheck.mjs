// Weekly refresh (methodology 2.6). Re-reads every cited source. Never changes a score.
//  - onchain evidence with a `check`: re-read the same word at the latest block and compare.
//  - repo evidence: LICENSE and lockfiles compare pinned content to the default branch (a change is drift);
//    any other file compares the cited lines (or whole file) to the default branch (a change is "changed upstream").
//  - document evidence with a `quote`: re-fetch the page and look for the quote.
// Covers ratings, availability, and the operational layer (data/operational).
// Unchanged evidence gets `confirmed_at: <today>`, which counts as fresh for staleness.
// Changed evidence gets `drift: true` (the cell then counts as unknown until a human re-checks it).
// Sources that could not be read are listed, never treated as drift or as confirmed.
// Writes refresh-report.json and drift-report.json ({ slug: [ "C1 evidence[0]: ..." ] }).
//
//   node scripts/recheck.mjs [--dry-run]
//   node scripts/recheck.mjs --self-check
// RPC per chain: env RPC_<chainId> overrides the public default. No keys needed.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { parseDocument } from 'yaml';

const RPC = { 1: 'https://ethereum-rpc.publicnode.com', 10: 'https://mainnet.optimism.io', 100: 'https://rpc.gnosischain.com', 137: 'https://polygon-bor-rpc.publicnode.com', 8453: 'https://mainnet.base.org', 42161: 'https://arb1.arbitrum.io/rpc', 42220: 'https://forno.celo.org', 534352: 'https://rpc.scroll.io', 43114: 'https://api.avax.network/ext/bc/C/rpc', 59144: 'https://rpc.linea.build', 122: 'https://rpc.fuse.io', 999: 'https://rpc.hyperliquid.xyz/evm', 9745: 'https://rpc.plasma.to', 56: 'https://bsc-rpc.publicnode.com' };
const rpcFor = (chainId) => process.env[`RPC_${chainId}`] ?? RPC[chainId];
const WATCHED = /(^|\/)(LICEN[CS]E[^/]*|COPYING|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|foundry\.lock|go\.sum|poetry\.lock|uv\.lock)$/i;
const GH = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([0-9a-f]{40})\/([^#?]+)/;
const UA = { 'user-agent': 'crops-dashboard-refresh' };
// English pages: some help centres redirect by IP to a translated page without this.
const PAGE_HEADERS = { ...UA, 'accept-language': 'en' };

export async function rpc(chainId, method, params) {
  const url = rpcFor(chainId);
  if (!url) throw new Error(`no RPC configured for chain ${chainId} (set RPC_${chainId})`);
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
// Public RPCs rate-limit bursts; retry those (only) with a short backoff.
const rpcRetry = async (...args) => {
  for (let i = 0; ; i++) {
    try { return await rpc(...args); } catch (e) {
      if (i >= 3 || !/rate limit|429|too many/i.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
};

const raw = async (owner, repo, ref, path) => {
  const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (r.status === 404) return null; // file removed at HEAD is drift too
  if (!r.ok) throw new Error(`raw ${owner}/${repo}@${ref}/${path}: ${r.status}`);
  return r.text();
};

export const live = {
  word: (chainId, e) => (e.check.call
    ? rpcRetry(chainId, 'eth_call', [{ to: e.address, data: e.check.call }, 'latest'])
    : rpcRetry(chainId, 'eth_getStorageAt', [e.address, e.check.slot, 'latest'])),
  pinned: (o, r, sha, path) => raw(o, r, sha, path),
  head: (o, r, path) => raw(o, r, 'HEAD', path),
  // Returns { status, text }; throws on network failure.
  page: async (url) => { const r = await fetch(url, { redirect: 'follow', headers: PAGE_HEADERS, signal: AbortSignal.timeout(20000) }); return { status: r.status, url: r.url, text: r.ok ? await r.text() : '' }; },
};
// Same page and file are cited many times; read each once per run.
const memo = (f) => { const c = new Map(); return (...a) => { const k = JSON.stringify(a); if (!c.has(k)) c.set(k, f(...a)); return c.get(k); }; };
export const cached = (src) => ({ word: src.word, pinned: memo(src.pinned), head: memo(src.head), page: memo(src.page) });

// Lowercased visible text, for quote matching (same normalisation as the validator).
const norm = (t) => String(t).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;|&#34;|&ldquo;|&rdquo;/g, '"').replace(/&#39;|&rsquo;|&lsquo;|[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();
const word32 = (h) => '0x' + String(h).toLowerCase().replace(/^0x/, '').padStart(64, '0').slice(-64);
const linesOf = (text, url) => { const L = url.match(/#L(\d+)(?:-L(\d+))?$/); if (!L || text === null) return text; return text.split('\n').slice(+L[1] - 1, +(L[2] ?? L[1])).join('\n'); };

// One evidence item -> { state: confirmed | drift | upstream | unreadable | skip, reason }.
export async function checkItem(e, chainId, src) {
  if (e.historical) return { state: 'skip', reason: 'historical' };
  if (e.kind === 'onchain') {
    if (!e.check) return { state: 'skip', reason: 'no re-checkable read recorded' };
    // ponytail: onchain re-checks are EVM-only (numeric chain_id). Upgrade path: a Solana getAccountInfo reader.
    if (typeof chainId !== 'number') return { state: 'skip', reason: 'non-EVM chain' };
    const got = word32(await src.word(chainId, e));
    return got === word32(e.check.expect) ? { state: 'confirmed' } : { state: 'drift', reason: `${e.check.call ? 'call ' + e.check.call : 'slot ' + e.check.slot} on ${e.address}: expected ${e.check.expect}, now ${got}` };
  }
  if (e.kind === 'repo') {
    const m = e.url.match(GH);
    if (!m) return { state: 'skip', reason: 'not a pinned GitHub file' };
    const [, owner, repo, sha, path] = m;
    const [a, b] = [await src.pinned(owner, repo, sha, path), await src.head(owner, repo, path)];
    if (a === null) return { state: 'unreadable', reason: `${owner}/${repo}/${path} not readable at pinned ${sha.slice(0, 10)}` };
    // Licences: a new copyright year or holder is not a licence change; compare the terms only.
    const terms = (t) => (t === null ? null : /LICEN[CS]E|COPYING/i.test(path) ? t.split('\n').filter((l) => !/^\s*copyright\b/i.test(l)).join('\n').replace(/\s+/g, ' ').trim() : t);
    if (WATCHED.test(path)) return terms(a) === terms(b) ? { state: 'confirmed' } : { state: 'drift', reason: `${owner}/${repo}/${path} differs between pinned ${sha.slice(0, 10)} and default branch${b === null ? ' (file removed)' : ''}` };
    return linesOf(a, e.url) === linesOf(b, e.url) ? { state: 'confirmed' } : { state: 'upstream', reason: `${owner}/${repo}/${path}${b === null ? ' removed on' : ' cited lines differ on'} the default branch (the pinned commit still holds)` };
  }
  if (e.kind === 'document') {
    if (!e.quote) return { state: 'skip', reason: 'no quote to look for' };
    const want = norm(e.quote);
    let r;
    try { r = await src.page(e.url); } catch (err) { return { state: 'unreadable', reason: `${e.url}: ${err.cause?.code ?? err.name}` }; }
    if (r.status >= 400) return { state: 'unreadable', reason: `${e.url} returned ${r.status}` };
    // Redirected to another language version (by IP): the cited text is not expected there.
    const lang = (u) => (String(u ?? '').match(/\/([a-z]{2}(?:-[a-z]{2})?)\//i)?.[1] ?? '').toLowerCase();
    if (r.url && lang(e.url) && lang(r.url) !== lang(e.url)) return { state: 'unreadable', reason: `${e.url} redirected to another language (${r.url})` };
    if (norm(r.text).includes(want)) return { state: 'confirmed' };
    // Client-rendered pages carry their text in script data; the quote being served at all is enough.
    if (r.text.replace(/\s+/g, ' ').toLowerCase().includes(want)) return { state: 'confirmed' };
    // An archived page is usually client-rendered or bot-blocked live; a missing quote there is not evidence of change.
    if (e.archive) return { state: 'unreadable', reason: `${e.url}: quote not in the served HTML (archive ${e.archive} kept)` };
    return { state: 'drift', reason: `${e.url}: quoted text no longer on the page` };
  }
  return { state: 'skip', reason: `kind ${e.kind} is refreshed elsewhere or not re-readable` };
}

// Every evidence array anywhere in a record: scores, availability, operational facts, cash-out rows.
export function* evidenceItems(obj, path = []) {
  if (Array.isArray(obj)) { for (const [i, v] of obj.entries()) yield* evidenceItems(v, [...path, i]); return; }
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'evidence' && Array.isArray(v)) { for (const [i, e] of v.entries()) if (e && typeof e === 'object' && e.kind) yield [[...path, k, i], e]; }
    else yield* evidenceItems(v, [...path, k]);
  }
}
const label = (path) => path.join('.').replace(/^scores\./, '').replace(/\.evidence\.(\d+)$/, ' evidence[$1]');

// Walk one record; returns results keyed by state. Bounded concurrency so public hosts are not burst.
export async function refreshRecord(rec, chainId, src, limit = 6) {
  const items = [...evidenceItems(rec)];
  const out = { confirmed: [], drift: [], upstream: [], unreadable: [], skip: [], failed: [] };
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const [path, e] = items[next++];
      try { const r = await checkItem(e, e.chain_id ?? chainId, src); out[r.state].push({ path, where: label(path), reason: r.reason }); }
      catch (err) { out.failed.push({ path, where: label(path), reason: err.message }); }
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

async function selfCheck() {
  const ok = (c, m) => { if (!c) throw new Error('recheck self-check failed: ' + m); };
  const owner = '0x' + '0'.repeat(24) + 'ab'.repeat(20);
  const pin = (f, l = '') => `https://github.com/o/r/blob/${'a'.repeat(40)}/${f}${l}`;
  const p = {
    primary_chain: { chain_id: 8453 },
    scores: {
      C1: { evidence: [
        { kind: 'onchain', address: '0x' + '1'.repeat(40), check: { call: '0x8da5cb5b', expect: owner } },
        { kind: 'onchain', address: '0x' + '2'.repeat(40), check: { slot: '0x0', expect: owner } },
      ] },
      F1: { evidence: [
        { kind: 'repo', path: 'LICENSE', url: pin('LICENSE') },
        { kind: 'repo', path: 'src/x.sol', url: pin('src/x.sol', '#L1-L2') },
        { kind: 'repo', path: 'src/y.sol', url: pin('src/y.sol', '#L2') },
        { kind: 'repo', path: 'COPYING', url: pin('COPYING') },
      ] },
      P2: { evidence: [
        { kind: 'document', url: 'https://a.example/ok', quote: 'We  may Suspend' },
        { kind: 'document', url: 'https://a.example/gone', quote: 'we may suspend' },
        { kind: 'document', url: 'https://a.example/blocked', quote: 'we may suspend' },
        { kind: 'document', url: 'https://a.example/gone', quote: 'we may suspend', archive: 'data/archive/x.txt' },
        { kind: 'document', url: 'https://a.example/spa', quote: 'we may suspend' },
        { kind: 'document', url: 'https://a.example/en/gone', quote: 'we may suspend' },
        { kind: 'onchain', address: '0x' + '3'.repeat(40), historical: true, check: { slot: '0x0', expect: owner } },
      ] },
      C2: { unknown: true },
    },
    availability: { evidence: [{ kind: 'document', url: 'https://a.example/ok', quote: 'suspend' }] },
  };
  const src = cached({
    word: async (_c, e) => (e.address.includes('1') ? owner.replace(/^0x0*/, '0x') : '0x' + 'cd'.repeat(32)),
    pinned: async (_o, _r, _s, f) => (f === 'LICENSE' ? 'MIT' : f === 'COPYING' ? 'Copyright 2023 A\nGPL terms' : 'a\nb\nc'),
    head: async (_o, _r, f) => (f === 'LICENSE' ? 'BUSL-1.1' : f === 'COPYING' ? 'Copyright 2023-2026 B\nGPL terms' : f === 'src/x.sol' ? 'a\nb\nCHANGED' : 'a\nX\nc'),
    page: async (u) => (u.includes('/en/') ? { status: 200, url: u.replace('/en/', '/pt-BR/'), text: 'outro' } : u.endsWith('blocked') ? { status: 403, text: '' } : { status: 200, text: u.endsWith('ok') ? '<p>We may <b>suspend</b></p>' : u.endsWith('spa') ? '<script>{"t":"We may suspend"}</script>' : '<p>new terms</p>' }),
  });
  const r = await refreshRecord(p, 8453, src);
  const w = (k) => r[k].map((x) => x.where).sort().join();
  ok(!r.failed.length, 'unexpected failures ' + JSON.stringify(r.failed));
  ok(w('drift') === 'C1 evidence[1],F1 evidence[0],P2 evidence[1]', 'drift: ' + w('drift'));
  ok(w('confirmed') === 'C1 evidence[0],F1 evidence[1],F1 evidence[3],P2 evidence[0],P2 evidence[4],availability evidence[0]', 'confirmed: ' + w('confirmed'));
  ok(w('upstream') === 'F1 evidence[2]', 'upstream: ' + w('upstream'));
  ok(w('unreadable') === 'P2 evidence[2],P2 evidence[3],P2 evidence[5]', 'unreadable: ' + w('unreadable'));
  ok(w('skip') === 'P2 evidence[6]', 'skip: ' + w('skip'));
  console.log('recheck self-check: ok');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-check')) { await selfCheck(); process.exit(0); }
  const dry = process.argv.includes('--dry-run');
  const today = new Date().toISOString().slice(0, 10);
  const src = cached(live);
  const drift = {}, summary = { date: today, totals: {}, upstream: {}, unreadable: {}, failed: {} };
  const files = ['data/providers', 'data/operational'].filter(existsSync).flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.yaml')).sort().map((f) => join(d, f)));
  const chainOf = Object.fromEntries(readdirSync('data/providers').filter((f) => f.endsWith('.yaml')).map((f) => { const p = parseDocument(readFileSync(join('data/providers', f), 'utf8')).toJS(); return [p.slug, p.primary_chain?.chain_id]; }));
  for (const file of files) {
    const doc = parseDocument(readFileSync(file, 'utf8'));
    const rec = doc.toJS();
    const slug = rec.slug ?? file.split('/').pop().replace(/\.yaml$/, '');
    const layer = file.includes('/operational/') ? 'operational ' : '';
    const r = await refreshRecord(rec, chainOf[slug], src);
    for (const [k, v] of Object.entries(r)) summary.totals[k] = (summary.totals[k] ?? 0) + v.length;
    for (const k of ['upstream', 'unreadable', 'failed']) if (r[k].length) summary[k][slug] = [...(summary[k][slug] ?? []), ...r[k].map((x) => `${layer}${x.where}: ${x.reason}`)];
    if (r.drift.length) drift[slug] = [...(drift[slug] ?? []), ...r.drift.map((x) => `${layer}${x.where}: ${x.reason}`)];
    for (const x of r.confirmed) doc.setIn([...x.path, 'confirmed_at'], today);
    for (const x of r.drift) doc.setIn([...x.path, 'drift'], true);
    if (!dry && (r.confirmed.length || r.drift.length)) writeFileSync(file, doc.toString({ lineWidth: 0 }));
    console.log(`${file}: ${Object.entries(r).filter(([, v]) => v.length).map(([k, v]) => `${v.length} ${k}`).join(', ')}`);
  }
  writeFileSync('drift-report.json', JSON.stringify(drift, null, 2) + '\n');
  writeFileSync('refresh-report.json', JSON.stringify(summary, null, 2) + '\n');
  for (const [s, l] of Object.entries(drift)) console.log(`DRIFT ${s}\n  ${l.join('\n  ')}`);
  console.log(`totals: ${JSON.stringify(summary.totals)}`);
  // Read failures are not drift and do not fail the run; the weekly summary issue lists them.
}
