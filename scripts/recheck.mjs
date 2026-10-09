// Nightly drift check (methodology 2.6, build spec 6.3). Never changes scores.
//  - onchain evidence with a `check`: re-read the same word at the latest block and compare.
//  - repo evidence whose path is a LICENSE or lockfile: compare pinned content to the default branch.
// On drift: sets `drift: true` on the item (comments in the YAML are preserved) and writes
// drift-report.json ({ slug: [ "C1 evidence[0]: ..." ] }) for the workflow to turn into issues.
//
//   node scripts/recheck.mjs [--dry-run]
//   node scripts/recheck.mjs --self-check
// RPC per chain: env RPC_<chainId> overrides the public default. No keys needed.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const RPC = { 1: 'https://ethereum-rpc.publicnode.com', 10: 'https://mainnet.optimism.io', 100: 'https://rpc.gnosischain.com', 137: 'https://polygon-bor-rpc.publicnode.com', 8453: 'https://mainnet.base.org', 42161: 'https://arb1.arbitrum.io/rpc', 42220: 'https://forno.celo.org', 534352: 'https://rpc.scroll.io', 43114: 'https://api.avax.network/ext/bc/C/rpc', 59144: 'https://rpc.linea.build', 122: 'https://rpc.fuse.io', 999: 'https://rpc.hyperliquid.xyz/evm', 9745: 'https://rpc.plasma.to', 56: 'https://bsc-rpc.publicnode.com' };
const rpcFor = (chainId) => process.env[`RPC_${chainId}`] ?? RPC[chainId];
const WATCHED = /(^|\/)(LICEN[CS]E[^/]*|COPYING|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|foundry\.lock|go\.sum|poetry\.lock|uv\.lock)$/i;
const GH = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([0-9a-f]{40})\//;

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
  const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`, { signal: AbortSignal.timeout(20000) });
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
};

// Pure-ish core: walks a provider object, asks `src` for current values, returns
// [{ id, index, reason }] for drifted items and [{ id, index, error }] for failed reads.
// ponytail: sequential reads, fine for tens of providers. Upgrade path: per-chain batching (multicall).
export async function findDrift(p, src) {
  const drift = [], failed = [];
  for (const [id, cell] of Object.entries(p.scores ?? {})) {
    for (const [index, e] of (cell.evidence ?? []).entries()) {
      try {
        // ponytail: onchain re-checks are EVM-only (numeric chain_id). Upgrade path: a Solana getAccountInfo reader.
        if (e.kind === 'onchain' && e.check && typeof (e.chain_id ?? p.primary_chain?.chain_id) === 'number') {
          const got = String(await src.word(e.chain_id ?? p.primary_chain?.chain_id, e)).toLowerCase();
          // eth_call returns exactly 32 bytes for a single-word return; normalise either way.
          const norm = (h) => '0x' + h.replace(/^0x/, '').padStart(64, '0').slice(-64);
          if (norm(got) !== norm(e.check.expect)) drift.push({ id, index, reason: `${e.check.call ? 'call ' + e.check.call : 'slot ' + e.check.slot} on ${e.address}: expected ${e.check.expect}, now ${norm(got)}` });
        } else if (e.kind === 'repo' && e.path && WATCHED.test(e.path) && !e.historical) {
          const m = e.url.match(GH);
          if (!m) continue;
          const [, owner, repo, sha] = m;
          const [a, b] = [await src.pinned(owner, repo, sha, e.path), await src.head(owner, repo, e.path)];
          if (a !== b) drift.push({ id, index, reason: `${owner}/${repo}/${e.path} differs between pinned ${sha.slice(0, 10)} and default branch${b === null ? ' (file removed)' : ''}` });
        }
      } catch (err) {
        failed.push({ id, index, error: err.message });
      }
    }
  }
  return { drift, failed };
}

async function selfCheck() {
  const ok = (c, m) => { if (!c) throw new Error('recheck self-check failed: ' + m); };
  const owner = '0x' + '0'.repeat(24) + 'ab'.repeat(20);
  const p = {
    primary_chain: { chain_id: 8453 },
    scores: {
      C1: { evidence: [
        { kind: 'onchain', address: '0x' + '1'.repeat(40), check: { call: '0x8da5cb5b', expect: owner } },
        { kind: 'onchain', address: '0x' + '2'.repeat(40), check: { slot: '0x0', expect: owner } },
      ] },
      F1: { evidence: [
        { kind: 'repo', path: 'LICENSE', url: `https://github.com/o/r/blob/${'a'.repeat(40)}/LICENSE` },
        { kind: 'repo', path: 'src/x.sol', url: `https://github.com/o/r/blob/${'a'.repeat(40)}/src/x.sol` },
      ] },
      C2: { unknown: true },
    },
  };
  const src = {
    word: async (_c, e) => (e.address.includes('1') ? owner.replace(/^0x0*/, '0x') : '0x' + 'cd'.repeat(32)),
    pinned: async () => 'MIT',
    head: async () => 'BUSL-1.1',
  };
  const { drift, failed } = await findDrift(p, src);
  ok(!failed.length, 'unexpected failures ' + JSON.stringify(failed));
  ok(drift.map((d) => `${d.id}:${d.index}`).join() === 'C1:1,F1:0', 'expected drift on C1[1] and F1[0], got ' + JSON.stringify(drift));
  console.log('recheck self-check: ok');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-check')) { await selfCheck(); process.exit(0); }
  const dry = process.argv.includes('--dry-run');
  const report = {}, failures = {};
  for (const f of readdirSync('data/providers').filter((f) => f.endsWith('.yaml')).sort()) {
    const file = join('data/providers', f);
    const doc = parseDocument(readFileSync(file, 'utf8'));
    const p = doc.toJS();
    const { drift, failed } = await findDrift(p, live);
    if (failed.length) failures[p.slug] = failed.map((x) => `${x.id} evidence[${x.index}]: ${x.error}`);
    if (!drift.length) continue;
    report[p.slug] = drift.map((d) => `${d.id} evidence[${d.index}]: ${d.reason}`);
    for (const d of drift) doc.setIn(['scores', d.id, 'evidence', d.index, 'drift'], true);
    if (!dry) writeFileSync(file, doc.toString({ lineWidth: 0 }));
  }
  writeFileSync('drift-report.json', JSON.stringify(report, null, 2) + '\n');
  for (const [s, l] of Object.entries(report)) console.log(`DRIFT ${s}\n  ${l.join('\n  ')}`);
  for (const [s, l] of Object.entries(failures)) console.error(`READ FAILED ${s}\n  ${l.join('\n  ')}`);
  console.log(`${Object.keys(report).length} provider(s) drifted, ${Object.keys(failures).length} with read failures`);
  // Read failures are not drift; they fail the job so a human looks, without touching data.
  process.exit(Object.keys(failures).length ? 1 : 0);
}
