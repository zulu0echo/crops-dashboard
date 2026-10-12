# Payment Rails CROPS Dashboard

> [!CAUTION]
> **Unaudited, unvetted, experimental. Do not use this project as a reference.**
>
> - **Unreviewed.** Every rating, finding and piece of evidence in this repository is unreviewed. Not one has been checked by a human reviewer.
> - **Research method.** The provider assessments were produced with AI research agents. They may be incomplete, out of date, misattributed or wrong.
> - **Unvalidated method.** The methodology itself has not been independently validated, and its own red team (`docs/methodology-red-team.md`) lists open weaknesses.
> - **Code not audited.** The code has not been security-audited.
>
> Nothing here is a statement of fact about any provider, a recommendation, an endorsement, or a warning about any product. It is not financial, investment, legal, compliance or security advice. The legal context recorded for some providers is a dated summary of public documents, not legal analysis.
>
> Do not cite, rely on, or make decisions with these ratings, and do not treat this repository as a standard or a reference implementation. It does not represent the views of any organisation. If you believe something here is wrong, open an issue.

An open, forkable, evidence-only dashboard that scores payment rails against the
Ethereum Foundation's CROPS properties: Censorship Resistance, Open Source and Free,
Privacy, Security. Every score links to an artifact a third party can re-check: a
contract read at a block, or a file at a pinned commit.

- How scores work: [`site/methodology.html`](site/methodology.html) (published at `/methodology`)
- How to contribute: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Design choices: [`docs/decisions.md`](docs/decisions.md)
- The dashboard's own CROPS review: [`docs/crops-self-review.md`](docs/crops-self-review.md)
- Operational and procurement layer: [`docs/operational-layer-design.md`](docs/operational-layer-design.md), [`docs/operational-layer-plan.md`](docs/operational-layer-plan.md)

## Run it locally

Needs Node 20 or newer and Git. Nothing else.

```sh
git clone <this repo> crops-dashboard && cd crops-dashboard
npm ci                      # installs yaml, ajv, @noble/hashes
npm test                    # self-checks: rollup, validator rules, drift comparison
npm run validate:offline    # schema + evidence rules, no network
npm run build               # writes dist/
python3 -m http.server 8000 --directory dist   # or open dist/index.html directly
```

`npm run validate` (without `:offline`) also checks that every URL resolves and every
pinned commit exists on GitHub. Set `GITHUB_TOKEN` to avoid the unauthenticated rate limit.
If every online check times out while `curl` works, your machine's IPv6 route is probably
broken and Node is trying IPv6 first; run with
`NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"`.

## Layout

```
data/criteria.yaml          the 23 criteria (single source of truth)
data/providers/*.yaml       one file per provider
schema/                     JSON Schemas for both
scripts/validate.mjs        schema + evidence rules + URL/commit resolution (CI on every PR)
scripts/rollup.mjs          pillar = min of criteria; also prints the PR rollup diff
scripts/recheck.mjs         weekly refresh: re-reads every cited source, marks drift
scripts/build.mjs           the static site, into dist/
data/operational/*.yaml     operational and procurement facts (second layer, never scored)
data/operational-criteria.yaml  the due-diligence controls for that layer
scripts/repo-facts.mjs      fills repository-practice facts from GitHub (weekly)
scripts/volumes.mjs         verified volumes from chain logs (weekly)
site/                       static page fragments, CSS, config.json
site/app.js                 optional first-party script: search, sorting, compare picker (pages work without it)
site/logos/                 provider icons (sources and trademark note in SOURCES.md)
scripts/marks.mjs           chain symbols (inline SVG) and provider badges
```

## Deploy

GitHub Pages deploys from `.github/workflows/ci.yml` on every merge to `main`. In the
repository settings, set **Pages → Source** to **GitHub Actions**. No secrets are needed.

The weekly refresh (`.github/workflows/recheck.yml`, Mondays 03:17 UTC) uses public RPC endpoints. To
use your own, set repository variables `RPC_1`, `RPC_100`, `RPC_8453` (or any
`RPC_<chainId>`; add the variable to the workflow's `env`).

### Pin a build to IPFS

`dist/` is self-contained and uses only relative links, so it works from any gateway path.

```sh
npm run build
ipfs add -r --cid-version 1 dist     # with a local Kubo node; note the last CID printed
ipfs pin add <cid>
```

Open it at `http://<cid>.ipfs.localhost:8080/` or any public gateway. A CI publish step
is not included because every pinning service needs an API secret; a fork that wants one
can add it.

## Fork it

1. Fork or clone, then edit `site/config.json`: `repo_url` (your repository, used in links),
   `title`, and `seed_pending_review` (set `false` once seed data has been reviewed; see
   `docs/seed-review.md`).
2. Replace the handles in `CODEOWNERS` with your maintainers.
3. Turn on branch protection for `main`: require the `ci` check and one CODEOWNERS review.
4. Enable Pages as above.

Everything is MIT licensed. No CLA.

## Verified local build (2026-10-07)

Run on macOS, Node 22.22.0, from a fresh copy of the working tree (no `node_modules`, no `dist`):

```sh
npm ci                     # 7 packages, 0 vulnerabilities
npm test                   # rollup / validate / recheck self-checks: ok
npm run validate:offline   # 32 file(s), 0 error(s)
sandbox-exec -p '(version 1)(allow default)(deny network*)' npm run build   # network denied; built 32 providers
```

Wall time: 2 seconds with a warm npm cache. Allow a minute for a cold `npm ci`.
