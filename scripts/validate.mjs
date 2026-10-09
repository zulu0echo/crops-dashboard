// Validates provider files: JSON Schema, evidence rules (CONTRIBUTING.md), address
// checksums, chain_id consistency, and (unless --offline) URL resolution and commit
// existence. Contributor YAML is untrusted input; this is the trust boundary.
//
//   node scripts/validate.mjs [--offline] [files...]   default: every data/providers/*.yaml
//   node scripts/validate.mjs --self-check
// Exit 1 on any error. Errors read "<file> <criterion>: <rule>".
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { rpc } from './recheck.mjs';

// Lowercased visible text with tags, entities and whitespace collapsed, for quote matching.
const norm = (t) => String(t).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;|&#34;|&ldquo;|&rdquo;/g, '"').replace(/&#39;|&rsquo;|&lsquo;|[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();

const schema = JSON.parse(readFileSync('schema/provider.schema.json', 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
const criteria = parse(readFileSync('data/criteria.yaml', 'utf8'));
const checkCriteria = ajv.compile(JSON.parse(readFileSync('schema/criteria.schema.json', 'utf8')));
if (!checkCriteria(criteria)) {
  for (const e of checkCriteria.errors) console.error(`✗ data/criteria.yaml ${e.instancePath || '/'}: schema: ${e.message}`);
  process.exit(1);
}
for (const c of criteria.criteria) if (!criteria.pillars.some((p) => p.id === c.pillar)) { console.error(`✗ data/criteria.yaml ${c.id}: unknown pillar ${c.pillar}`); process.exit(1); }
const IDS = criteria.criteria.map((c) => c.id);
const validateSchema = ajv.compile(schema);

export function isChecksummed(addr) {
  if (!addr.startsWith('0x')) return true; // base58 (non-EVM) addresses carry no EIP-55 checksum
  const hex = addr.slice(2);
  if (hex === hex.toLowerCase()) return true; // all-lowercase carries no checksum; accepted
  const hash = Buffer.from(keccak_256(new TextEncoder().encode(hex.toLowerCase()))).toString('hex');
  return [...hex].every((ch, i) => (parseInt(hash[i], 16) >= 8 ? ch.toUpperCase() : ch.toLowerCase()) === ch);
}

// github.com/<owner>/<repo>/(blob|tree)/<commit>/<path...>
const GH = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/(?:blob|tree)\/([0-9a-f]{40})\/([^#?]*)/;

// Offline rules. Returns a list of error strings.
export function checkProvider(p, file) {
  const errs = [];
  const err = (where, msg) => errs.push(`${file} ${where}: ${msg}`);
  if (!validateSchema(p)) {
    for (const e of validateSchema.errors) {
      const where = e.instancePath.replace(/^\/scores\/(\w+)\/evidence\/(\d+)/, '$1 evidence[$2]').replace(/^\/scores\//, '') || '/';
      err(where, `schema: ${e.message}`);
    }
    return errs; // later rules assume the shape
  }
  if (basename(file) !== `${p.slug}.yaml`) err('slug', `must match file name (${p.slug}.yaml)`);

  for (const id of IDS) if (!(id in p.scores)) err(id, 'missing; every criterion must be scored or `unknown: true`');
  for (const id of Object.keys(p.scores)) if (!IDS.includes(id)) err(id, 'not a criterion in data/criteria.yaml');

  // EVM chains by numeric chain_id, others by CAIP-2 string.
  const chainOf = (x) => x?.chain_id ?? x?.caip2;
  const chainId = chainOf(p.primary_chain);
  if (p.type === 'incumbent') {
    if (p.primary_chain) err('primary_chain', 'incumbents have no primary_chain');
  } else {
    if (!p.primary_chain) err('primary_chain', `required for type ${p.type}`);
    if (!p.contracts.length && !p.repos.length) err('eligibility', 'needs at least one contract or repo; otherwise type: incumbent');
  }
  for (const c of p.contracts) {
    if (!isChecksummed(c.address)) err('contracts', `${c.address} fails EIP-55 checksum`);
    if (chainId && chainOf(c) !== chainId) err('contracts', `${c.address} chain ${chainOf(c)} != primary_chain ${chainId}`);
  }

  // Component inventory (red team R4): closed required components cap licensing and absence claims.
  const required = p.components.filter((c) => c.required);
  const closed = required.filter((c) => !c.public);
  const allPublic = closed.length === 0;
  const critById = Object.fromEntries(criteria.criteria.map((c) => [c.id, c]));

  for (const [id, cell] of Object.entries(p.scores)) {
    if (cell.review.status === 'reviewed' && /\bAI\b|agent/i.test(cell.review.by ?? '')) err(id, 'review.by must be a human reviewer');
    if (cell.unknown) continue;
    const ev = cell.evidence;
    const c = critById[id];
    if (!ev.length) err(id, 'score present but no evidence');
    // R1: only admissible evidence or a provider's own admission can hold a score down.
    if (!ev.some((e) => e.tier !== 'claimed' || e.by === 'provider'))
      err(id, 'third-party claims alone cannot set a score; add admissible evidence or mark the cell unknown (use `disputed` to flag the claim)');
    // R2: a reviewer must be able to reproduce any score of 2 or 3.
    if (cell.score >= 2 && !ev.some((e) => e.recheck)) err(id, `score ${cell.score} needs a \`recheck\` command on at least one evidence item`);
    if (cell.score >= 2) ev.forEach((e, i) => {
      if (e.kind === 'repo' && /\/blob\//.test(e.url) && !/(^|\/)(LICEN[CS]E|COPYING)/i.test(e.path ?? '') && !/#L\d+/.test(e.url))
        err(`${id} evidence[${i}]`, 'repo evidence behind a score of 2 or 3 needs a line range (#Lx-Ly) in the url');
    });
    // R3: a top score must rest on what actually runs.
    if (cell.score === 3 && c.provenance === 'contract' && !ev.some((e) => e.kind === 'onchain'))
      err(id, 'score 3 needs onchain evidence about the deployed contracts, not only source at a commit');
    if (cell.score === 3 && c.provenance === 'client' && !ev.some((e) => e.package || e.kind === 'trace'))
      err(id, 'score 3 needs evidence naming the distributed package (`package` with name, version, integrity) or a trace');
    // R4: closed required components.
    if (c.absence && cell.score === 3 && !allPublic && !ev.some((e) => e.kind === 'trace'))
      err(id, `score 3 claims an absence, but required components are closed (${closed.map((x) => x.name).join(', ')}); needs a trace or a lower score`);
    if (id === 'F1' && closed.length && cell.score > 0)
      err(id, `required components are closed (${closed.map((x) => x.name).join(', ')}), so F1 is 0: a closed component cannot be forked`);
    if (id === 'F1' && required.some((x) => x.license === 'source-available') && cell.score > 1)
      err(id, 'a required component is source-available, so F1 is at most 1');
    if (cell.score > 0 && !ev.some((e) => e.tier === 'verified' || e.tier === 'documented'))
      err(id, `score ${cell.score} needs verified or documented evidence (claimed caps at 0)`);
    if (cell.score > 1 && !ev.some((e) => e.tier === 'verified'))
      err(id, `score ${cell.score} needs verified evidence (documented caps at 1)`);
    ev.forEach((e, i) => {
      const at = `${id} evidence[${i}]`;
      if (e.kind === 'repo') {
        if (!e.commit || !e.path) err(at, 'kind repo requires commit (40-hex) and path');
        const m = e.url.match(GH);
        if (!m) err(at, 'repo url must be https://github.com/<owner>/<repo>/(blob|tree)/<commit>/<path>');
        else if (m[3] !== e.commit) err(at, `url commit ${m[3]} != commit ${e.commit}`);
        else if (e.path && !decodeURIComponent(m[4]).startsWith(e.path.replace(/\/$/, '')))
          err(at, `url path ${m[4]} does not match path ${e.path}`);
      }
      if (e.kind === 'onchain') {
        if (!e.address || e.block_number === undefined) err(at, 'kind onchain requires address and block_number');
        if (!chainOf(e) && !chainId) err(at, 'kind onchain needs chain_id or caip2 (provider has no primary_chain)');
        if (chainOf(e) && chainId && chainOf(e) !== chainId) err(at, `chain ${chainOf(e)} != primary_chain ${chainId} (rows score the flagship chain)`);
      }
      if (e.address && !isChecksummed(e.address)) err(at, `${e.address} fails EIP-55 checksum`);
      if (e.check && e.kind !== 'onchain') err(at, '`check` is only for onchain evidence');
      if (e.tier === 'verified' && !['onchain', 'repo'].includes(e.kind)) err(at, `kind ${e.kind} cannot be tier verified`);
    });
  }
  return errs;
}

// Network rules: every URL resolves; every pinned commit exists in its repo.
// ponytail: plain fetch with a small fixed pool and no retry. Flaky hosts fail CI;
// upgrade path is retry-with-backoff and a per-host allowlist of known-flaky docs sites.
export async function checkOnline(p, file) {
  const errs = [];
  const ev = Object.entries(p.scores).flatMap(([id, c]) => (c.evidence ?? []).map((e) => [id, e]));
  const headers = { 'user-agent': 'crops-dashboard-validator' };
  const ghHeaders = { ...headers, accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN && { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) };
  const seen = new Set();
  const tasks = [
    ...[p.website, ...p.repos.map((r) => r.url)].map((url) => ['provider', url, null]),
    ...ev.map(([id, e]) => [id, e.url.split('#')[0], null]), // the cited file/page resolves
    ...ev.filter(([, e]) => e.kind === 'repo').map(([id, e]) => [id, e.url.match(GH)?.slice(1, 4).join('/') ?? e.url, e]), // and the commit exists
  ].filter(([, key]) => !seen.has(key) && seen.add(key));
  const run = async ([where, key, repoEv]) => {
    const url = repoEv ? repoEv.url : key;
    try {
      if (repoEv) {
        const [, owner, repo, sha] = url.match(GH) ?? [];
        if (!owner) return; // reported offline
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, { headers: ghHeaders, signal: AbortSignal.timeout(15000) });
        if (r.status === 403 || r.status === 429) errs.push(`${file} ${where}: GitHub API rate limit, commit ${sha} not checked (set GITHUB_TOKEN)`);
        else if (r.status !== 200) errs.push(`${file} ${where}: commit ${sha} not found in ${owner}/${repo} (GitHub API ${r.status})`);
        return;
      }
      let r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers, signal: AbortSignal.timeout(15000) });
      if (r.status >= 400) r = await fetch(url, { redirect: 'follow', headers, signal: AbortSignal.timeout(15000) }); // many sites reject HEAD
      if (r.status >= 400) errs.push(`${file} ${where}: ${url} returned ${r.status}`);
    } catch (e) {
      errs.push(`${file} ${where}: ${url} did not resolve (${e.cause?.code ?? e.name})`);
    }
  };
  // R11: a documented item must still say what it was cited for (live page, or the committed archive).
  const quoteCheck = async ([id, e]) => {
    const want = norm(e.quote);
    let live = '';
    try { live = norm(await (await fetch(e.url, { redirect: 'follow', headers, signal: AbortSignal.timeout(20000) })).text()); } catch { /* fall through to archive */ }
    if (live.includes(want)) return;
    if (e.archive) {
      try { if (norm(readFileSync(e.archive, 'utf8')).includes(want)) return; } catch { errs.push(`${file} ${id}: archive ${e.archive} missing`); return; }
    }
    errs.push(`${file} ${id}: quote not found at ${e.url}${e.archive ? ' or in ' + e.archive : ''} (page changed, client-rendered, or blocked; commit an archive copy)`);
  };
  // R2: cited line ranges exist at the pinned commit.
  const lineCheck = async ([id, e]) => {
    const m = e.url.match(GH); const L = e.url.match(/#L(\d+)(?:-L(\d+))?$/);
    if (!m || !L || !/\/blob\//.test(e.url)) return;
    const r = await fetch(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`, { signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (!r?.ok) { errs.push(`${file} ${id}: could not read ${m[4]} at ${m[3].slice(0, 10)} to check lines`); return; }
    const n = (await r.text()).split('\n').length;
    if (+(L[2] ?? L[1]) > n) errs.push(`${file} ${id}: line ${L[2] ?? L[1]} cited but ${m[4]} has ${n} lines at that commit`);
  };
  // R2: an onchain item about a contract points at an address with code.
  const codeCheck = async ([id, e]) => {
    const cid = e.chain_id ?? p.primary_chain?.chain_id;
    // ponytail: code-exists check is EVM-only; non-EVM accounts (e.g. Solana programs) are not checked. Upgrade path: per-chain getAccountInfo.
    if (!cid || !e.address.startsWith('0x')) return;
    try {
      const code = await rpc(cid, 'eth_getCode', [e.address, 'latest']);
      if (!code || code === '0x') errs.push(`${file} ${id}: ${e.address} has no code on chain ${cid} (mark \`eoa: true\` if it is an account)`);
    } catch (err) { errs.push(`${file} ${id}: code check failed for ${e.address} (${err.message})`); }
  };
  const extra = [
    ...ev.filter(([, e]) => e.kind === 'document' && e.quote).map((x) => () => quoteCheck(x)),
    ...ev.filter(([, e]) => e.kind === 'repo').map((x) => () => lineCheck(x)),
    ...[...new Map(ev.filter(([, e]) => e.kind === 'onchain' && e.address && !e.eoa).map((x) => [x[1].address, x])).values()].map((x) => () => codeCheck(x)),
  ];
  for (let i = 0; i < extra.length; i += 8) await Promise.all(extra.slice(i, i + 8).map((f) => f()));
  for (let i = 0; i < tasks.length; i += 8) await Promise.all(tasks.slice(i, i + 8).map(run));
  return errs;
}

function selfCheck() {
  const ok = (cond, msg) => { if (!cond) throw new Error('validate self-check failed: ' + msg); };
  const sha = 'a'.repeat(40);
  const meta = { assessed_by: 'tester', review: { status: 'pending' } };
  const base = () => ({
    slug: 'x', name: 'X', type: 'checkout', website: 'https://x.org', notes: '',
    primary_chain: { name: 'Base', chain_id: 8453, basis: 'Default chain in the SDK config at the pinned commit.' },
    repos: [{ url: 'https://github.com/x/x', role: 'sdk', license: 'MIT' }], contracts: [],
    components: [{ name: 'SDK', role: 'sdk', public: true, license: 'MIT', operator: 'X', required: true }],
    scores: Object.fromEntries(IDS.map((id) => [id, { unknown: true, ...meta }])),
  });
  const repoEv = { tier: 'verified', kind: 'repo', url: `https://github.com/x/x/blob/${sha}/LICENSE`, commit: sha, path: 'LICENSE', detail: 'MIT', checked_at: '2026-10-07', recheck: 'gh api repos/x/x/license' };
  const docEv = { tier: 'documented', kind: 'document', url: 'https://x.org/tos', detail: 'd', checked_at: '2026-10-07', quote: 'we may suspend' };
  const errs = (p) => checkProvider(p, 'x.yaml');
  const has = (p, re) => errs(p).some((e) => re.test(e));
  const scored = (score, evidence) => ({ score, evidence, finding: 'f', ...meta });

  ok(errs(base()).length === 0, 'valid base rejected: ' + errs(base()));
  let p = base(); p.scores.F1 = scored(3, [repoEv]);
  ok(errs(p).length === 0, 'valid scored cell rejected: ' + errs(p));

  p = base(); p.scores.F1 = scored(1, []);
  ok(has(p, /F1: score present but no evidence/), 'score with no evidence accepted');
  p = base(); p.scores.F1 = scored(2, [docEv]);
  ok(has(p, /F1: score 2 needs verified/), 'score 2 with only documented accepted');
  p = base(); p.scores.F1 = scored(1, [{ tier: 'claimed', by: 'provider', kind: 'document', url: 'https://x.org/blog', detail: 'd', checked_at: '2026-10-07' }]);
  ok(has(p, /F1: score 1 needs verified or documented/), 'score 1 with only claimed accepted');
  p = base(); p.scores.F1 = scored(3, [{ ...repoEv, commit: 'deadbeef' }]);
  ok(has(p, /F1 evidence\[0\]\/commit: schema/), 'malformed commit accepted');
  p = base(); p.scores.F1 = scored(3, [{ ...repoEv, commit: 'b'.repeat(40) }]);
  ok(has(p, /url commit .* != commit/), 'commit not matching url accepted');
  p = base(); delete p.scores.S6;
  ok(has(p, /S6: missing/), 'missing criterion accepted');
  p = base(); p.contracts = [{ address: '0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed', chain_id: 8453, role: 'r', verified: 'none' }];
  ok(has(p, /fails EIP-55/), 'bad checksum accepted');
  ok(isChecksummed('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'), 'good checksum rejected');
  p = base(); p.type = 'incumbent';
  ok(has(p, /incumbents have no primary_chain/), 'incumbent with chain accepted');
  p = base(); p.repos = [];
  ok(has(p, /eligibility/), 'non-incumbent with no repo/contract accepted');
  p = base(); p.scores.F1 = { ...scored(3, [repoEv]), unknown: true };
  ok(has(p, /schema/), 'score + unknown accepted');
  // red-team rules
  p = base(); p.scores.C1 = scored(0, [{ tier: 'claimed', by: 'third_party', kind: 'document', url: 'https://news.org/x', detail: 'd', checked_at: '2026-10-07' }]);
  ok(has(p, /C1: third-party claims alone/), 'R1: third-party claim alone accepted as a 0');
  p = base(); p.scores.C1 = scored(0, [{ tier: 'claimed', by: 'provider', kind: 'document', url: 'https://x.org/blog', detail: 'd', checked_at: '2026-10-07' }]);
  ok(!has(p, /C1:/), 'R1: provider admission rejected as a 0');
  p = base(); { const r = { ...repoEv }; delete r.recheck; p.scores.F1 = scored(3, [r]); }
  ok(has(p, /F1: score 3 needs a `recheck`/), 'R2: score 3 without recheck accepted');
  p = base(); p.scores.O4 = scored(2, [{ ...repoEv, url: `https://github.com/x/x/blob/${sha}/abi.json`, path: 'abi.json' }]);
  ok(has(p, /needs a line range/), 'R2: score 2 repo evidence without line range accepted');
  p = base(); p.scores.S2 = scored(3, [{ ...repoEv, url: `https://github.com/x/x/blob/${sha}/A.sol#L1-L9`, path: 'A.sol' }]);
  ok(has(p, /S2: score 3 needs onchain evidence/), 'R3: contract score 3 from source only accepted');
  p = base(); p.scores.S3 = scored(3, [{ ...repoEv, url: `https://github.com/x/x/blob/${sha}/pay.ts#L1-L9`, path: 'pay.ts' }]);
  ok(has(p, /S3: score 3 needs evidence naming the distributed package/), 'R3: client score 3 without package accepted');
  p = base(); p.components.push({ name: 'API', role: 'api', public: false, license: 'proprietary', operator: 'X', required: true }); p.scores.F1 = scored(3, [repoEv]);
  ok(has(p, /F1: required components are closed \(API\)/), 'R4: F1 3 with a closed required component accepted');
  p = base(); p.components.push({ name: 'API', role: 'api', public: false, license: 'proprietary', operator: 'X', required: true });
  p.scores.P1 = scored(3, [{ ...repoEv, url: `https://github.com/x/x/blob/${sha}/package.json#L1-L9`, path: 'package.json', package: { name: 'x', version: '1.0.0', integrity: 'sha512-abc=' } }]);
  ok(has(p, /P1: score 3 claims an absence/), 'R4: absence score 3 with closed components accepted');
  p = base(); { const d = { ...docEv }; delete d.quote; p.scores.F1 = scored(0, [d]); }
  ok(has(p, /must have required property 'quote'/), 'R11: document without quote accepted');
  p = base(); delete p.primary_chain.basis;
  ok(has(p, /basis/), 'R5: unit of assessment without basis accepted');
  p = base(); p.scores.F1 = { ...scored(3, [repoEv]), review: { status: 'reviewed' } };
  ok(has(p, /schema/), 'R14: reviewed without reviewer accepted');
  p = base(); delete p.scores.F1.assessed_by;
  ok(has(p, /assessed_by/), 'R14: cell without assessed_by accepted');
  p = base(); p.primary_chain = { name: 'Solana', caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', basis: 'Only chain the card settles on, per its program repo.' };
  p.contracts = [{ address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', role: 'program', verified: 'none' }];
  ok(errs(p).length === 0, 'non-EVM provider rejected: ' + errs(p));
  console.log('validate self-check: ok');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes('--self-check')) { selfCheck(); process.exit(0); }
  const offline = args.includes('--offline');
  let files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) files = readdirSync('data/providers').filter((f) => f.endsWith('.yaml')).map((f) => join('data/providers', f));
  const errs = [];
  for (const file of files) {
    let p;
    try {
      p = parse(readFileSync(file, 'utf8'), { maxAliasCount: 0 });
    } catch (e) {
      errs.push(`${file}: YAML parse error: ${e.message}`);
      continue;
    }
    const local = checkProvider(p ?? {}, file);
    errs.push(...local);
    if (!offline && !local.length) errs.push(...(await checkOnline(p, file)));
  }
  for (const e of errs) console.error('✗ ' + e);
  console.log(`${files.length} file(s), ${errs.length} error(s)${offline ? ' (offline: URLs and commits not checked)' : ''}`);
  process.exit(errs.length ? 1 : 0);
}
