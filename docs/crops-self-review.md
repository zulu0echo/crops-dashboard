## CROPS Review

Context: public-sector/DPG-style (readers cannot easily verify otherwise; highest bar)

Chosen default:
- A static site built from plain YAML files in a public Git repository, contributed to by pull request, deployed to GitHub Pages, with a self-contained build that can be pinned to IPFS. The data is the product: keeping it as plain files means anyone can read, diff, fork, and rebuild it without our servers, accounts, or permission. There is no backend, no database, no login, and no client JavaScript.

Censorship Resistance:
- Risk: [medium] GitHub can remove the repository, suspend the organisation, or take down the Pages site, which removes both the contribution channel and the default hosting. (evidence: verified, GitHub's terms permit this; a takedown has not happened)
- Risk: [low] Maintainers can refuse or stall a pull request that lowers a favoured provider's score. (evidence: claimed; process risk, no incident)
- Mitigation: Every clone is a complete copy of data, history, build, and site. The build needs no network after `npm ci`, so any copy can be rebuilt anywhere. `data.json` and `grid.csv` are downloadable from every page. The README documents pinning `dist/` to IPFS. Review rules are public (`CONTRIBUTING.md`, PR template), and CI checks are mechanical, so a refused PR that passes CI is visible as such.
- User escape: fork the repository to another host (Codeberg, a self-hosted Forgejo, or a plain Git remote); rebuild and serve `dist/` from any static host or IPFS; use the exported files directly.

Open (visibility):
- Risk: [low] Scores depend on human judgment between anchors, which a reader cannot see in the code. (evidence: verified; `finding` fields name judgment calls)
- Risk: [low] CI workflows run on GitHub-hosted runners whose images are not ours. (evidence: verified)
- Mitigation: Every score links to its artifact. Rules are enforced by `scripts/validate.mjs`, which anyone can run locally. Rollup logic is one function with a self-check. Methodology and every criterion's anchors are published on the site. All history is in Git.
- User escape: run `npm run validate` and `npm run build` locally; re-check any cell with the command in `docs/seed-review.md` or the PR that introduced it.

Free, as in Freedom (license):
- Risk: [low] Contributed data could be argued to carry different terms from the code. (evidence: verified; single MIT `LICENSE` at the repo root)
- Mitigation: One MIT license covers code, data, and site content. No CLA, so no party can unilaterally relicense contributions. Dependencies (`yaml`, `ajv`, `@noble/hashes` and their four transitive packages) are MIT, ISC, or BSD-3-Clause.
- User escape: fork under MIT with no permission needed.

Privacy:
- Risk: [medium] GitHub Pages logs visitor IP addresses and request metadata under GitHub's privacy statement; we cannot turn that off. (evidence: documented, GitHub's privacy statement)
- Risk: [low] The nightly job sends contract addresses and storage slots to public RPC endpoints, and URLs to their hosts during validation. These are public facts about providers, not about readers, and no credentials are sent. (evidence: verified, `scripts/recheck.mjs`, `scripts/validate.mjs`)
- Risk: [low] Contributors' GitHub identities are public in PR history. (evidence: verified)
- Mitigation: No analytics, cookies, telemetry, fonts, or third-party scripts; CI fails the build if a `<script>` tag or remote stylesheet appears. Every page sets `referrer: no-referrer`, so outbound evidence clicks do not reveal which page the reader came from. RPC endpoints are configurable per chain (`RPC_<chainId>`).
- User escape: read the site from an IPFS gateway, a mirror, or a local build; download `data.json` once and read offline. Contributors can use a pseudonymous GitHub account.

Security:
- Risk: [medium] Anyone with merge rights on `main` can change scores and redeploy the site. (evidence: verified; GitHub repository permissions)
- Risk: [low] The nightly bot holds `contents: write`, `pull-requests: write`, `issues: write` to open drift PRs and issues. It cannot change scores by design (it only sets `drift: true`), but a compromised dependency in that job would run with those permissions. (evidence: verified, `.github/workflows/recheck.yml`)
- Risk: [low] Contributor YAML is rendered into HTML. (evidence: verified)
- Mitigation: Branch protection on `main` with required CI and one CODEOWNERS review (to be enabled at publication). Bot changes arrive as a PR, never a direct push to `main`. No repository secrets are used anywhere; the PR workflow's write token is confined to a separate comment job that runs only for same-repo PRs. Third-party actions are pinned by commit SHA. All rendered data is HTML-escaped, URLs must be `https://`, YAML aliases are rejected, and CSV cells are neutralised against formula injection.
- User escape (walkaway test): if maintainers disappear, the repository, all data, and the build remain usable from any clone; GitHub Pages keeps serving the last build until removed; any fork can take over with `npm ci && npm run build`.

Accepted compromises:
- GitHub as the contribution and hosting dependency. Bounded: it holds no data that is not also in every clone, and no secrets. Justified: PR review on GitHub is where the intended contributors already are. Escape: fork and mirror to another Git host, serve `dist/` from any static host or IPFS.
- GitHub Pages access logs. Bounded to what GitHub's privacy statement covers. Escape: the IPFS pin or a mirror.
- Public RPC defaults for the nightly job. Bounded: they see only public provider addresses. Escape: set `RPC_<chainId>` to a self-hosted node.
