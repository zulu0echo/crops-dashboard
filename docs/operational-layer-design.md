# Operational and procurement layer: design

Status: built on 2026-10-09 from `docs/build-prompt-operational-layer.md`. Decisions were taken by the builder and are listed in section 10 for the maintainer to reverse. The layer is live in the site build; its data is mostly empty, which is the correct state until the research in `docs/operational-layer-plan.md` runs.

## 1. What it is

A second section on every provider page and an Operational page, recording facts an institution asks after the CROPS ratings: fees, custody model and licences, cash-out per country, dated maturity facts, verified volumes, and the provider's position against 46 vendor due-diligence controls derived from a UN humanitarian agency's software practices and Authority-to-Operate sheet. It never feeds a CROPS pillar, no number combines the layers, and there is no composite or ranking.

## 2. Five states

| State | Meaning | Needs |
| --- | --- | --- |
| evidenced | a document or chain state anyone can re-check | verified or documented evidence, or a `refs` pointer to evidence already in the provider file, plus a value |
| attested | the provider states the document exists but it is available only under NDA | the provider's statement as evidence |
| absent | evidence that the thing does not exist | what was searched |
| not_applicable | there is no party the control applies to | a reason and a `burden`: `institution` (whoever deploys the rail holds it) or `none` |
| unknown | nobody has looked | nothing |

Volumes use `evidenced`, `not_observable`, `not_verifiable`, `unknown`. The validator enforces the needs; a provider's own word can make a fact attested, never evidenced.

## 3. Operator-free rails

A control marked `applies: operator` or `custodial` cannot be `absent` on a rail with no required closed component (or with self-custody). The site implies `not_applicable: falls to the institution` when such a fact is missing and labels it "implied from the component list". Counts of states are shown per provider so that a column of N/A reads as a shift of responsibility, not as a pass or a fail; the overview's "How to read this" says so in one line.

## 4. Data model

- One file per provider: `data/operational/<slug>.yaml`, schema `schema/operational.schema.json`, controls in `data/operational-criteria.yaml`. Separate from the provider file so that security or procurement reviewers can own it, its freshness differs, and diffs stay readable.
- Group A keys: `fees`, `custody_model`, `licences`, `cashout`, `maturity.{first_deployment, entity, incidents, changes}`, `volume`. Each is a fact with a typed `value`.
- Group B: `facts.<control id>`.
- Evidence reuses the provider evidence shape; `refs: [{criterion, index}]` points at evidence already in the provider file so the same fact is never recorded twice (custody model points at S1, audits at S6). A new evidence kind `api` (tier verified, `api.github.com` URLs only) records machine-readable repository state.
- Per-country facts reuse ISO codes and the `EU`/`EEA` regions from `data/regions.yaml`; cash-out rows may say `ALL` for every country in the availability list.
- Every fact carries `assessed_by` and `review`, so the pending-review banner counts it.

## 5. Volumes

`volume.spec` is the reproducible query: chain, listed settlement contracts only (the validator rejects others), event topic, which 32-byte words hold amount and token, window in days. `scripts/volumes.mjs` runs it in fixed block chunks against the public RPC (or `RPC_<chainId>`), writes the result with the block range, call count and date, and labels the figure gross observed. Windows that exceed the call budget are recorded as not computed with the reason, never as zero. Incumbents are `not_verifiable`; rails whose settlement cannot be read (card settlement into one treasury address, private pools) are `not_observable` with a reason. Provider-reported figures are not stored.

## 6. Automation

- `scripts/repo-facts.mjs` fills B2.1, B2.3, B8.2 and B9.1 to B9.8 from each provider's public GitHub repositories: security policy, scanning config, deployment config, branch rules, CI on pull requests, tests and coverage in workflows, semantic tags, signed commits, changelog, contribution guide. It never overwrites a fact a human assessed. Ceiling: classic branch protection is invisible without push access, so B9.1 reads the public rules API only and says so.
- `scripts/volumes.mjs` as above. Both have self-checks in `npm test`.
- The validator checks state rules, control ids, dangling refs, operator-class misuse, and volume specs; online it checks the layer's document quotes and URLs like any other evidence.
- Nightly: not yet wired. `repo-facts` and `volumes` are meant to run in `recheck.yml` after the drift check (plan step 6).

## 7. Site

