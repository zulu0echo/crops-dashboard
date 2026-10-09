// Verified-only volumes: re-runs each provider's `volume.spec` query against public chain logs
// and writes the result into data/operational/<slug>.yaml. The figure is "gross observed":
// every matching event in the window, with no attempt to remove self-transfers or tests.
//
//   node scripts/volumes.mjs [slug...]        (RPC_<chainId> env overrides the public default)
//   node scripts/volumes.mjs --self-check
// ponytail: sequential eth_getLogs in fixed chunks against public RPCs. Long windows on busy
// chains exceed MAX_CALLS and are recorded as not computed. Upgrade path: an archive RPC via
// RPC_<chainId>, or a committed precomputed dataset produced elsewhere with the same spec.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
import { rpc } from './recheck.mjs';

// Approximate blocks per day per chain, used only to turn window_days into a block range.
export const BLOCKS_PER_DAY = { 1: 7150, 10: 43200, 100: 16600, 137: 40000, 8453: 43200, 42161: 340000, 42220: 86400, 43114: 43200, 534352: 28800, 59144: 43200 };
const CHUNK = Number(process.env.LOG_CHUNK ?? 2000);
const MAX_CALLS = Number(process.env.MAX_CALLS ?? 1500);
const today = new Date().toISOString().slice(0, 10);

const word = (data, i) => BigInt('0x' + data.slice(2 + i * 64, 2 + (i + 1) * 64));
const addrWord = (data, i) => '0x' + data.slice(2 + i * 64 + 24, 2 + (i + 1) * 64);

// Pure core: `getLogs(from, to)` returns raw logs; returns the value block for the file.
export async function compute(spec, latest, getLogs) {
  const bpd = BLOCKS_PER_DAY[spec.chain_id];
  if (!bpd) throw new Error(`no blocks-per-day estimate for chain ${spec.chain_id}`);
  const from = Math.max(0, latest - spec.window_days * bpd);
  const perToken = new Map();
  let events = 0, calls = 0;
  for (let a = from; a <= latest; a += CHUNK) {
    if (++calls > MAX_CALLS) throw new Error(`window needs more than ${MAX_CALLS} log queries; set RPC_${spec.chain_id} to an archive node or raise MAX_CALLS`);
    for (const log of await getLogs(a, Math.min(a + CHUNK - 1, latest))) {
      events++;
      const token = spec.token ? spec.token.toLowerCase() : spec.token_word !== undefined ? addrWord(log.data, spec.token_word) : 'n/a';
      const amount = spec.amount_word !== undefined ? word(log.data, spec.amount_word) : 0n;
      const t = perToken.get(token) ?? { token, count: 0, sum: 0n };
      t.count++; t.sum += amount; perToken.set(token, t);
    }
  }
  const results = [...perToken.values()].map((t) => {
    const out = { token: t.token, count: t.count, sum: t.sum.toString() };
    if (spec.decimals !== undefined && t.token === (spec.token ?? '').toLowerCase()) { out.decimals = spec.decimals; out.symbol = spec.symbol; out.sum_units = units(t.sum, spec.decimals); }
    return out;
  });
  return { from_block: from, to_block: latest, computed_at: today, events, results, calls };
}
const units = (n, d) => { const s = n.toString().padStart(d + 1, '0'); return `${s.slice(0, s.length - d)}.${s.slice(s.length - d, s.length - d + 2)}`; };

async function selfCheck() {
  const ok = (c, m) => { if (!c) throw new Error('volumes self-check failed: ' + m); };
  const spec = { chain_id: 8453, addresses: ['0x' + '1'.repeat(40)], topic0: '0x' + 'a'.repeat(64), amount_word: 1, token: '0x' + '2'.repeat(40), decimals: 6, symbol: 'USDC', window_days: 1 };
  const pad = (n) => n.toString(16).padStart(64, '0');
  const logs = [{ data: '0x' + pad(0) + pad(1_500_000) }, { data: '0x' + pad(0) + pad(2_500_000) }];
  let calls = 0;
  const v = await compute(spec, 43200 * 2, async (a, b) => { calls++; return a === 43200 ? logs : []; });
  ok(v.events === 2 && v.results[0].count === 2 && v.results[0].sum === '4000000' && v.results[0].sum_units === '4.00', 'sum/count wrong: ' + JSON.stringify(v));
  ok(v.from_block === 43200 && calls === Math.ceil((43200 + 1) / CHUNK), 'window/chunking wrong');
  console.log('volumes self-check: ok');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-check')) { await selfCheck(); process.exit(0); }
  const want = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync('data/operational').filter((x) => x.endsWith('.yaml')).sort()) {
    const file = `data/operational/${f}`, doc = parseDocument(readFileSync(file, 'utf8')), p = doc.toJS();
    if (!p.volume?.spec || (want.length && !want.includes(p.slug))) continue;
    const spec = p.volume.spec;
    try {
      const latest = Number(await rpc(spec.chain_id, 'eth_blockNumber', []));
      const getLogs = (a, b) => rpc(spec.chain_id, 'eth_getLogs', [{ address: spec.addresses, topics: [spec.topic0], fromBlock: '0x' + a.toString(16), toBlock: '0x' + b.toString(16) }]);
      const value = await compute(spec, latest, getLogs);
      doc.setIn(['volume', 'status'], 'evidenced');
      doc.setIn(['volume', 'value'], doc.createNode({ ...value, rpc: process.env[`RPC_${spec.chain_id}`] ? 'configured' : 'public default' }));
      doc.deleteIn(['volume', 'reason']);
      console.log(`${p.slug}: ${value.events} events in ${value.calls} calls`);
    } catch (e) {
      doc.setIn(['volume', 'status'], 'unknown');
      doc.setIn(['volume', 'reason'], `not computed on ${today}: ${e.message}`);
      doc.deleteIn(['volume', 'value']);
      console.error(`${p.slug}: ${e.message}`);
    }
    writeFileSync(file, doc.toString({ lineWidth: 0 }));
  }
}
