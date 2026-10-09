// Fills the automatable group B controls (B2.1, B2.3, B8.2, B9.1-B9.8) from each provider's
// public GitHub repositories, into data/operational/<slug>.yaml. Never touches a fact a human
// assessed (assessed_by not equal to BOT). Evidence is the GitHub API URL read, which anyone can
// re-read, so it is tier verified / kind api.
//
//   GITHUB_TOKEN=... node scripts/repo-facts.mjs [slug...]      default: every provider with GitHub repos
//   node scripts/repo-facts.mjs --self-check
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
import { loadData } from './rollup.mjs';

export const BOT = 'repo-facts bot (scripts/repo-facts.mjs)';
const today = new Date().toISOString().slice(0, 10);
// Accepts repo roots and /tree/<ref>/<path> monorepo links; the facts are read at repo level.
const GH = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/tree\/[^\s]*)?\/?$/;

// One check = (control id, function(repo facts) -> { ok: boolean, detail }).
// `r` is the raw material gathered once per repo by gather().
export const CHECKS = {
  'B2.1': (r) => has(r.files, /^(\.github\/)?SECURITY\.md$|^\.well-known\/security\.txt$|^docs\/SECURITY\.md$/i, 'security policy file'),
  'B2.3': (r) => ({ ok: !!r.files.find((f) => /^\.github\/dependabot\.ya?ml$/.test(f)) || /codeql|dependabot|snyk|trivy|npm audit|cargo audit|slither|semgrep|renovate/i.test(r.workflows), detail: r.files.find((f) => /dependabot/.test(f)) ? 'dependabot config present' : (/codeql|snyk|trivy|audit|slither|semgrep|renovate/i.test(r.workflows) ? 'scanning step in a workflow' : 'no scanning config or workflow step found') }),
  'B8.2': (r) => has(r.files, /(^|\/)(Dockerfile|docker-compose\.ya?ml|compose\.ya?ml|.*\.tf|Chart\.yaml|helm\/|charts\/|k8s\/|kubernetes\/)/i, 'deployment configuration'),
  'B9.1': (r) => ({ ok: r.rules.some((x) => ['pull_request', 'required_status_checks'].includes(x.type)), detail: r.rules.length ? 'rules: ' + r.rules.map((x) => x.type).join(', ') : 'no branch rules visible (classic branch protection is not readable without push access)' }),
  'B9.2': (r) => ({ ok: /\bpull_request(_target)?\b/.test(r.workflows), detail: r.workflowFiles.length ? `${r.workflowFiles.length} workflow file(s)` : 'no .github/workflows' }),
  'B9.3': (r) => ({ ok: /(npm|pnpm|yarn|bun)\s+(run\s+)?test|pytest|cargo test|forge test|go test|hardhat test|vitest|jest|mocha|anchor test|make test/i.test(r.workflows), detail: 'test command in a workflow' }),
  'B9.4': (r) => ({ ok: /codecov|coveralls|--coverage|lcov|forge coverage|coverage/i.test(r.workflows) || has(r.files, /codecov\.ya?ml|\.coveragerc|\.nycrc/i).ok, detail: 'coverage tooling referenced' }),
  'B9.5': (r) => ({ ok: r.tags.some((t) => /^v?\d+\.\d+\.\d+/.test(t)), detail: r.tags.length ? `latest tags: ${r.tags.slice(0, 3).join(', ')}` : 'no tags' }),
  'B9.6': (r) => ({ ok: r.commits.length > 0 && r.commits.filter((c) => c.verified).length * 2 >= r.commits.length, detail: `${r.commits.filter((c) => c.verified).length} of ${r.commits.length} recent commits signed` }),
  'B9.7': (r) => ({ ok: has(r.files, /^CHANGELOG|^HISTORY\.md$|^CHANGES\.md$/i).ok || r.releasesWithNotes > 0, detail: has(r.files, /^CHANGELOG/i).ok ? 'CHANGELOG file' : (r.releasesWithNotes ? `${r.releasesWithNotes} release(s) with notes` : 'no changelog or release notes') }),
  'B9.8': (r) => ({ ok: has(r.files, /^(\.github\/)?CONTRIBUTING(\.md)?$|^docs\/CONTRIBUTING\.md$/i).ok || /contribut/i.test(r.readme), detail: has(r.files, /CONTRIBUTING/i).ok ? 'CONTRIBUTING file' : (/contribut/i.test(r.readme) ? 'contribution section in README' : 'none found') }),
};
const has = (files, re, what = '') => { const f = files.find((x) => re.test(x)); return { ok: !!f, detail: f ? `${what || 'match'}: ${f}` : `no ${what || 'match'}` }; };