- Operational page: one row per provider with custody, licences, cash-out methods, first deployment, entity, volume, repository practice (x of 11), and the five-state counts for group B.
- Provider page: a section after the CROPS pillars, under a double rule, with group A as articles and group B as a grouped table of control, state and what was found.
- Country page: a "Cash-out here" column resolved from the cash-out rows.
- Exports: `operational.csv` and the `operational` key in `data.json`.

## 8. Relation to CROPS

| Operational fact | References | Rule |
| --- | --- | --- |
| custody_model | S1 | the value must agree with the S1 finding; point at its evidence |
| B1.4 source-code review | S6 | protocols link, operators may add their own |
| B3.3 recovery plan | S4 | non-custodial rails: the walkaway test is the continuity answer |
| B5.2 API keys, B5.4 exports | S5, O4 | cross-reference, do not restate |
| B6.3 retention | P2 | P2 records what is collected, B6.3 how it is governed |
| maturity.incidents | S6 findings | incidents already cited in findings are referenced, not retyped |

Reading order the site implies: CROPS (can behaviour be verified, do the properties hold), group A (cost and reach), group B (what your own due diligence would find and which controls fall to you).

## 9. Red team of this design

| Risk | What the design does |
| --- | --- |
| Volumes inflated by self-transfers or tests | figure labelled gross observed, method and exclusions shown, listed contracts only |
| Fees hidden in spreads or partner charges | fee components are itemised with a `basis` field; a missing component is unknown, not zero |
| Licences from weak or uncheckable registers | the register URL is part of the value; a provider page citing a number is attested, not evidenced |
| Certificates covering another entity or scope | B1.1 and B1.2 ask for the entity and scope in the value |
| "Attested" read as evidenced | distinct amber state, defined in the legend and in the methodology |
| Undisclosed entity treated as neutral | `maturity.entity` has unknown and absent as separate states |
| Vendors look well-controlled, protocols show N/A | N/A carries a burden label and an explanation; counts are shown side by side, never summed |
| Cash-out partner withdrawn | each row has its own checked_at; staleness follows the evidence date |
| Facts layer lends authority to unreviewed ratings | every fact counts in the pending-review banner; the layer sits below the ratings under a double rule and says "never scored" |

## 10. Decisions taken

| Decision | Taken | Options not taken | Hinges on |
| --- | --- | --- | --- |
| File layout | parallel `data/operational/<slug>.yaml` | key in provider file | separate reviewers and freshness; diff noise |
| Ratings in the layer | none; all facts | 0–3 for maturity or assurance | no anchors a stranger would apply identically |
| Volume window | `window_days` per spec, 30 recommended; chunked public RPC | fixed 30/365 for all | public RPC log limits; archive node optional via `RPC_<chainId>` |
| Currency normalisation | none; per-token raw sums with decimals | onchain price feed | avoids a price-source dependency; comparison across tokens is the reader's |
| Partner-held licences | recorded with `holder: partner` | excluded | institutions contract with the licensed party |
| Provider-reported figures | not stored | separate "reported" field | nothing to display that is not verifiable |
| Staleness | per-fact `checked_at`; same 180-day rule as ratings for now | per-criterion windows | simplest; revisit when data exists |
| Attested expiry | none; re-check manually | annual expiry | no data yet |
| Automated B9 checks | eight repository checks plus B2.1, B2.3, B8.2 | coverage percentage | public API only; coverage needs CI artifacts |
| Overview placement | separate Operational page and nav entry | columns on the ratings page | constraint 1 |
| Partner naming | "a UN humanitarian agency" in all committed text | name the agency | repository is public; source documents are internal |

## 11. Known limits

- Group B facts for operators are mostly documented or attested; the layer records positions, it cannot verify an ISO certificate's scope beyond the certifier directory.
- The repository checks are heuristics over workflow text (test and coverage commands, scanning tools). A workflow that runs tests through an unusual command reads as absent; the detail string says what was matched.
- Volumes depend on a correct `spec`; a wrong amount word produces a confident wrong number. Specs are reviewed like any other evidence and the method is printed next to the figure.
- Public RPCs do not serve 30-day log windows on Base: four public endpoints were tried on 2026-10-09 (request limit, token required, range limit, HTML response). Ethereum worked through rpc.mevblocker.io (Tornado Cash: 8,977 withdrawals in 30 days). Base volumes stay "not computed" until a fork sets `RPC_8453` to an archive node.
- The volume script reads the token from the log data only; events that put the token in an indexed topic (Umbra's Announcement) can be counted but not summed per token. Upgrade path: a `token_topic` option.
- Nothing in the layer is reviewed yet.
