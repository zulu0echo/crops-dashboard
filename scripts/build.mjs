// Static site build: data/*.yaml + site/* -> dist/. No network, no client JS.
// All links are relative so the output works on GitHub Pages, IPFS, or file://.
// Every value from data/ is untrusted contributor input and goes through esc().
//
//   node scripts/build.mjs        (BUILD_DATE=YYYY-MM-DD to pin the staleness clock)
import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { loadData, rollup, cellStatus, isUnknown, availableIn } from './rollup.mjs';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
const today = process.env.BUILD_DATE ?? new Date().toISOString().slice(0, 10);
const config = JSON.parse(readFileSync('site/config.json', 'utf8'));
const { criteria, providers, regions } = loadData('data');
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
const autoChecked = allEvidence.filter((e) => e.check || (e.kind === 'repo' && /(^|\/)(LICEN[CS]E[^/]*|COPYING|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|foundry\.lock|go\.sum)$/i.test(e.path ?? ''))).length;
const allDates = providers.flatMap((p) => Object.values(p.scores).flatMap((c) => (c.evidence ?? []).map((e) => e.checked_at))).sort();
const byId = Object.fromEntries(criteria.criteria.map((c) => [c.id, c]));
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const NAV = [['index.html', 'Ratings'], ['compare/index.html', 'Compare'], ['countries/index.html', 'Countries'], ['methodology/index.html', 'Methodology'], ['criteria/index.html', 'Criteria'], ['contribute/index.html', 'Contribute']];