const headers = { accept: 'application/vnd.github+json', 'user-agent': 'crops-dashboard-repo-facts', ...(process.env.GITHUB_TOKEN && { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) };
async function api(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(20000) });
  if (r.status === 404) return null;
  if (r.status === 403 || r.status === 429) throw new Error(`GitHub API rate limit at ${path} (set GITHUB_TOKEN)`);
  if (!r.ok) throw new Error(`GitHub API ${r.status} at ${path}`);
  return r.json();
}
const raw = async (o, r, ref, path) => { const x = await fetch(`https://raw.githubusercontent.com/${o}/${r}/${ref}/${path}`, { signal: AbortSignal.timeout(20000) }); return x.ok ? x.text() : ''; };

// Gather the raw material for one repo. ponytail: reads the root listing plus .github and
// .well-known only, and the first 20 tags/10 commits/10 releases; deep trees are not walked.
// Upgrade path: the git/trees?recursive=1 endpoint for repos under the 100k-entry limit.
export async function gather(owner, repo) {
  const meta = await api(`/repos/${owner}/${repo}`);
  if (!meta) return null;
  const branch = meta.default_branch;
  const list = async (p) => ((await api(`/repos/${owner}/${repo}/contents/${p}?ref=${branch}`)) ?? []).map((e) => (e.type === 'dir' ? e.path + '/' : e.path));
  const files = [...(await list('')), ...(await list('.github')), ...(await list('.github/workflows')), ...(await list('.well-known')), ...(await list('docs')).filter((f) => /SECURITY|CONTRIBUTING/i.test(f))];
  const workflowFiles = files.filter((f) => /^\.github\/workflows\/.*\.ya?ml$/.test(f));
  const workflows = (await Promise.all(workflowFiles.slice(0, 15).map((f) => raw(owner, repo, branch, f)))).join('\n');
  const readme = await raw(owner, repo, branch, 'README.md');
  const rules = (await api(`/repos/${owner}/${repo}/rules/branches/${encodeURIComponent(branch)}`)) ?? [];
  const tags = ((await api(`/repos/${owner}/${repo}/tags?per_page=20`)) ?? []).map((t) => t.name);
  const commits = ((await api(`/repos/${owner}/${repo}/commits?per_page=10&sha=${branch}`)) ?? []).map((c) => ({ sha: c.sha, verified: !!c.commit?.verification?.verified }));
  const releasesWithNotes = ((await api(`/repos/${owner}/${repo}/releases?per_page=10`)) ?? []).filter((x) => (x.body ?? '').trim().length > 20).length;
  return { owner, repo, branch, archived: !!meta.archived, files, workflowFiles, workflows, readme, rules, tags, commits, releasesWithNotes };
}

// Combine per-repo results into one fact.
export function toFact(id, results, checkedAt = today) {
  const ok = results.filter((x) => x.ok).length;
  const summary = ok === results.length ? 'all' : ok ? 'some' : 'none';
  return {
    status: ok ? 'evidenced' : 'absent',
    value: { summary, repos: results.map((x) => ({ repo: x.repo, ok: x.ok, detail: x.detail })) },
    evidence: results.map((x) => ({ tier: 'verified', kind: 'api', url: x.url, detail: `${x.repo}: ${x.detail}`, checked_at: checkedAt, recheck: `GITHUB_TOKEN=... node scripts/repo-facts.mjs <slug>` })),
    checked_at: checkedAt,
    assessed_by: BOT,
    review: { status: 'pending' },
  };
}

