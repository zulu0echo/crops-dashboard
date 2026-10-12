// Static site build: data/*.yaml + site/* -> dist/. No network, no client JS.
// All links are relative so the output works on GitHub Pages, IPFS, or file://.
// Every value from data/ is untrusted contributor input and goes through esc().
//
//   node scripts/build.mjs        (BUILD_DATE=YYYY-MM-DD to pin the staleness clock)
import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { chainMark, providerMark } from './marks.mjs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { loadData, rollup, cellStatus, isUnknown, availableIn } from './rollup.mjs';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
const today = process.env.BUILD_DATE ?? new Date().toISOString().slice(0, 10);
const config = JSON.parse(readFileSync('site/config.json', 'utf8'));
const { criteria, providers, regions, operational, opsCriteria } = loadData('data');
const countryName = (() => { const dn = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'code' }); return (cc) => (cc === 'XK' ? 'Kosovo' : dn.of(cc)); })();
// Non-EVM explorers keyed by CAIP-2 namespace.
const EXPLORER_NS = { solana: 'https://solscan.io/account' };
const explorerFor = (chain, addr) => (typeof chain === 'number' ? (EXPLORER[chain] ? `${EXPLORER[chain]}/address/${addr}` : '') : (EXPLORER_NS[String(chain).split(':')[0]] ? `${EXPLORER_NS[String(chain).split(':')[0]]}/${addr}` : ''));
// Explorer link everywhere; Sourcify only for EVM chains.
const links = (chain, addr) => { const x = explorerFor(chain, addr); return (x ? ` <a href="${esc(x)}">explorer</a>` : '') + (typeof chain === 'number' ? ` · <a href="https://repo.sourcify.dev/${esc(chain)}/${esc(addr)}">Sourcify</a>` : ''); };
const EXPLORER = { 1: 'https://etherscan.io', 10: 'https://optimistic.etherscan.io', 100: 'https://gnosisscan.io', 137: 'https://polygonscan.com', 8453: 'https://basescan.org', 42161: 'https://arbiscan.io', 42220: 'https://celoscan.io', 534352: 'https://scrollscan.com', 43114: 'https://snowtrace.io', 59144: 'https://lineascan.build', 122: 'https://explorer.fuse.io', 999: 'https://hyperevmscan.io', 9745: 'https://plasmascan.to', 56: 'https://bscscan.com' };
const TIER = { verified: 'Verified', documented: 'Documented', claimed: 'Claimed' };
const TYPES = ['checkout', 'card', 'remittance'];
const pillarName = Object.fromEntries(criteria.pillars.map((p) => [p.id, p.name]));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const href = (u) => (/^https:\/\//.test(u ?? '') ? esc(u) : '#'); // schema already requires https; belt and braces
const repo = esc(config.repo_url);
const rollups = Object.fromEntries(providers.map((p) => [p.slug, rollup(p, criteria)]));
// Dataset version: the git commit the data was built from (R14), so a rating can be cited exactly.
const version = (() => { try { const v = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); const dirty = execSync('git status --porcelain data', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); return v + (dirty ? ' + uncommitted changes' : ''); } catch { return 'unversioned working copy'; } })();
const cells = providers.flatMap((p) => Object.values(p.scores));
const pending = cells.filter((c) => c.review?.status !== 'reviewed').length;
const allEvidence = cells.flatMap((c) => c.evidence ?? []);
// Items the weekly refresh can re-read: onchain reads with a check, pinned GitHub files, documents with a quote.
const autoChecked = allEvidence.filter((e) => !e.historical && ((e.kind === 'onchain' && e.check && typeof e.chain_id !== 'string') || (e.kind === 'repo' && /\/blob\/[0-9a-f]{40}\//.test(e.url)) || (e.kind === 'document' && e.quote))).length;
const allDates = providers.flatMap((p) => Object.values(p.scores).flatMap((c) => (c.evidence ?? []).map((e) => [e.checked_at, e.confirmed_at].filter(Boolean).sort().at(-1)))).sort();
const byId = Object.fromEntries(criteria.criteria.map((c) => [c.id, c]));
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const STATE = { evidenced: 'Evidenced', attested: 'Attested', unknown: 'Unknown', absent: 'Absent', not_applicable: 'Not applicable', not_observable: 'Not observable', not_verifiable: 'Not verifiable' };

const NAV = [['index.html', 'Ratings'], ['compare/index.html', 'Compare'], ['countries/index.html', 'Countries'], ['operational/index.html', 'Operational'], ['methodology/index.html', 'Methodology'], ['criteria/index.html', 'Criteria'], ['contribute/index.html', 'Contribute']];

// Provider pages: a sticky "On this page" bar built from the page's own h2 headings.
const JUMP_LABEL = { 'At a glance': 'Glance', 'Where it is offered': 'Availability', 'Outside this assessment': 'Context', 'Operational and procurement': 'Operational', 'Scope of assessment': 'Scope', 'Settlement token': 'Settlement', 'Censorship Resistance': 'Censorship' };
const withJumps = (body) => {
  const links = [...body.matchAll(/<h2 id="([^"]+)">([^<]+)/g)].map(([, id, text]) => `<a href="#${id}">${esc(JUMP_LABEL[text.trim()] ?? text.trim())}</a>`);
  return links.length < 3 ? body : body.replace('</header>', `</header>\n<nav class="jump" aria-label="On this page"><span class="jump-label">On this page</span>${links.join('')}</nav>`);
};
function page(path, title, body, { section = path } = {}) {
  if (path.startsWith('provider/')) body = withJumps(body);
  const up = '../'.repeat(path.split('/').length - 1);
  const nav = NAV.map(([p, label]) => `<a href="${up}${p}"${section.startsWith(p.split('/')[0]) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer"><meta name="color-scheme" content="light">
<title>${esc(title)} · ${esc(config.title)}</title><link rel="stylesheet" href="${up}style.css"></head>
<body><a class="skip" href="#main">Skip to content</a>
<header class="masthead"><div class="wrap">
<a class="brand" href="${up}index.html"><span class="mark" aria-hidden="true">CROPS</span><span>${esc(config.title)}</span></a>
<nav aria-label="Main">${nav}</nav></div></header>
<div class="disclaimer" role="note"><div class="wrap"><strong>Unaudited, unvetted, experimental. Do not use as a reference.</strong> AI-researched ratings that may be wrong; not advice or a statement of fact about any provider. <a href="${repo}#readme">Full disclaimer</a></div></div>
${config.seed_pending_review && pending ? `<div class="notice" role="note"><div class="wrap"><strong>Pending review.</strong> ${pending} of ${cells.length} ratings not yet checked by a human. Do not rely on unreviewed ratings.</div></div>` : ''}
<main id="main" class="wrap">${body}</main>
<footer class="foot"><div class="wrap">
<div><h2>About</h2><p>An open, evidence-only assessment of payment rails against Censorship Resistance, Open Source and Free, Privacy, and Security. Every rating links to an artifact anyone can re-check.</p></div>
<div><h2>Data</h2><ul><li><a href="${up}data.json">Full dataset (JSON)</a></li><li><a href="${up}grid.csv">Ratings grid (CSV)</a></li><li><a href="${up}operational.csv">Operational facts (CSV)</a></li><li><a href="${repo}">Source repository</a></li></ul></div>
<div><h2>This site</h2><ul><li>Dataset version ${esc(version)}</li><li>Built ${esc(today)}</li><li>MIT licensed</li><li>No analytics, cookies, or third-party requests</li></ul></div>
</div></footer>
<script src="${up}app.js" defer></script>
</body></html>
`;
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// Last edit per provider file by a person (the weekly bot only re-confirms sources), for the history line.
const BOTS = /^(crops-refresh-bot|crops-recheck-bot|github-actions)/;
const lastEdit = (() => {
  const out = {};
  try {
    const log = execSync("git log '--format=@%cs|%an' --name-only -- data/providers", { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString();
    let date = null, bot = false;
    for (const line of log.split('\n')) {
      if (line.startsWith('@')) { const [d, a] = line.slice(1).split('|'); date = d; bot = BOTS.test(a); continue; }
      const m = line.match(/^data\/providers\/([a-z0-9-]+)\.yaml$/);
      if (m && !bot && !out[m[1]]) out[m[1]] = date;
    }
  } catch { /* not a git checkout: no history line */ }
  return out;
})();

// Long free text: the first sentences, then the rest behind "Show more".
const longText = (t, limit = 420) => {
  if (t.length <= limit) return `<p>${esc(t)}</p>`;
  const cut = t.slice(0, limit).lastIndexOf('. ');
  const at = cut > 120 ? cut + 1 : limit;
  return `<p>${esc(t.slice(0, at))}</p><details class="more"><summary>Show more</summary><p>${esc(t.slice(at).trim())}</p></details>`;
};

// ---- shared fragments ---------------------------------------------------------
const tierChip = (t) => (t ? `<span class="chip tier-${t}">${TIER[t]}</span>` : '');
const flags = (st) => (st.stale ? '<span class="chip flag">Stale</span>' : '') + (st.drift ? '<span class="chip flag">Drift</span>' : '');
const typeChip = (t) => `<span class="chip type">${esc(t)}</span>`;

function evidenceLabel(e, p) {
  const m = e.url.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\//);
  if (m) return `${m[1]}${e.path ? ` · ${e.path}` : ''}`;
  if (e.address) return `${short(e.address)} on ${new URL(e.url).hostname}`;
  try { return new URL(e.url).hostname + new URL(e.url).pathname.replace(/\/$/, ''); } catch { return 'source'; }
}

// Strongest evidence first; a collapsible block with counts by tier (open when short).
const TIER_ORDER = { verified: 0, documented: 1, claimed: 2 };
const evidenceBlock = (ev, p) => {
  const n = (t) => ev.filter((e) => e.tier === t).length;
  const parts = ['verified', 'documented', 'claimed'].filter(n).map((t) => `${n(t)} ${TIER[t].toLowerCase()}`);
  return `<details class="evd"${ev.length <= 2 ? ' open' : ''}><summary><span class="ev-head">Evidence (${ev.length})</span><span class="ev-counts">${parts.join(' · ')}</span></summary>${evidenceList(ev, p)}</details>`;
};
// Age of a YYYY-MM-DD date relative to the build date, in words.
const ago = (d) => { const n = Math.round((Date.parse(today) - Date.parse(d)) / 864e5); return n <= 0 ? 'today' : n === 1 ? '1 day ago' : n < 60 ? `${n} days ago` : `${Math.round(n / 30)} months ago`; };
function evidenceList(ev, p) {
  return `<ol class="ev">${[...ev].sort((a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3)).map((e) => {
    const meta = [];
    if (e.address) {
      const cid = e.chain_id ?? e.caip2 ?? p.primary_chain?.chain_id ?? p.primary_chain?.caip2;
      meta.push(`<code>${esc(short(e.address))}</code>${links(cid, e.address)}`);
    }
    if (e.block_number !== undefined) meta.push(`block ${esc(e.block_number)}`);
    if (e.commit) meta.push(`commit <code>${esc(e.commit.slice(0, 10))}</code>`);
    meta.push(`checked ${esc(e.checked_at)}`);
    if (e.confirmed_at && e.confirmed_at > e.checked_at) meta.push(`source unchanged at weekly re-read ${esc(e.confirmed_at)}`);
    return `<li>${tierChip(e.tier)}${e.drift ? '<span class="chip flag">Drift</span>' : ''}<p>${esc(e.detail)}</p><p class="src"><a href="${href(e.url)}">${esc(evidenceLabel(e, p))}</a></p><p class="meta">${meta.join(' · ')}</p></li>`;
  }).join('')}</ol>`;
}

// ---- ratings ---------------------------------------------------------------------
const WORD = { 3: 'Strong', 2: 'Partial', 1: 'Weak', 0: 'Fails' };
const MEANS = { 3: 'Property fully held and verified from code or chain', 2: 'Held, with a bounded and disclosed compromise', 1: 'Weakly held, or supported by documents only', 0: 'Absent, only claimed, or disproven' };
// A rating in words. `n` is the number, the word carries the meaning, colour is never the only signal.
const rating = (score, unknown, cls = '') => (unknown
  ? `<span class="rating unk ${cls}"><b aria-hidden="true">?</b> No evidence</span>`
  : `<span class="rating s${score} ${cls}"><b>${score}</b> ${WORD[score]}</span>`);
const cellRating = (cell, cls) => ((cell?.evidence ?? []).some((e) => e.drift)
  ? `<span class="rating unk ${cls}"><b aria-hidden="true">!</b> Under review</span>`
  : rating(cell?.score, isUnknown(cell), cls));
const derivedChip = (c) => (c.derived_from ? `<span class="chip derived" title="Derived from ${esc(c.derived_from.join(', '))}">Derived</span>` : '');
const reviewLine = (cell) => (cell?.review?.status === 'reviewed'
  ? `<span class="chip reviewed">Reviewed</span><span>by ${esc(cell.review.by)}, ${esc(cell.review.date)}</span>`
  : '<span class="chip pending">Unreviewed</span>') + (cell?.assessed_by ? `<span>Assessed by ${esc(cell.assessed_by)}</span>` : '') + (cell?.disputed ? '<span class="chip flag">Disputed</span>' : '');
// Pillar spread (R8): the minimum alone hides how the rest of the pillar scores.
const spread = (p, pl) => { const cs = critsOf(pl).map((c) => p.scores[c.id]); const good = cs.filter((c) => !isUnknown(c) && c.score >= 2).length; const unk = cs.filter(isUnknown).length; return `${good} of ${cs.length} Partial or better${unk ? ` · ${unk} no evidence` : ''}`; };
// What would raise the pillar: the next anchor for each limiting criterion.
const nextStep = (p, pl) => { const r = rollups[p.slug][pl.id]; if (r.score >= 3) return ''; return `<div class="raise"><h3>What would raise this pillar</h3><ul>${r.limiting.map((id) => `<li><a href="#${esc(id)}">${esc(byId[id].short)}</a> reaching ${WORD[r.score + 1]}: ${esc(byId[id].anchors[String(r.score + 1)])}</li>`).join('')}</ul></div>`; };
const pillarOf = (p, pl) => { const r = rollups[p.slug][pl.id]; return { ...r, unknown: r.limiting.every((id) => isUnknown(p.scores[id])) }; };
const critsOf = (pl) => criteria.criteria.filter((c) => c.pillar === pl.id);

// Settlement token (context, never scored): what the balance is held in and debited from.
const TOKEN_CLASS = { stablecoin: 'Stablecoin', native: 'Native token', platform: 'Platform token', other: 'Other token' };
const BACKING = { fiat: 'fiat-backed', crypto: 'crypto-backed', synthetic: 'synthetic' };
const TOKEN_RISK = {
  'stablecoin:fiat': 'An issuer holds the reserves and can freeze balances at the token contract. Value depends on the issuer redeeming at par.',
  'stablecoin:crypto': 'Backed by onchain collateral. Value depends on collateral prices, liquidations and the governance that sets their parameters.',
  'stablecoin:synthetic': 'Held at par by a hedging strategy or market mechanism rather than reserves. It can trade below par under stress, for example when funding rates turn or a venue holding the hedge fails.',
  native: 'No issuer can freeze it, but its price moves between top-up, authorisation and settlement, so the amount debited is not known in advance.',
  platform: 'Issued by the provider or its own ecosystem. Its value and liquidity depend on that provider, which may also control supply.',
  other: 'A wrapped, liquid-staking or yield token. It carries the risks of the underlying asset plus those of the wrapper or protocol; see the note.',
};
const CONVERSION = { none: 'The card network is settled from the token directly.', at_spend: 'The token is sold for fiat when a payment is authorised.', at_top_up: 'The token is converted into a fiat balance at top-up; card spend comes from that fiat balance.', unknown: 'When the token is converted to fiat is not documented.' };
const tokenClass = (t) => (t.class === 'stablecoin' ? `${BACKING[t.backing]} stablecoin` : TOKEN_CLASS[t.class].toLowerCase());
const settleLine = (p) => (p.settlement ? `<span class="psub settle">Settles in ${(([d, rest]) => [...d, ...rest].slice(0, 3).map((t) => esc(t.symbol)).join(', ') + (d.length + rest.length > 3 ? ` +${d.length + rest.length - 3}` : ''))([p.settlement.tokens.filter((t) => t.default), p.settlement.tokens.filter((t) => !t.default)])} · ${[...new Set(p.settlement.tokens.map((t) => (t.class === 'stablecoin' ? 'stablecoin' : TOKEN_CLASS[t.class].toLowerCase())))].map(esc).join(', ')}</span>` : '');
const settlementSection = (p) => {
  const s = p.settlement;
  if (!s) return p.type === 'card' || /card/i.test(p.name) ? '<section id="settlement" aria-labelledby="h-settle"><h2 id="h-settle">Settlement token</h2><p class="muted">Not yet researched for this card.</p></section>' : '';
  const risks = [...new Set(s.tokens.map((t) => (t.class === 'stablecoin' ? `stablecoin:${t.backing}` : t.class)))];
  return `<section id="settlement" aria-labelledby="h-settle"><h2 id="h-settle">Settlement token</h2>
<p class="muted small">What the balance is held in and debited from. Shown as context; it does not change any rating.</p>
<div class="table-scroll"><table class="plain"><thead><tr><th scope="col">Token</th><th scope="col">Class</th><th scope="col">Issuer</th><th scope="col">Contract</th></tr></thead><tbody>${s.tokens.map((t) => `<tr><td><strong>${esc(t.symbol)}</strong>${t.default ? ' <span class="chip">Default</span>' : ''}</td><td>${esc(tokenClass(t))}</td><td>${esc(t.issuer ?? '')}</td><td>${t.address ? `<code>${esc(short(t.address))}</code>${links(t.chain_id ?? t.caip2 ?? p.primary_chain?.chain_id ?? p.primary_chain?.caip2, t.address)}` : ''}</td></tr>`).join('')}</tbody></table></div>
${s.conversion ? `<p><strong>Conversion.</strong> ${esc(CONVERSION[s.conversion])}</p>` : ''}
<ul class="risk-list">${risks.map((r) => `<li><strong>${esc(r.startsWith('stablecoin:') ? `${BACKING[r.split(':')[1]][0].toUpperCase()}${BACKING[r.split(':')[1]].slice(1)} stablecoin` : TOKEN_CLASS[r])}.</strong> ${esc(TOKEN_RISK[r])}${r === 'stablecoin:fiat' ? ' <a href="#h-C">Censorship Resistance</a> records whether that freeze power is disclosed.' : ''}</li>`).join('')}</ul>
${s.note ? `<p class="finding">${esc(s.note)}</p>` : ''}
<p class="meta small">Checked ${esc(s.checked_at)}</p>
${evidenceBlock(s.evidence, p)}</section>`;
};
const BASELINE_NOTE = 'Incumbent rails have no public chain settlement and no public code. They are scored with the same rubric as every other row. Their low ratings show the verifiability gap between rails whose behaviour can be inspected and rails whose behaviour must be trusted; that gap is the point of the comparison, not a claim that the incumbent is unsafe.';
const GROUPS = [['checkout', 'Checkout and invoicing'], ['card', 'Cards'], ['remittance', 'Remittance and wallets'], ['transfer', 'Protocols for privacy-preserving transfers', 'Privacy transfers'], ['incumbent', 'Incumbent baseline']];
// Within a group: alphabetical by chain, then by name. Off-chain rails (no primary chain) sort by name. Ordering only; there is no ranking.
const chainName = (p) => p.primary_chain?.name ?? '';
const order = (a, b) => chainName(a).localeCompare(chainName(b)) || a.name.localeCompare(b.name);
const grouped = GROUPS.map(([t, label]) => [t, label, providers.filter((p) => p.type === t).sort(order)]).filter(([, , list]) => list.length);
const evidenced = (p) => criteria.criteria.filter((c) => !isUnknown(p.scores[c.id])).length;
const reviewed = (p) => Object.values(p.scores).filter((c) => c.review?.status === 'reviewed').length;
const searchText = (p) => [p.name, p.slug, p.type, p.primary_chain?.name ?? 'off-chain', ...(p.settlement?.tokens ?? []).map((t) => t.symbol), (() => { try { return new URL(p.website).hostname; } catch { return ''; } })()].join(' ').toLowerCase();
const provHead = (p, up = '') => `<th scope="row" class="rowhead"><a class="pname" href="${up}provider/${esc(p.slug)}/index.html">${providerMark(p, up, esc)}<span>${esc(p.name)}</span></a><span class="psub">${chainMark(p.primary_chain)}${p.primary_chain ? esc(p.primary_chain.name) : 'Off-chain'}</span>${settleLine(p)}</th>`;
const filter = `<fieldset class="seg"><legend>Show</legend>
<input class="sr" type="radio" name="t" id="t-all" checked><label for="t-all">All</label>
${grouped.map(([t, label]) => { const short = GROUPS.find(([g]) => g === t)[2]; return `<input class="sr" type="radio" name="t" id="t-${t}"><label for="t-${t}">${esc(short ?? label.split(' ')[0])}</label>`; }).join('')}
</fieldset>`;

// One table, rows grouped by type. `cellsFor(p)` returns the <td>s; `head` the column headers.
const groupedTable = (label, head, cellsFor, up = '') => `<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table class="overview">
<thead><tr><th scope="col" class="rowhead">Provider</th>${head}</tr></thead>
${grouped.map(([t, name, list]) => `<tbody data-type="${t}"><tr class="group-row"><th scope="rowgroup" colspan="99">${esc(name)} <span class="count">${list.length}</span>${t === 'incumbent' ? ` <a class="small" href="${up}index.html#baseline-note">About the baseline</a>` : ''}</th></tr>
${list.map((p) => `<tr data-slug="${esc(p.slug)}" data-search="${esc(searchText(p))}">${provHead(p, up)}${cellsFor(p)}</tr>`).join('\n')}</tbody>`).join('\n')}
</table></div>`;

// CROPS tally: a count of criteria by outcome, the same split as the provider page's "At a glance". A count, not a weighted score.
const tally = (p) => { const cs = criteria.criteria.map((c) => p.scores[c.id]); const unk = cs.filter(isUnknown).length; const holds = cs.filter((c) => !isUnknown(c) && c.score >= 2).length; return { holds, short: cs.length - unk - holds, unk, total: cs.length }; };
const tallyCell = (p) => { const t = tally(p); const pct = (n) => `${((100 * n) / t.total).toFixed(2)}%`; return `<td class="tally" data-v="${t.holds}" data-label="CROPS tally"><a class="cell-link" href="provider/${esc(p.slug)}/index.html#h-glance"><span class="tally-num"><b>${t.holds}</b> of ${t.total} hold up</span><span class="tallybar" role="img" aria-label="${t.holds} hold up, ${t.short} fall short, ${t.unk} no evidence" style="--h:${pct(t.holds)};--s:${pct(t.short)}"></span><span class="spread">${t.short} fall short${t.unk ? ` · ${t.unk} no evidence` : ''}</span></a></td>`; };

// Freshness across rating cells, not across evidence items: one well-maintained quote should not make the whole site look fresh.
const cellDates = providers.flatMap((p) => criteria.criteria.map((c) => cellStatus(p.scores[c.id], today).newest)).filter(Boolean).sort();

const overview = groupedTable('Ratings by pillar',
  criteria.pillars.map((pl) => `<th scope="col"><a href="compare/index.html#pillar-${pl.id}">${esc(pl.name)}</a></th>`).join('') + '<th scope="col">CROPS tally<span class="cid">criteria held</span></th><th scope="col">Evidence</th>',
  (p) => criteria.pillars.map((pl) => { const r = pillarOf(p, pl); const weak = `Weakest: ${r.limiting.map((id) => byId[id].short).join('; ')}`; return `<td data-v="${r.unknown ? -1 : r.score}" data-label="${esc(pl.name)}"><a class="cell-link" href="provider/${esc(p.slug)}/index.html#pillar-${pl.id}" title="${esc(weak)}">${rating(r.score, r.unknown)}<span class="sr"> ${esc(weak)}</span></a></td>`; }).join('')
    + tallyCell(p)
    + `<td class="cov" data-v="${evidenced(p)}" data-label="Evidence"><span class="covbar" style="--v:${Math.round((100 * evidenced(p)) / criteria.criteria.length)}%"></span><span class="spread">${evidenced(p)} of ${criteria.criteria.length} evidenced<br>${reviewed(p)} reviewed</span></td>`);

const sortableOverview = overview
  .replace('<div class="table-scroll"', '<div class="table-scroll tall"')
  .replace('<table class="overview">', '<table class="overview sortable ratings">')
  .replace('<th scope="col" class="rowhead">Provider</th>', '<th scope="col" class="rowhead" data-sort="text">Provider</th>')
  .replace(/<th scope="col">(<a href="compare\/index.html#pillar-|CROPS tally|Evidence<)/g, '<th scope="col" data-sort="num">$1');
const searchBox = (placeholder) => `<div class="tools" data-js hidden><label class="sr" for="q">Search providers</label><input id="q" type="search" placeholder="${placeholder}" autocomplete="off" spellcheck="false"><span class="q-count small muted" aria-live="polite"></span></div>`;
const legend = `<dl class="legend">${[3, 2, 1, 0].map((n) => `<div><dt>${rating(n)}</dt><dd>${MEANS[n]}</dd></div>`).join('')}<div><dt>${rating(0, true)}</dt><dd>Nobody has submitted checkable evidence yet. Counts as 0.</dd></div></dl>`;

page('index.html', 'Ratings', `
<section class="hero">
<p class="eyebrow">Evidence-only assessment</p>
<h1>Payment rails, rated on what can be verified</h1>
<p class="lede">${providers.length} payment rails rated on ${criteria.criteria.length} questions about who can block payments, whether the code is open and free to reuse, what leaks about users, and who can lose or lock up funds. Every rating rests on an onchain read or a file at a pinned commit, never on a vendor's word. Each rating's newest evidence was checked or re-confirmed between ${esc(cellDates[0] ?? '—')} and ${esc(cellDates.at(-1) ?? '—')} (median ${esc(cellDates[Math.floor(cellDates.length / 2)] ?? '—')}).</p>
</section>

<section class="howto" aria-labelledby="h-howto">
<h2 id="h-howto">How to read this</h2>
<ul class="rules">
<li><strong>A pillar is only as strong as its weakest criterion.</strong> One unchecked admin key is not averaged away. Hover or focus a rating to see the weakest criteria; the provider page lists them.</li>
<li><strong>"No evidence" counts as zero.</strong> The burden of proof is on the evidence, not on you. The Evidence column shows how much of each provider has been assessed.</li>
<li><strong>The CROPS tally counts, it does not score.</strong> It shows how many of the ${criteria.criteria.length} criteria hold up (Partial or Strong), fall short (Weak or Fails) or have no evidence. Every criterion counts once, so a high tally can still hide a pillar that fails. Read it next to the pillar ratings. Rows are grouped by type and sorted by chain, then name. The order is not a ranking; how to weigh the pillars is your call.</li>
<li><strong>This is not a full risk assessment.</strong> It does not rate regulation, safeguarding of funds, legal recourse, operational track record, liquidity or cost. <a href="methodology/index.html#scope">What is out of scope</a></li>
</ul>
${legend}
</section>

<section aria-labelledby="h-ratings">
<div class="section-head"><h2 id="h-ratings">Ratings by pillar</h2>${filter}</div>
${searchBox('Search by name, chain or token')}
<p class="small muted">Select a rating for the provider's findings and evidence, or <a href="compare/index.html">compare every criterion side by side</a>. Select a column heading to sort within each group.</p>
${sortableOverview}
${providers.some((p) => p.type === 'incumbent') ? `<p class="callout" id="baseline-note"><strong>About the incumbent baseline.</strong> ${BASELINE_NOTE}</p>` : ''}
</section>`);

// ---- compare page: one table per pillar, providers x that pillar's criteria ----------------
page('compare/index.html', 'Compare', `
<header class="phead"><p class="eyebrow">Criterion by criterion</p><h1>Compare</h1>
<p class="lede">Every criterion for every provider, one table per pillar, or only the providers you choose. The first column repeats the pillar rating; select any rating for the finding and evidence behind it.</p></header>
<nav class="pillar-nav" aria-label="Pillars">${criteria.pillars.map((pl) => `<a href="#pillar-${pl.id}">${esc(pl.name)}</a>`).join('')}</nav>
<div class="section-head">${legend.replace('class="legend"', 'class="legend compact"')}${filter}</div>
<details class="picker" data-js hidden><summary>Choose providers to compare <span class="pick-n small muted"></span></summary>
<p class="small muted">Tick two or more. The tables below then show only those rows, and the address keeps the selection so you can share it.</p>
<div class="pick-list">${[...providers].sort((a, b) => a.name.localeCompare(b.name)).map((p) => `<label><input type="checkbox" name="pick" value="${esc(p.slug)}"> ${providerMark(p, '../', esc)}<span>${esc(p.name)}</span></label>`).join('')}</div>
<p><button type="button" class="pick-clear">Show all providers</button></p></details>
${criteria.pillars.map((pl) => `<section class="pillar" id="pillar-${pl.id}" aria-labelledby="hc-${pl.id}">
<header class="pillar-head"><div><h2 id="hc-${pl.id}">${esc(pl.name)}</h2><p>${esc(pl.question)}</p></div></header>
${groupedTable(`${pl.name} by criterion`,
  `<th scope="col" class="pcol">Pillar</th>` + critsOf(pl).map((c) => `<th scope="col"><a href="../criteria/${esc(c.id)}/index.html">${esc(c.short)}</a><span class="cid">${esc(c.id)}</span>${derivedChip(c)}</th>`).join(''),
  (p) => { const r = pillarOf(p, pl); return `<td class="pcol">${rating(r.score, r.unknown)}</td>` + critsOf(pl).map((c) => { const cell = p.scores[c.id]; const st = cellStatus(cell, today); const sets = rollups[p.slug][pl.id].limiting.includes(c.id); return `<td><a class="cell-link${sets ? ' sets' : ''}" href="../provider/${esc(p.slug)}/index.html#${esc(c.id)}">${cellRating(cell, 'sm')}${sets ? '<span class="sr"> (sets the pillar rating)</span>' : ''}${flags(st)}</a></td>`; }).join(''); }, '../')}
</section>`).join('\n')}
<p class="callout">Cells with a dark outline set the pillar rating. ${BASELINE_NOTE}</p>`, { section: 'compare' });

// ---- countries ------------------------------------------------------------------------
const COUNTRIES = [...regions.countries].sort((a, b) => countryName(a).localeCompare(countryName(b)));
const status = (p, cc) => availableIn(p, cc, regions.regions);
const MODEL = { global: 'Offered everywhere, per the provider\'s code or documents', allowlist: 'Offered only in the countries listed', blocklist: 'Offered everywhere except the countries listed' };
const expand = (codes) => codes.flatMap((c) => regions.regions[c] ? [] : [c]);
const regionsUsed = (codes) => codes.filter((c) => regions.regions[c]);

const cashoutIn = (op, cc) => { const co = op?.cashout; if (!co) return '<span class="state st-unknown">Unknown</span>'; if (co.status !== 'evidenced') return `<span class="state st-${esc(co.status)}">${esc(STATE[co.status])}</span>`; const hits = co.value.filter((x) => x.countries.some((c) => c === 'ALL' || c === cc || (regions.regions[c] ?? []).includes(cc))); return hits.length ? hits.map((x) => `${esc(x.method.replace('_', ' '))}${x.partner ? ` (${esc(x.partner)})` : ''}${x.fee ? `, ${esc(x.fee)}` : ''}`).join('; ') : '<span class="muted">none listed for this country</span>'; };
function countryTable(list, up, cc) {
  if (!list.length) return '<p class="muted">None.</p>';
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Rails"><table class="overview">
<thead><tr><th scope="col" class="rowhead">Provider</th><th scope="col" class="avail">Availability source</th><th scope="col">Cash-out here</th><th scope="col">Type</th>${criteria.pillars.map((pl) => `<th scope="col">${esc(pl.name)}</th>`).join('')}</tr></thead><tbody>
${list.map((p) => `<tr data-type="${esc(p.type)}">${provHead(p, up)}<td class="small avail">${p.availability ? `${esc(MODEL[p.availability.model])}${p.availability.note ? `<br><span class="muted">${esc(p.availability.note)}</span>` : ''}<br><a href="${up}provider/${esc(p.slug)}/index.html#availability">Evidence</a>` : '<span class="muted">No first-party statement found</span>'}</td><td class="small">${cashoutIn(operational[p.slug], cc)}</td><td>${typeChip(p.type)}</td>${criteria.pillars.map((pl) => { const r = pillarOf(p, pl); return `<td><a class="cell-link" href="${up}provider/${esc(p.slug)}/index.html#pillar-${pl.id}">${rating(r.score, r.unknown, 'sm')}</a></td>`; }).join('')}</tr>`).join('\n')}
</tbody></table></div>`;
}

for (const cc of COUNTRIES) {
  const yes = providers.filter((p) => status(p, cc) === 'yes');
  const no = providers.filter((p) => status(p, cc) === 'no');
  const unk = providers.filter((p) => status(p, cc) === 'unknown');
  page(`countries/${cc}/index.html`, countryName(cc), `
<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Countries</a> <span aria-hidden="true">/</span> ${esc(countryName(cc))}</nav>
<header class="phead"><p class="eyebrow">Availability · ${esc(cc)}</p><h1>${esc(countryName(cc))}</h1>
<p class="lede">Which of the ${providers.length} assessed rails say they are offered here, according to each provider's own terms, documents or code. Availability is recorded as evidence and never scored; a rail being offered says nothing about its ratings.</p></header>
<h2>Offered here <span class="count">${yes.length}</span></h2>${countryTable(yes, '../../', cc)}
<h2>Not offered here <span class="count">${no.length}</span></h2>${countryTable(no, '../../', cc)}
<h2>No evidence either way <span class="count">${unk.length}</span></h2><p class="muted small">The provider publishes no country list we could cite, or restricts by criteria other than country (for example sanctions screening of individuals).</p>${countryTable(unk, '../../', cc)}
<p class="callout">Country lists change without notice and sub-national limits (states, provinces) are recorded in the note, not in the list. Check the provider's current terms before relying on this.</p>`, { section: 'countries' });
}

const byLetter = {};
for (const cc of COUNTRIES) (byLetter[countryName(cc)[0].toUpperCase()] ??= []).push(cc);
page('countries/index.html', 'Countries', `
<header class="phead"><p class="eyebrow">Availability</p><h1>Countries</h1>
<p class="lede">Pick a country to see which rails say they are offered there, which say they are not, and which publish no country list. Counts show rails offered, out of ${providers.length}. Availability comes from each provider's own terms, documents or code; it is never scored.</p></header>
<p class="small muted">${providers.filter((p) => p.availability).length} of ${providers.length} rails have a first-party country statement on file.</p>
<nav class="pillar-nav" aria-label="Jump to letter">${Object.keys(byLetter).sort().map((l) => `<a href="#l-${l}">${l}</a>`).join('')}</nav>
${Object.keys(byLetter).sort().map((l) => `<section id="l-${l}"><h2>${l}</h2><ul class="clist countries">${byLetter[l].map((cc) => { const n = providers.filter((p) => status(p, cc) === 'yes').length; return `<li><a href="${esc(cc)}/index.html">${esc(countryName(cc))}</a> <span class="meta">${esc(cc)} · ${n} offered</span></li>`; }).join('')}</ul></section>`).join('')}`, { section: 'countries' });

// ---- operational layer (facts, never scored) -----------------------------------------------
const stateChip = (f) => { const st = f?.status ?? 'unknown'; const label = st === 'not_applicable' ? (f.burden === 'institution' ? 'N/A: falls to the institution' : 'N/A: no such service') : STATE[st]; return `<span class="state st-${st}">${esc(label)}</span>`; };
const operatorFree = (p) => !(p.components ?? []).some((c) => c.required && !c.public);
// A control's effective fact: recorded, or an implied not_applicable when the rail has no operator.
function effectiveFact(p, op, ctl) {
  const f = op?.facts?.[ctl.id];
  if (f) return f;
  if (ctl.applies === 'operator' && operatorFree(p)) return { status: 'not_applicable', burden: 'institution', reason: 'No required closed component: whoever runs the client, node or relayer holds this control.', implied: true };
  if (ctl.applies === 'custodial' && op?.custody_model?.status === 'evidenced' && op.custody_model.value === 'self_custody') return { status: 'not_applicable', burden: 'none', reason: 'Self-custody: the provider holds no customer funds or accounts.', implied: true };
  return { status: 'unknown', implied: true };
}
const factValue = (v) => (v === undefined || v === null ? '' : typeof v === 'string' || typeof v === 'number' ? esc(String(v)) : `<code>${esc(JSON.stringify(v)).slice(0, 300)}</code>`);
const refList = (refs, p) => (refs?.length ? `<p class="meta">Evidence shared with CROPS: ${refs.map((r) => `<a href="#${esc(r.criterion)}">${esc(r.criterion)} item ${r.index + 1}</a>`).join(', ')}</p>` : '');
const reviewLineOps = (f) => (f.assessed_by ? `<p class="crit-tags review">${f.review?.status === 'reviewed' ? `<span class="chip reviewed">Reviewed</span><span>by ${esc(f.review.by)}, ${esc(f.review.date)}</span>` : '<span class="chip pending">Unreviewed</span>'}<span>Assessed by ${esc(f.assessed_by)}</span>${f.checked_at ? `<span>Checked ${esc(f.checked_at)}</span>` : ''}</p>` : '');
const factBlock = (f, p) => `${f.note ? `<p class="finding">${esc(f.note)}</p>` : ''}${f.reason ? `<p class="muted small">${esc(f.reason)}</p>` : ''}${refList(f.refs, p)}${f.evidence?.length ? evidenceList(f.evidence, p) : ''}${reviewLineOps(f)}`;
const COUNTS = (p, op) => { const c = { evidenced: 0, attested: 0, absent: 0, not_applicable: 0, unknown: 0 }; for (const ctl of opsCriteria.controls) c[effectiveFact(p, op, ctl).status]++; return c; };
const repoSummary = (op) => { const ids = opsCriteria.controls.filter((c) => c.auto).map((c) => c.id); if (!op?.facts?.[ids[0]]) return ''; const all = ids.filter((id) => op.facts[id]?.value?.summary === 'all').length; const some = ids.filter((id) => op.facts[id]?.value?.summary === 'some').length; return `${all}${some ? ` (+${some} partial)` : ''} of ${ids.length}`; };
const volumeText = (op) => { const v = op?.volume; if (!v) return '<span class="state st-unknown">Unknown</span>'; if (v.status !== 'evidenced') return `<span class="state st-${esc(v.status)}">${esc(STATE[v.status] ?? v.status)}</span>`; const r = v.value.results.find((x) => x.sum_units) ?? v.value.results[0]; return `${r ? `${esc(r.sum_units ?? r.sum)} ${esc(r.symbol ?? '')}` : '0'} · ${esc(v.value.events)} events / ${esc(v.spec.window_days)}d`; };
const CUSTODY = { self_custody: 'Self-custody', provider_custodial: 'Provider-custodial', hybrid: 'Hybrid: self-custody with a provider-controlled spend path' };

function operationalSection(p, op) {
  const A = [];
  const art = (title, key, f, body) => A.push(`<article class="crit" id="op-${esc(key)}"><div class="crit-body"><header class="crit-head"><div><h3>${title}</h3></div>${stateChip(f)}</header>${body}${factBlock(f ?? {}, p)}</div></article>`);
  const fees = op?.fees;
  art('Fees', 'fees', fees, ['evidenced', 'attested'].includes(fees?.status) && Array.isArray(fees.value) ? `<div class="table-scroll" tabindex="0"><table class="plain"><thead><tr><th scope="col">Component</th><th scope="col">Paid by</th><th scope="col">Amount</th><th scope="col">Basis</th></tr></thead><tbody>${fees.value.map((x) => `<tr><td>${esc(x.kind)}</td><td>${esc(x.paid_by)}</td><td>${esc(x.amount)}</td><td class="small">${esc(x.basis ?? '')}</td></tr>`).join('')}</tbody></table></div>` : '');
  const cm = op?.custody_model;
  art('Custody model', 'custody_model', cm, cm?.status === 'evidenced' ? `<p><strong>${esc(CUSTODY[cm.value])}</strong></p>` : '');
  const lic = op?.licences;
  art('Licences and registrations', 'licences', lic, ['evidenced', 'attested'].includes(lic?.status) && Array.isArray(lic.value) ? `<div class="table-scroll" tabindex="0"><table class="plain"><thead><tr><th scope="col">Entity</th><th scope="col">Country</th><th scope="col">Regulator</th><th scope="col">Licence</th><th scope="col">Register</th></tr></thead><tbody>${lic.value.map((x) => `<tr><td>${esc(x.entity)}${x.holder === 'partner' ? ' <span class="chip">partner</span>' : ''}</td><td><a href="../../countries/${esc(x.country)}/index.html">${esc(countryName(x.country))}</a></td><td>${esc(x.regulator)}</td><td>${esc(x.type)}${x.number ? ` · ${esc(x.number)}` : ''}${x.activities ? `<br><span class="small muted">${esc(x.activities)}</span>` : ''}</td><td>${x.register_url ? `<a href="${href(x.register_url)}">register</a>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '');
  const co = op?.cashout;
  art('Cash-out options', 'cashout', co, ['evidenced', 'attested'].includes(co?.status) && Array.isArray(co.value) ? `<div class="table-scroll" tabindex="0"><table class="plain"><thead><tr><th scope="col">Where</th><th scope="col">Method</th><th scope="col">Partner</th><th scope="col">Fee</th><th scope="col">Limits</th></tr></thead><tbody>${co.value.map((x) => `<tr><td>${x.countries.map((c) => (c === 'ALL' ? 'everywhere offered' : regions.regions[c] ? esc(c) : `<a href="../../countries/${esc(c)}/index.html">${esc(countryName(c))}</a>`)).join(', ')}</td><td>${esc(x.method.replace('_', ' '))}</td><td>${esc(x.partner ?? '')}</td><td>${esc(x.fee ?? '')}</td><td class="small">${esc(x.limits ?? '')}</td></tr>`).join('')}</tbody></table></div>` : '');
  const m = op?.maturity ?? {};
  art('First deployment', 'first_deployment', m.first_deployment, m.first_deployment?.status === 'evidenced' ? `<p><strong>${esc(m.first_deployment.value.date)}</strong>${m.first_deployment.value.block ? ` (block ${esc(m.first_deployment.value.block)})` : ''}${m.first_deployment.value.what ? `: ${esc(m.first_deployment.value.what)}` : ''}</p>` : '');
  art('Operating entity', 'entity', m.entity, m.entity?.status === 'evidenced' ? `<p><strong>${esc(m.entity.value.legal_name)}</strong>, ${esc(m.entity.value.jurisdiction)}${m.entity.value.registration_number ? ` · ${esc(m.entity.value.registration_number)}` : ''}${m.entity.value.register_url ? ` · <a href="${href(m.entity.value.register_url)}">register</a>` : ''}</p>` : '');
  art('Security incidents', 'incidents', m.incidents, `${m.incidents?.status === 'evidenced' && m.incidents.value?.length ? `<ul class="plain-list">${m.incidents.value.map((x) => `<li>${esc(x.date)}: ${esc(x.summary)} <span class="chip${x.funds_lost === 'yes' ? ' flag' : ''}">funds lost: ${esc(x.funds_lost)}</span> <a href="${href(x.url)}">source</a></li>`).join('')}</ul>` : ''}<p class="muted small">Absence of a found incident is not evidence that none occurred.</p>`);
  art('Product changes affecting users', 'changes', m.changes, m.changes?.status === 'evidenced' && m.changes.value?.length ? `<ul class="plain-list">${m.changes.value.map((x) => `<li>${esc(x.date)}: ${esc(x.summary)} <a href="${href(x.url)}">source</a></li>`).join('')}</ul>` : '');
  const v = op?.volume;
  A.push(`<article class="crit" id="op-volume"><div class="crit-body"><header class="crit-head"><div><h3>Volume transacted (verified only)</h3></div><span class="state st-${esc(v?.status ?? 'unknown')}">${esc(STATE[v?.status ?? 'unknown'])}</span></header>
${v?.status === 'evidenced' ? `<p><strong>${volumeText(op)}</strong> <span class="meta">gross observed, blocks ${esc(v.value.from_block)} to ${esc(v.value.to_block)}, computed ${esc(v.value.computed_at)} over ${esc(v.value.calls ?? '?')} log queries (${esc(v.value.rpc ?? '')} RPC)</span></p>
<table class="plain"><thead><tr><th scope="col">Token</th><th scope="col">Events</th><th scope="col">Sum</th></tr></thead><tbody>${v.value.results.map((r) => `<tr><td><code>${esc(r.symbol ?? r.token)}</code></td><td>${esc(r.count)}</td><td>${esc(r.sum_units ?? r.sum)}</td></tr>`).join('')}</tbody></table>
<p class="small">Method: ${esc(v.spec.event ?? v.spec.topic0)} on ${v.spec.addresses.map((a) => `<code>${esc(short(a))}</code>`).join(', ')}, chain ${esc(v.spec.chain_id)}, ${esc(v.spec.window_days)}-day window.${v.spec.exclusions ? ` Exclusions: ${esc(v.spec.exclusions)}` : ''} Re-run: <code>node scripts/volumes.mjs ${esc(p.slug)}</code></p>` : ''}
${v?.reason ? `<p class="muted small">${esc(v.reason)}</p>` : ''}${v?.note ? `<p class="finding">${esc(v.note)}</p>` : ''}${reviewLineOps(v ?? {})}</div></article>`);

  const B = opsCriteria.groups.map((g) => `<tbody><tr class="group-row"><th scope="rowgroup" colspan="3">${esc(g.name)}</th></tr>${opsCriteria.controls.filter((c) => c.group === g.id).map((c) => { const f = effectiveFact(p, op, c); return `<tr id="op-${esc(c.id)}"><th scope="row"><span class="cid">${esc(c.id)}</span> ${esc(c.title)}<br><span class="small muted">${esc(c.question)}</span></th><td>${stateChip(f)}${f.implied ? '<br><span class="meta">implied from the component list</span>' : ''}</td><td class="small">${f.value?.summary ? `<strong>${esc(f.value.summary)}</strong> of ${f.value.repos.length} repo(s): ${f.value.repos.map((r) => `${esc(r.repo)} ${r.ok ? '✓' : '✗'} <span class="muted">${esc(r.detail)}</span>`).join('; ')}` : factValue(f.value)}${f.note ? `<br>${esc(f.note)}` : ''}${f.reason && !f.implied ? `<br><span class="muted">${esc(f.reason)}</span>` : ''}${f.evidence?.length ? `<br>${f.evidence.map((e, i) => `<a href="${href(e.url)}">source ${i + 1}</a>`).join(' · ')}` : ''}${f.refs?.length ? `<br>${f.refs.map((r) => `<a href="#${esc(r.criterion)}">CROPS ${esc(r.criterion)}</a>`).join(' · ')}` : ''}</td></tr>`; }).join('')}</tbody>`).join('');
  const c = COUNTS(p, op);
  return `<section class="operational" id="operational" aria-labelledby="h-ops">
<header class="pillar-head ops-head"><div><h2 id="h-ops">Operational and procurement</h2><p>Facts an institution's procurement, finance and security functions ask for. Separate from the CROPS ratings and never scored.</p></div></header>
<p class="small muted">Group A: operational facts. Group B: ${opsCriteria.controls.length} due-diligence controls derived from a UN agency's vendor requirements: ${c.evidenced} evidenced, ${c.attested} attested, ${c.absent} absent, ${c.not_applicable} not applicable, ${c.unknown} unknown. "Not applicable" means there is no operator to hold the control: it falls to whoever deploys the rail. <a href="../../methodology/index.html#operational">How to read this</a>.</p>
<h3 class="ops-sub">Group A: operational facts</h3>
${A.join('\n')}
<h3 class="ops-sub">Group B: institutional due diligence</h3>
<div class="table-scroll" tabindex="0" role="region" aria-label="Due diligence controls"><table class="overview ops"><thead><tr><th scope="col" class="rowhead">Control</th><th scope="col">State</th><th scope="col">What was found</th></tr></thead>${B}</table></div>
</section>`;
}

page('operational/index.html', 'Operational', `
<header class="phead"><p class="eyebrow">Second layer</p><h1>Operational and procurement facts</h1>
<p class="lede">What each rail costs, who holds the money and under which licence, how a payee cashes out, how long it has operated, what moved through it, and how far an institution's standard vendor due diligence would get. Facts with evidence, never scores, and never combined with the CROPS ratings.</p></header>
<div class="howto"><h2>How to read this</h2><ul class="rules">
<li><strong>Five states.</strong> <span class="state st-evidenced">Evidenced</span> a document or chain state anyone can re-check; <span class="state st-attested">Attested</span> the provider says it exists but it is available only under NDA; <span class="state st-absent">Absent</span> evidence that it does not exist; <span class="state st-not_applicable">N/A</span> there is no operator to hold the control, so it falls to whoever deploys the rail; <span class="state st-unknown">Unknown</span> nobody has looked.</li>
<li><strong>Volumes are verified only.</strong> A figure appears only when it was computed from public chain logs by a query you can re-run. Rails whose settlement cannot be observed say so.</li>
<li><strong>Operator-free rails show many "not applicable" cells.</strong> That is not a pass or a fail: an institution running the client itself holds those controls and should assess itself against them.</li>
</ul></div>
${groupedTable('Operational facts by provider',
  '<th scope="col">Custody</th><th scope="col">Licences</th><th scope="col">Cash-out</th><th scope="col">First deployment</th><th scope="col">Entity</th><th scope="col">Volume</th><th scope="col">Repo practice</th><th scope="col">Due diligence</th>',
  (p) => { const op = operational[p.slug]; const c = COUNTS(p, op); const cm = op?.custody_model; return `<td>${cm?.status === 'evidenced' ? esc(CUSTODY[cm.value].split(':')[0]) : stateChip(cm)}</td><td>${op?.licences?.status === 'evidenced' ? `${op.licences.value.length} in ${esc([...new Set(op.licences.value.map((x) => x.country))].join(', '))}` : stateChip(op?.licences)}</td><td>${op?.cashout?.status === 'evidenced' ? esc([...new Set(op.cashout.value.map((x) => x.method.replace('_', ' ')))].join(', ')) : stateChip(op?.cashout)}</td><td>${op?.maturity?.first_deployment?.status === 'evidenced' ? esc(op.maturity.first_deployment.value.date) : stateChip(op?.maturity?.first_deployment)}</td><td>${op?.maturity?.entity?.status === 'evidenced' ? esc(op.maturity.entity.value.legal_name) : stateChip(op?.maturity?.entity)}</td><td>${volumeText(op)}</td><td>${repoSummary(op) || '<span class="state st-unknown">Unknown</span>'}</td><td class="small dd"><a href="../provider/${esc(p.slug)}/index.html#operational">${c.evidenced} evidenced<br>${c.attested} attested · ${c.absent} absent<br>${c.not_applicable} n/a · ${c.unknown} unknown</a></td>`; }, '../')}
<p class="callout">Group B controls are derived from a UN humanitarian agency's vendor requirements (software development practices and Authority-to-Operate controls). They record the provider's position against each control; they are not a judgment that an institution must require it.</p>`, { section: 'operational' });

// ---- provider pages ---------------------------------------------------------------
for (const p of providers) {
  const cid = p.primary_chain?.chain_id;
  const item = (c) => `<li><a href="#${esc(c.id)}">${cellRating(p.scores[c.id], 'sm')}<span>${esc(c.short)}</span></a></li>`;
  const holds = criteria.criteria.filter((c) => !isUnknown(p.scores[c.id]) && p.scores[c.id].score >= 2);
  const fails = criteria.criteria.filter((c) => !isUnknown(p.scores[c.id]) && p.scores[c.id].score <= 1);
  const unknown = criteria.criteria.filter((c) => isUnknown(p.scores[c.id]));
  const col = (title, list, empty) => `<div><h3>${title} <span class="count">${list.length}</span></h3>${list.length ? `<ul class="glance">${list.map(item).join('')}</ul>` : `<p class="muted small">${empty}</p>`}</div>`;

  const pillars = `<ol class="summary">${criteria.pillars.map((pl) => {
    const r = pillarOf(p, pl);
    return `<li><a href="#pillar-${pl.id}"><span class="sum-name">${esc(pl.name)}</span>${rating(r.score, r.unknown, 'lg')}<span class="sum-lim">Weakest: ${r.limiting.map((id) => esc(byId[id].short)).join('; ')}</span></a></li>`;
  }).join('')}</ol>`;

  const tl = tally(p);
  const groupName = (GROUPS.find(([g]) => g === p.type) ?? [, p.type])[1];
  const facts = `<dl class="facts">
<div><dt>Category</dt><dd>${esc(groupName)}</dd></div>
<div><dt>Chain</dt><dd>${chainMark(p.primary_chain)}${p.primary_chain ? esc(p.primary_chain.name) : 'Off-chain'}</dd></div>
<div><dt>CROPS tally</dt><dd><a href="#h-glance-cols">${tl.holds} of ${tl.total} hold up</a>${tl.unk ? ` <span class="muted">· ${tl.unk} no evidence</span>` : ''}</dd></div>
${p.settlement ? `<div><dt>Settles in</dt><dd><a href="#h-settle">${p.settlement.tokens.slice(0, 3).map((t) => esc(t.symbol)).join(', ')}${p.settlement.tokens.length > 3 ? ` +${p.settlement.tokens.length - 3}` : ''}</a></dd></div>` : ''}
<div><dt>Offered</dt><dd>${p.availability ? `<a href="#h-avail">${esc({ global: 'Everywhere', allowlist: `${COUNTRIES.filter((cc) => status(p, cc) === 'yes').length} countries`, blocklist: `All but ${COUNTRIES.filter((cc) => status(p, cc) === 'no').length} countries` }[p.availability.model])}</a>` : '<span class="muted">Not on file</span>'}</dd></div>
<div><dt>Last edited</dt><dd>${lastEdit[p.slug] ? `${esc(lastEdit[p.slug])} · ` : ''}<a href="${repo}/commits/main/data/providers/${esc(p.slug)}.yaml">History</a></dd></div>
</dl>`;
  const sections = criteria.pillars.map((pl) => {
    const r = pillarOf(p, pl);
    const rows = critsOf(pl).map((c) => {
      const cell = p.scores[c.id];
      const st = cellStatus(cell, today);
      const ev = cell?.evidence ?? [];
      const sets = r.limiting.includes(c.id);
      return `<article class="crit${sets ? ' limiting' : ''}" id="${esc(c.id)}">
<header class="crit-head"><div><h3><a href="../../criteria/${esc(c.id)}/index.html">${esc(c.short)}</a> ${derivedChip(c)}</h3><p class="crit-q">${esc(c.question)} <span class="cid">${esc(c.id)}</span></p></div>${cellRating(cell)}</header>
<p class="crit-tags">${sets ? '<span class="chip lim-chip">Sets the pillar rating</span>' : ''}${st.tier ? `<span>Best evidence: ${tierChip(st.tier)}</span>` : ''}${st.newest ? `<span>Checked ${esc(st.newest)} <span class="age${st.stale ? ' old' : ''}">${ago(st.newest)}</span></span>` : ''}${flags(st)}</p>
<p class="crit-tags review">${reviewLine(cell)}</p>
${(cell?.evidence ?? []).some((e) => e.drift) ? '<p class="finding drift-note">The weekly re-check found that a recorded fact changed. This rating counts as unknown until a reviewer re-checks it.</p>' : ''}
${isUnknown(cell) && !(cell?.evidence ?? []).some((e) => e.drift) ? '<p class="finding muted">No checkable evidence settles this yet, so it counts as 0.</p>' : ''}
${cell?.finding ? `<p class="finding">${esc(cell.finding)}</p>` : ''}
${cell?.provider_response ? `<aside class="reply"><h4>Provider response</h4><p>${esc(cell.provider_response)}</p><p class="meta">Shown for context. It does not change the rating.</p></aside>` : ''}
${ev.length ? `${evidenceBlock(ev, p)}` : ''}
</article>`;
    }).join('\n');
    return `<section class="pillar" id="pillar-${pl.id}" aria-labelledby="h-${pl.id}">
<header class="pillar-head"><div><h2 id="h-${pl.id}">${esc(pl.name)}</h2><p>${esc(pl.question)}</p></div><p class="pillar-score">${rating(r.score, r.unknown, 'lg')}<span>Pillar rating: weakest of ${critsOf(pl).length}<br>${spread(p, pl)}</span></p></header>
${nextStep(p, pl)}
${rows}</section>`;
  }).join('\n');

  const contracts = p.contracts.length ? `<table class="plain"><thead><tr><th scope="col">Role</th><th scope="col">Address</th><th scope="col">Source verified</th></tr></thead><tbody>${p.contracts.map((c) => `<tr><td>${esc(c.role)}</td><td><code>${esc(short(c.address))}</code>${links(c.chain_id ?? c.caip2, c.address)}</td><td>${esc(c.verified)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">None listed.</p>';
  const repos = p.repos.length ? `<table class="plain"><thead><tr><th scope="col">Repository</th><th scope="col">Role</th><th scope="col">License</th></tr></thead><tbody>${p.repos.map((x) => `<tr><td><a href="${href(x.url)}">${esc(x.url.replace('https://github.com/', ''))}</a></td><td>${esc(x.role)}</td><td>${esc(x.license)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">None found. Absence of public code is itself a finding.</p>';

  page(`provider/${p.slug}/index.html`, p.name, `
<nav class="crumbs" aria-label="Breadcrumb"><a href="../../index.html">Ratings</a> <span aria-hidden="true">/</span> ${esc(p.name)}</nav>
<header class="phead">
<h1 class="ptitle">${providerMark(p, '../../', esc)}<span>${esc(p.name)}</span></h1>
<p class="psub">${typeChip(p.type)}<span>${chainMark(p.primary_chain)} ${p.primary_chain ? `Assessed on ${esc(p.primary_chain.name)} (${p.primary_chain.chain_id ? `chain ${esc(p.primary_chain.chain_id)}` : esc(p.primary_chain.caip2)})` : 'No public chain settlement'}</span><a href="${href(p.website)}">${esc(new URL(p.website).hostname)}</a></p>
${p.primary_chain ? `<p class="muted small">Ratings apply to this deployment only. Treat them as unverified for other chains.${p.primary_chain.basis ? ` Why this deployment: ${esc(p.primary_chain.basis)}` : ''}</p>` : `<p class="callout">${BASELINE_NOTE}</p>`}
</header>
${p.context ? `<aside class="context" aria-labelledby="h-ctx-${esc(p.slug)}"><h2 id="h-ctx-${esc(p.slug)}">Outside this assessment</h2>${longText(p.context)}<p class="meta">Protections such as regulation, safeguarding and legal recourse are not CROPS properties and are not scored. They are shown because a risk assessment should weigh them.</p></aside>` : ''}
<section aria-labelledby="h-glance"><h2 id="h-glance">At a glance</h2>
${facts}
${pillars}
<div class="glance-grid" id="h-glance-cols">${col('Holds up', holds, 'Nothing rated Partial or Strong.')}${col('Falls short', fails, 'Nothing rated Weak or Fails.')}${col('Not yet evidenced', unknown, 'Every criterion has evidence.')}</div>
</section>
${p.availability ? `<section id="availability" aria-labelledby="h-avail"><h2 id="h-avail">Where it is offered</h2>
<p>${esc(MODEL[p.availability.model])}.${regionsUsed(p.availability.countries ?? []).length ? ` Regions: ${regionsUsed(p.availability.countries).map(esc).join(', ')}.` : ''} <span class="meta">Checked ${esc(p.availability.checked_at)}. Not scored.</span></p>
${p.availability.note ? `<p class="finding">${esc(p.availability.note)}</p>` : ''}
${expand(p.availability.countries ?? []).length ? `<p class="small">${p.availability.model === 'blocklist' ? 'Excluded' : 'Listed'} countries (${expand(p.availability.countries).length}): ${expand(p.availability.countries).map((c) => `<a href="../../countries/${esc(c)}/index.html">${esc(countryName(c))}</a>`).join(', ')}</p>` : ''}
${evidenceBlock(p.availability.evidence, p)}</section>` : `<section id="availability"><h2>Where it is offered</h2><p class="muted">No first-party country statement is on file for this provider. See the <a href="../../countries/index.html">Countries</a> index.</p></section>`}
${settlementSection(p)}
${sections}
${operationalSection(p, operational[p.slug])}
<section class="scope" aria-labelledby="h-scope"><h2 id="h-scope">Scope of assessment</h2>
<h3>Components in the payment path</h3>
<div class="table-scroll" tabindex="0" role="region" aria-label="Components">${(p.components ?? []).length ? `<table class="plain"><thead><tr><th scope="col">Component</th><th scope="col">Role</th><th scope="col">Public</th><th scope="col">Licence</th><th scope="col">Operator</th><th scope="col">Required</th></tr></thead><tbody>${p.components.map((x) => `<tr><td>${x.repo ? `<a href="${href(x.repo)}">${esc(x.name)}</a>` : esc(x.name)}</td><td>${esc(x.role)}</td><td>${x.public ? 'Yes' : '<strong>No</strong>'}</td><td>${esc(x.license)}</td><td>${esc(x.operator)}</td><td>${x.required ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Not yet listed.</p>'}</div>
<div class="scope-grid"><div><h3>Repositories</h3><div class="table-scroll" tabindex="0" role="region" aria-label="Repositories">${repos}</div></div><div><h3>Contracts</h3><div class="table-scroll" tabindex="0" role="region" aria-label="Contracts">${contracts}</div></div></div>
${p.notes ? `<h3>Assessor notes</h3><p class="notes">${esc(p.notes)}</p>` : ''}
</section>`, { section: 'index.html' });
}

// ---- criteria pages -----------------------------------------------------------------
const criteriaIndex = criteria.pillars.map((pl) => `<section class="pillar" id="pillar-${pl.id}"><header class="pillar-head"><h2>${esc(pl.name)}</h2><p>${esc(pl.question)}</p></header>
<ul class="clist">${criteria.criteria.filter((c) => c.pillar === pl.id).map((c) => `<li><a href="${esc(c.id)}/index.html"><span class="cid">${esc(c.id)}</span>${esc(c.short)}</a><p>${esc(c.question)}</p></li>`).join('')}</ul></section>`).join('');
page('criteria/index.html', 'Criteria', `<header class="phead"><p class="eyebrow">Rubric</p><h1>Criteria</h1><p class="lede">${criteria.criteria.length} criteria across ${criteria.pillars.length} pillars. Each sets out the question, what earns each score, and which artifacts count as evidence.</p></header>${criteriaIndex}`);

for (const c of criteria.criteria) {
  const scored = providers.map((p) => `<tr><th scope="row"><a href="../../provider/${esc(p.slug)}/index.html#${esc(c.id)}">${esc(p.name)}</a></th><td>${cellRating(p.scores[c.id], 'sm')}</td><td>${p.scores[c.id]?.finding ? esc(p.scores[c.id].finding) : '<span class="muted">No admissible evidence yet.</span>'}</td></tr>`).join('');
  page(`criteria/${c.id}/index.html`, `${c.id} ${c.title}`, `
<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Criteria</a> <span aria-hidden="true">/</span> <a href="../index.html#pillar-${esc(c.pillar)}">${esc(pillarName[c.pillar])}</a> <span aria-hidden="true">/</span> ${esc(c.id)}</nav>
<header class="phead"><p class="eyebrow">${esc(pillarName[c.pillar])} · ${esc(c.id)}</p><h1>${esc(c.title)}</h1><p class="lede">${esc(c.question)}</p></header>
<div class="prose"><h2>Why it matters</h2><p>${esc(c.why_it_matters)}</p>
${c.provenance === 'contract' ? '<p class="callout">A score of 3 needs onchain evidence about the deployed contracts, not only source code at a commit.</p>' : ''}
${c.provenance === 'client' ? '<p class="callout">A score of 3 needs evidence naming the distributed package (name, version and integrity hash) or a network trace, not only source code in a repository.</p>' : ''}
${c.absence ? '<p class="callout">The top score rewards the absence of a problem. It is only available when every required component in the request path is public, or a network trace covers the closed parts.</p>' : ''}
${c.derived_from ? `<p class="callout">Derived from ${c.derived_from.map((d) => `<a href="../${esc(d)}/index.html">${esc(byId[d].short)}</a>`).join(', ')}. It repeats facts scored there and is kept in the Security minimum because it is the question institutions ask first.</p>` : ''}</div>
<h2>Scoring anchors</h2>
<table class="plain anchors"><tbody>${['3', '2', '1', '0'].map((k) => `<tr><th scope="row">${rating(+k, false, 'sm')}</th><td>${esc(c.anchors[k])}</td></tr>`).join('')}<tr><th scope="row">${rating(0, true, 'sm')}</th><td>No admissible evidence submitted yet. Counts as 0 in the pillar.</td></tr></tbody></table>
<div class="two"><div><h2>Admissible evidence</h2><ul class="plain-list">${c.verify_with.map((v) => `<li>${esc(v.artifact)} <span class="chip tier-${esc(v.tier.split(' ')[0])}">${esc(v.tier)}</span></li>`).join('')}</ul></div>
<div><h2>Common failures</h2><ul class="plain-list">${c.common_failures.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div></div>
<h2>Current ratings</h2>
<div class="table-scroll" tabindex="0" role="region" aria-label="Current ratings for ${esc(c.id)}"><table class="plain"><thead><tr><th scope="col">Provider</th><th scope="col">Score</th><th scope="col">Finding</th></tr></thead><tbody>${scored}</tbody></table></div>`, { section: 'criteria' });
}

// ---- static pages and exports -----------------------------------------------------------
const perPillar = criteria.pillars.map((pl) => `${pl.name} ${critsOf(pl).length}`).join(', ');
page('methodology/index.html', 'Methodology', `<div class="prose">${readFileSync('site/methodology.html', 'utf8')
  .replaceAll('%AUTO_CHECKED%', String(autoChecked)).replaceAll('%EVIDENCE_TOTAL%', String(allEvidence.length))
  .replaceAll('%AUTO_PCT%', allEvidence.length ? String(Math.round((100 * autoChecked) / allEvidence.length)) : '0')
  .replaceAll('%PER_PILLAR%', esc(perPillar)).replaceAll('%PENDING%', String(pending)).replaceAll('%CELLS%', String(cells.length))}</div>`, { section: 'methodology' });
page('contribute/index.html', 'Contribute', `<div class="prose">${readFileSync('site/contribute.html', 'utf8').replaceAll('%REPO%', repo)}</div>`, { section: 'contribute' });
copyFileSync('site/style.css', join(OUT, 'style.css'));
copyFileSync('site/app.js', join(OUT, 'app.js'));
if (existsSync('site/logos')) { mkdirSync(join(OUT, 'logos'), { recursive: true }); for (const f of readdirSync('site/logos')) if (/\.(svg|png|webp)$/.test(f)) copyFileSync(join('site/logos', f), join(OUT, 'logos', f)); }

writeFileSync(join(OUT, 'data.json'), JSON.stringify({ generated: today, criteria, providers: providers.map((p) => ({ ...p, rollup: rollups[p.slug], tally: tally(p) })), operational_criteria: opsCriteria, operational }, null, 2));
// CSV cells are quoted, and a leading = + - @ is neutralised so spreadsheets don't execute contributor text.
const csv = (v) => { const s = String(v ?? ''); return '"' + (/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"'; };
writeFileSync(join(OUT, 'grid.csv'), [
  ['slug', 'name', 'type', 'chain', ...criteria.pillars.flatMap((pl) => [pl.id, `${pl.id}_limiting`]), 'holds_up', 'falls_short', 'no_evidence', 'settlement_tokens', 'settlement_classes'].map(csv).join(','),
  ...providers.map((p) => [p.slug, p.name, p.type, p.primary_chain?.name ?? '', ...criteria.pillars.flatMap((pl) => [rollups[p.slug][pl.id].score, rollups[p.slug][pl.id].limiting.join(' ')]), ...(({ holds, short, unk }) => [holds, short, unk])(tally(p)), (p.settlement?.tokens ?? []).map((t) => t.symbol).join(' '), (p.settlement?.tokens ?? []).map((t) => (t.class === 'stablecoin' ? `stablecoin-${t.backing}` : t.class)).join(' ')].map(csv).join(',')),
].join('\n') + '\n');

writeFileSync(join(OUT, 'operational.csv'), [['slug', 'custody_model', 'licences', 'cashout_methods', 'first_deployment', 'entity', 'volume_status', 'volume_events', ...opsCriteria.controls.map((c) => c.id)].map(csv).join(','), ...providers.map((p) => { const op = operational[p.slug]; return [p.slug, op?.custody_model?.status === 'evidenced' ? op.custody_model.value : (op?.custody_model?.status ?? 'unknown'), op?.licences?.value?.length ?? '', (op?.cashout?.value ?? []).map((x) => x.method).join(' '), op?.maturity?.first_deployment?.value?.date ?? '', op?.maturity?.entity?.value?.legal_name ?? '', op?.volume?.status ?? 'unknown', op?.volume?.value?.events ?? '', ...opsCriteria.controls.map((c) => effectiveFact(p, op, c).status)].map(csv).join(','); })].join('\n') + '\n');
console.log(`built ${providers.length} providers, ${criteria.criteria.length} criteria into ${OUT}/ (staleness date ${today})`);