function page(path, title, body, { section = path } = {}) {
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
<div class="disclaimer" role="note"><div class="wrap"><strong>Unaudited, unvetted, experimental. Do not use as a reference.</strong> Ratings were produced with AI research agents, none has been reviewed by a human, and they may be incomplete or wrong. Nothing here is a statement of fact about any provider, an endorsement, a warning, or financial, legal, compliance or security advice. It does not represent the views of any organisation. <a href="${repo}#readme">Full disclaimer</a></div></div>
${config.seed_pending_review && pending ? `<div class="notice" role="note"><div class="wrap"><strong>Pending review.</strong> ${pending} of ${cells.length} ratings have not yet been re-checked by a human reviewer. Each rating shows its own review status. Do not rely on unreviewed ratings.</div></div>` : ''}
<main id="main" class="wrap">${body}</main>
<footer class="foot"><div class="wrap">
<div><h2>About</h2><p>An open, evidence-only assessment of payment rails against Censorship Resistance, Open Source and Free, Privacy, and Security. Every rating links to an artifact anyone can re-check.</p></div>
<div><h2>Data</h2><ul><li><a href="${up}data.json">Full dataset (JSON)</a></li><li><a href="${up}grid.csv">Ratings grid (CSV)</a></li><li><a href="${repo}">Source repository</a></li></ul></div>
<div><h2>This site</h2><ul><li>Dataset version ${esc(version)}</li><li>Built ${esc(today)}</li><li>MIT licensed</li><li>No analytics, cookies, or third-party requests</li></ul></div>
</div></footer>
</body></html>
`;
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

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

function evidenceList(ev, p) {
  return `<ol class="ev">${ev.map((e) => {
    const meta = [];
    if (e.address) {
      const cid = e.chain_id ?? e.caip2 ?? p.primary_chain?.chain_id ?? p.primary_chain?.caip2;
      meta.push(`<code>${esc(short(e.address))}</code>${links(cid, e.address)}`);
    }
    if (e.block_number !== undefined) meta.push(`block ${esc(e.block_number)}`);
    if (e.commit) meta.push(`commit <code>${esc(e.commit.slice(0, 10))}</code>`);
    meta.push(`checked ${esc(e.checked_at)}`);
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

const BASELINE_NOTE = 'Incumbent rails have no public chain settlement and no public code. They are scored with the same rubric as every other row. Their low ratings show the verifiability gap between rails whose behaviour can be inspected and rails whose behaviour must be trusted; that gap is the point of the comparison, not a claim that the incumbent is unsafe.';
const GROUPS = [['checkout', 'Checkout and invoicing'], ['card', 'Cards'], ['remittance', 'Remittance and wallets'], ['transfer', 'Transfers and privacy'], ['incumbent', 'Incumbent baseline']];
// Within a group: strongest weakest-pillar first, then most evidence, then name. Ordering only; there is no composite score.
const order = (a, b) => {
  const k = (p) => [Math.min(...criteria.pillars.map((pl) => rollups[p.slug][pl.id].score)), criteria.criteria.filter((c) => !isUnknown(p.scores[c.id])).length];
  const [x, y] = [k(a), k(b)];
  return y[0] - x[0] || y[1] - x[1] || a.name.localeCompare(b.name);
};
const grouped = GROUPS.map(([t, label]) => [t, label, providers.filter((p) => p.type === t).sort(order)]).filter(([, , list]) => list.length);
const evidenced = (p) => criteria.criteria.filter((c) => !isUnknown(p.scores[c.id])).length;
const reviewed = (p) => Object.values(p.scores).filter((c) => c.review?.status === 'reviewed').length;
const provHead = (p, up = '') => `<th scope="row" class="rowhead"><a class="pname" href="${up}provider/${esc(p.slug)}/index.html">${esc(p.name)}</a><span class="psub">${p.primary_chain ? esc(p.primary_chain.name) : 'Off-chain'}</span></th>`;
const filter = `<fieldset class="seg"><legend>Show</legend>
<input class="sr" type="radio" name="t" id="t-all" checked><label for="t-all">All</label>
${GROUPS.map(([t, label]) => `<input class="sr" type="radio" name="t" id="t-${t}"><label for="t-${t}">${label.split(' ')[0]}</label>`).join('')}
</fieldset>`;

// One table, rows grouped by type. `cellsFor(p)` returns the <td>s; `head` the column headers.
const groupedTable = (label, head, cellsFor, up = '') => `<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table class="overview">
<thead><tr><th scope="col" class="rowhead">Provider</th>${head}</tr></thead>
${grouped.map(([t, name, list]) => `<tbody data-type="${t}"><tr class="group-row"><th scope="rowgroup" colspan="99">${esc(name)} <span class="count">${list.length}</span>${t === 'incumbent' ? ` <a class="small" href="${up}index.html#baseline-note">About the baseline</a>` : ''}</th></tr>
${list.map((p) => `<tr>${provHead(p, up)}${cellsFor(p)}</tr>`).join('\n')}</tbody>`).join('\n')}
</table></div>`;

const overview = groupedTable('Ratings by pillar',
  criteria.pillars.map((pl) => `<th scope="col"><a href="compare/index.html#pillar-${pl.id}">${esc(pl.name)}</a></th>`).join('') + '<th scope="col">Evidence</th>',
  (p) => criteria.pillars.map((pl) => { const r = pillarOf(p, pl); return `<td><a class="cell-link" href="provider/${esc(p.slug)}/index.html#pillar-${pl.id}">${rating(r.score, r.unknown)}</a><span class="spread">Weakest: ${r.limiting.slice(0, 2).map((id) => esc(byId[id].short)).join('; ')}${r.limiting.length > 2 ? ` +${r.limiting.length - 2}` : ''}</span></td>`; }).join('')
    + `<td class="cov"><span class="covbar" style="--v:${Math.round((100 * evidenced(p)) / criteria.criteria.length)}%"></span><span class="spread">${evidenced(p)} of ${criteria.criteria.length} evidenced<br>${reviewed(p)} reviewed</span></td>`);

const legend = `<dl class="legend">${[3, 2, 1, 0].map((n) => `<div><dt>${rating(n)}</dt><dd>${MEANS[n]}</dd></div>`).join('')}<div><dt>${rating(0, true)}</dt><dd>Nobody has submitted checkable evidence yet. Counts as 0.</dd></div></dl>`;

page('index.html', 'Ratings', `
<section class="hero">
<p class="eyebrow">Evidence-only assessment</p>
<h1>Payment rails, rated on what can be verified</h1>
<p class="lede">${providers.length} payment rails rated on ${criteria.criteria.length} questions about who can block payments, whether the code is open and free to reuse, what leaks about users, and who can lose or lock up funds. Every rating rests on an onchain read or a file at a pinned commit, never on a vendor's word. Evidence as of ${esc(allDates.at(-1) ?? '—')}.</p>
</section>

<section class="howto" aria-labelledby="h-howto">
<h2 id="h-howto">How to read this</h2>
<ul class="rules">
<li><strong>A pillar is only as strong as its weakest criterion.</strong> One unchecked admin key is not averaged away. Each cell names the weakest criteria.</li>
<li><strong>"No evidence" counts as zero.</strong> The burden of proof is on the evidence, not on you. The Evidence column shows how much of each provider has been assessed.</li>
<li><strong>There is no overall score.</strong> Rows are grouped by type and ordered for scanning, not ranked. How to weigh the pillars is your call.</li>
<li><strong>This is not a full risk assessment.</strong> It does not rate regulation, safeguarding of funds, legal recourse, operational track record, liquidity or cost. <a href="methodology/index.html#scope">What is out of scope</a></li>
</ul>
${legend}
</section>

<section aria-labelledby="h-ratings">
<div class="section-head"><h2 id="h-ratings">Ratings by pillar</h2>${filter}</div>
<p class="small muted">Select a rating for the provider's findings and evidence, or <a href="compare/index.html">compare every criterion side by side</a>.</p>
${overview}
${providers.some((p) => p.type === 'incumbent') ? `<p class="callout" id="baseline-note"><strong>About the incumbent baseline.</strong> ${BASELINE_NOTE}</p>` : ''}
</section>`);

// ---- compare page: one table per pillar, providers x that pillar's criteria ----------------
page('compare/index.html', 'Compare', `
<header class="phead"><p class="eyebrow">Criterion by criterion</p><h1>Compare</h1>
<p class="lede">Every criterion for every provider, one table per pillar. The first column repeats the pillar rating; select any rating for the finding and evidence behind it.</p></header>
<nav class="pillar-nav" aria-label="Pillars">${criteria.pillars.map((pl) => `<a href="#pillar-${pl.id}">${esc(pl.name)}</a>`).join('')}</nav>
<div class="section-head">${legend.replace('class="legend"', 'class="legend compact"')}${filter}</div>
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

function countryTable(list, up) {
  if (!list.length) return '<p class="muted">None.</p>';
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Rails"><table class="overview">
<thead><tr><th scope="col" class="rowhead">Provider</th><th scope="col" class="avail">Availability source</th><th scope="col">Type</th>${criteria.pillars.map((pl) => `<th scope="col">${esc(pl.name)}</th>`).join('')}</tr></thead><tbody>
${list.map((p) => `<tr data-type="${esc(p.type)}">${provHead(p, up)}<td class="small avail">${p.availability ? `${esc(MODEL[p.availability.model])}${p.availability.note ? `<br><span class="muted">${esc(p.availability.note)}</span>` : ''}<br><a href="${up}provider/${esc(p.slug)}/index.html#availability">Evidence</a>` : '<span class="muted">No first-party statement found</span>'}</td><td>${typeChip(p.type)}</td>${criteria.pillars.map((pl) => { const r = pillarOf(p, pl); return `<td><a class="cell-link" href="${up}provider/${esc(p.slug)}/index.html#pillar-${pl.id}">${rating(r.score, r.unknown, 'sm')}</a></td>`; }).join('')}</tr>`).join('\n')}
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
<h2>Offered here <span class="count">${yes.length}</span></h2>${countryTable(yes, '../../')}
<h2>Not offered here <span class="count">${no.length}</span></h2>${countryTable(no, '../../')}
<h2>No evidence either way <span class="count">${unk.length}</span></h2><p class="muted small">The provider publishes no country list we could cite, or restricts by criteria other than country (for example sanctions screening of individuals).</p>${countryTable(unk, '../../')}
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

  const sections = criteria.pillars.map((pl) => {
    const r = pillarOf(p, pl);
    const rows = critsOf(pl).map((c) => {
      const cell = p.scores[c.id];
      const st = cellStatus(cell, today);
      const ev = cell?.evidence ?? [];
      const sets = r.limiting.includes(c.id);
      return `<article class="crit${sets ? ' limiting' : ''}" id="${esc(c.id)}">
<header class="crit-head"><div><h3><a href="../../criteria/${esc(c.id)}/index.html">${esc(c.short)}</a> ${derivedChip(c)}</h3><p class="crit-q">${esc(c.question)} <span class="cid">${esc(c.id)}</span></p></div>${cellRating(cell)}</header>
<p class="crit-tags">${sets ? '<span class="chip lim-chip">Sets the pillar rating</span>' : ''}${st.tier ? `<span>Best evidence: ${tierChip(st.tier)}</span>` : ''}${st.newest ? `<span>Checked ${esc(st.newest)}</span>` : ''}${flags(st)}</p>
<p class="crit-tags review">${reviewLine(cell)}</p>
${(cell?.evidence ?? []).some((e) => e.drift) ? '<p class="finding drift-note">The nightly re-check found that a recorded fact changed. This rating counts as unknown until a reviewer re-checks it.</p>' : ''}
${isUnknown(cell) && !(cell?.evidence ?? []).some((e) => e.drift) ? '<p class="finding muted">No checkable evidence settles this yet, so it counts as 0.</p>' : ''}
${cell?.finding ? `<p class="finding">${esc(cell.finding)}</p>` : ''}
${cell?.provider_response ? `<aside class="reply"><h4>Provider response</h4><p>${esc(cell.provider_response)}</p><p class="meta">Shown for context. It does not change the rating.</p></aside>` : ''}
${ev.length ? `<h4 class="ev-head">Evidence (${ev.length})</h4>${evidenceList(ev, p)}` : ''}
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
<h1>${esc(p.name)}</h1>
<p class="psub">${typeChip(p.type)}<span>${p.primary_chain ? `Assessed on ${esc(p.primary_chain.name)} (${p.primary_chain.chain_id ? `chain ${esc(p.primary_chain.chain_id)}` : esc(p.primary_chain.caip2)})` : 'No public chain settlement'}</span><a href="${href(p.website)}">${esc(new URL(p.website).hostname)}</a></p>
${p.primary_chain ? `<p class="muted small">Ratings apply to this deployment only. Treat them as unverified for other chains.${p.primary_chain.basis ? ` Why this deployment: ${esc(p.primary_chain.basis)}` : ''}</p>` : `<p class="callout">${BASELINE_NOTE}</p>`}
</header>
${p.context ? `<aside class="context" aria-labelledby="h-ctx-${esc(p.slug)}"><h2 id="h-ctx-${esc(p.slug)}">Outside this assessment</h2><p>${esc(p.context)}</p><p class="meta">Protections such as regulation, safeguarding and legal recourse are not CROPS properties and are not scored. They are shown because a risk assessment should weigh them.</p></aside>` : ''}
<section aria-labelledby="h-glance"><h2 id="h-glance">At a glance</h2>
${pillars}
<div class="glance-grid">${col('Holds up', holds, 'Nothing rated Partial or Strong.')}${col('Falls short', fails, 'Nothing rated Weak or Fails.')}${col('Not yet evidenced', unknown, 'Every criterion has evidence.')}</div>
</section>
${p.availability ? `<section id="availability" aria-labelledby="h-avail"><h2 id="h-avail">Where it is offered</h2>
<p>${esc(MODEL[p.availability.model])}.${regionsUsed(p.availability.countries ?? []).length ? ` Regions: ${regionsUsed(p.availability.countries).map(esc).join(', ')}.` : ''} <span class="meta">Checked ${esc(p.availability.checked_at)}. Not scored.</span></p>
${p.availability.note ? `<p class="finding">${esc(p.availability.note)}</p>` : ''}
${expand(p.availability.countries ?? []).length ? `<p class="small">${p.availability.model === 'blocklist' ? 'Excluded' : 'Listed'} countries (${expand(p.availability.countries).length}): ${expand(p.availability.countries).map((c) => `<a href="../../countries/${esc(c)}/index.html">${esc(countryName(c))}</a>`).join(', ')}</p>` : ''}
<h4 class="ev-head">Evidence (${p.availability.evidence.length})</h4>${evidenceList(p.availability.evidence, p)}</section>` : `<section id="availability"><h2>Where it is offered</h2><p class="muted">No first-party country statement is on file for this provider. See the <a href="../../countries/index.html">Countries</a> index.</p></section>`}
${sections}
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

writeFileSync(join(OUT, 'data.json'), JSON.stringify({ generated: today, criteria, providers: providers.map((p) => ({ ...p, rollup: rollups[p.slug] })) }, null, 2));
// CSV cells are quoted, and a leading = + - @ is neutralised so spreadsheets don't execute contributor text.
const csv = (v) => { const s = String(v ?? ''); return '"' + (/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"'; };
writeFileSync(join(OUT, 'grid.csv'), [
  ['slug', 'name', 'type', 'chain', ...criteria.pillars.flatMap((pl) => [pl.id, `${pl.id}_limiting`])].map(csv).join(','),
  ...providers.map((p) => [p.slug, p.name, p.type, p.primary_chain?.name ?? '', ...criteria.pillars.flatMap((pl) => [rollups[p.slug][pl.id].score, rollups[p.slug][pl.id].limiting.join(' ')])].map(csv).join(',')),
].join('\n') + '\n');

console.log(`built ${providers.length} providers, ${criteria.criteria.length} criteria into ${OUT}/ (staleness date ${today})`);