export function applyChecks(gathered) {
  const out = {};
  for (const [id, fn] of Object.entries(CHECKS)) {
    const results = gathered.map((g) => {
      const { ok, detail } = fn(g);
      const url = id === 'B9.1' ? `https://api.github.com/repos/${g.owner}/${g.repo}/rules/branches/${g.branch}`
        : id === 'B9.5' ? `https://api.github.com/repos/${g.owner}/${g.repo}/tags`
        : id === 'B9.6' ? `https://api.github.com/repos/${g.owner}/${g.repo}/commits?per_page=10`
        : `https://api.github.com/repos/${g.owner}/${g.repo}/contents/?ref=${g.branch}`;
      return { repo: `${g.owner}/${g.repo}${g.archived ? ' (archived)' : ''}`, ok, detail, url };
    });
    out[id] = toFact(id, results);
  }
  return out;
}

function selfCheck() {
  const ok = (c, m) => { if (!c) throw new Error('repo-facts self-check failed: ' + m); };
  const g = { owner: 'o', repo: 'r', branch: 'main', archived: false,
    files: ['README.md', 'SECURITY.md', 'Dockerfile', '.github/dependabot.yml', '.github/workflows/ci.yml', 'CHANGELOG.md'],
    workflowFiles: ['.github/workflows/ci.yml'], workflows: 'on: [pull_request]\nsteps:\n- run: npm test -- --coverage', readme: 'How to contribute: open a PR',
    rules: [{ type: 'pull_request' }], tags: ['v1.2.0', 'v1.1.0'], commits: [{ verified: true }, { verified: false }, { verified: true }], releasesWithNotes: 0 };
  const facts = applyChecks([g]);
  for (const id of Object.keys(CHECKS)) ok(facts[id].status === 'evidenced' && facts[id].value.summary === 'all', `${id} should pass: ${JSON.stringify(facts[id].value)}`);
  const bare = applyChecks([{ ...g, files: ['README.md'], workflowFiles: [], workflows: '', readme: '', rules: [], tags: [], commits: [{ verified: false }], releasesWithNotes: 0 }]);
  for (const id of Object.keys(CHECKS)) ok(bare[id].status === 'absent', `${id} should be absent on a bare repo`);
  const mixed = applyChecks([g, { ...g, repo: 'r2', tags: [] }]);
  ok(mixed['B9.5'].value.summary === 'some' && mixed['B9.5'].status === 'evidenced', 'partial result should be evidenced/some');
  console.log('repo-facts self-check: ok');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-check')) { selfCheck(); process.exit(0); }
  const want = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const { providers } = loadData('data');
  mkdirSync('data/operational', { recursive: true });
  let touched = 0;
  for (const p of providers) {
    if (want.length && !want.includes(p.slug)) continue;
    const repos = [...new Map(p.repos.map((r) => r.url.match(GH)).filter(Boolean).map((m) => [`${m[1]}/${m[2]}`.toLowerCase(), [m[1], m[2]]])).values()];
    if (!repos.length) continue;
    const gathered = [];
    for (const [o, r] of repos) {
      try { const g = await gather(o, r); if (g) gathered.push(g); else console.error(`${p.slug}: ${o}/${r} not found`); }
      catch (e) { console.error(`${p.slug}: ${o}/${r}: ${e.message}`); }
    }
    if (!gathered.length) continue;
    const file = `data/operational/${p.slug}.yaml`;
    const doc = existsSync(file) ? parseDocument(readFileSync(file, 'utf8')) : parseDocument(`slug: ${p.slug}\n`);
    const facts = applyChecks(gathered);
    for (const [id, fact] of Object.entries(facts)) {
      const existing = doc.getIn(['facts', id]);
      if (existing && existing.get('assessed_by') !== BOT) continue; // a human owns this fact
      doc.setIn(['facts', id], doc.createNode(fact));
    }
    writeFileSync(file, doc.toString({ lineWidth: 0 }));
    touched++;
    console.log(`${p.slug}: ${gathered.length} repo(s), ${Object.values(facts).filter((f) => f.status === 'evidenced').length}/${Object.keys(CHECKS).length} controls evidenced`);
  }
  console.log(`${touched} operational file(s) updated`);
}
