# Methodology red team

Status: draft, 2026-10-07. Severities and proposed changes are proposals; none has been agreed or applied.

Scope: the published methodology (sections 2.1 to 2.8), the 23 criteria in `data/criteria.yaml`, the enforcement in `scripts/validate.mjs` and `scripts/recheck.mjs`, and the four seed files as test cases. The question asked of each part was: how could a provider, a competitor, a careless contributor, or an honest reader get a wrong answer from this, and would anything catch it?

## Summary

The evidence rules hold up against the obvious attack, which is a vendor raising its own score with marketing. They are weaker against four less obvious ones.

1. CI checks that an artifact exists, not that it supports the score. A `verified` tier is whatever the contributor typed, provided the commit or URL resolves. One maintainer review is the only check on relevance.
2. Several anchors score the absence of a visible problem. A provider that moves a component from public code to a closed backend can raise its score on C4, P1, P4, S5 and F1, because the problem stops being visible.
3. Evidence that lowers a score is admissible at any tier, including `claimed`. A third-party article is enough to hold a competitor's cell at 0.
4. The minimum rule, unknown counting as 0, and strict anchors together push almost everything to the floor. 16 of the 20 pillar cells in the seed data are 0, so the grid separates the providers less than the underlying criteria do.

Most findings below trace to the first: the methodology defines what an artifact is but not what claim each artifact must establish. A per-criterion claim template with a required re-check command (R2) closes or narrows R1, R3, R4, R6 and R7 at the same time.

## Findings

| ID | Finding | Proposed severity | Where |
| --- | --- | --- | --- |
| R1 | `claimed` evidence can lower a score to 0 | High | 2.3, validator |
| R2 | Tier and relevance are self-declared; CI checks existence only | High | 2.3, 2.8, validator |
| R3 | Source at a commit is not shown to be what runs | High | 2.3, C1–C4, P1, P4, S3, S5 |
| R4 | Closing code can raise scores | High | C4, P1, P4, S5, F1 |
| R5 | The contributor chooses the unit of assessment | Medium | 2.1 |
| R6 | Anchors bundle several conditions, so judgment calls are frequent | Medium | Section 4 anchors |
| R7 | Multisig and timelock checks are too shallow | Medium | C1, S2 |
| R8 | Ratings saturate at the floor | Medium | 2.4 |
| R9 | One design choice fails many criteria at once | Medium | C2, C3, F3, O2, O3, S4 |
| R10 | Freshness covers about 15% of evidence | Medium | 2.6, recheck |
| R11 | Documented sources are mutable or unreadable | Medium | 2.3, validator |
| R12 | Legally required screening and KYC are scored as failures | Medium | C4, P2 |
| R13 | What CROPS does not measure is not stated to readers | Medium | 2.5, site |
| R14 | Governance: one reviewer, no conflict disclosure, no per-cell provenance, no versions | Medium | 2.7, 2.8 |
| R15 | O3 measures contributor effort as much as provider openness | Low | O3 |

### R1. `claimed` evidence can lower a score to 0

Section 2.3 says evidence that lowers a score is admissible at any tier. The validator only enforces tiers for scores above 0, so a cell scored 0 whose only evidence is a `claimed` blog post passes CI. A competitor, or anyone with a grievance, can hold a provider's cell at 0 by citing a hostile article, and the minimum rule then carries that 0 into the pillar.

The rule makes sense for one case: a provider's own statement that admits a weakness, such as a privacy policy disclosing data sharing. It does not make sense for third-party statements, which are inadmissible for raising a score for the same reason they should be inadmissible for lowering it.

Proposed change: split `claimed` into `claimed-by-provider` and `claimed-by-third-party`. A provider's own admission may lower a score. A third-party claim may be recorded in `finding` and may set a new `disputed: true` flag, shown on the site, but cannot by itself move the score below what the admissible evidence supports. Add a validator rule: a score of 0 needs either admissible evidence or a `claimed-by-provider` item.

### R2. Tier and relevance are self-declared; CI checks existence only

For a `verified` repo item the validator checks that the commit exists in the repository and the URL resolves. It does not check that the file says what `detail` claims, that the line range exists, or that the file is relevant to the criterion. For an onchain item it does not check that the address has code on the stated chain or that `block_number` is plausible. A contributor can cite any real file at any real commit as `verified` evidence for a score of 3, and CI passes it. Relevance rests on one maintainer review (2.8).

The seed review showed what a reviewer needs: for each cell scored 2 or 3, one command that reproduces the fact (`docs/seed-review.md`). That command currently lives outside the data.

Proposed changes:

- Add a required `recheck` field to every evidence item supporting a score of 2 or 3, holding the command or click path that reproduces the fact. CI checks that it is present; the reviewer runs it.
- Require a line range in repo URLs for any claim about specific code, and have CI check that the range exists in the file at that commit.
- For onchain items, have CI call `eth_getCode` at `block_number` on the stated chain and reject empty code where the claim is about a contract.
- Require two reviewers, one of them not the contributor's affiliate, for any change that sets a score of 2 or 3.

### R3. Source at a commit is not shown to be what runs

C1, C2 and S1 can be scored from contract source at a pinned commit. O1 separately asks whether deployed bytecode matches source, but nothing ties the source cited in C1 to the bytecode at the address users interact with. The same gap exists off-chain: P1, P4, C4, S3 and S5 are scored from SDK source in a repository, but integrators install a package from npm and users load a hosted widget. Daimo's P1 finding notes first-party telemetry in the hosted flow; a repository-only reading of the SDK would have missed it.

Proposed changes:

- For criteria about contract behaviour (C1, C2, S1, S2), require that cited source is the Sourcify- or explorer-verified source for the deployed address, or cap the cell at 2 with the gap stated in `finding`.
- For criteria about client behaviour (C4, P1, P4, S3, S5), require that the evidence name the distributed artifact (npm package name, version and integrity hash, or the hosted bundle URL with a content hash), or cap at 2.

### R4. Closing code can raise scores

C4 anchor 3 is "none present in SDK/frontend". P1 anchor 3 is "none in SDK, widget, or frontend manifests". P4 and S5 are similar. Each rewards the absence of a visible problem. A provider that moves address screening, analytics, or third-party calls from its SDK into a closed backend makes the problem invisible, and the anchors as written would then allow a higher score. The Daimo seed avoided this on C4 by marking it unknown because location logic runs in the closed API, but the anchor did not require that.

F1 has the same shape. It is scored over the repositories listed in `repos`, and a closed component is not a repository. Daimo Pay scores F1 = 3 (Strong) because both of its public repositories are OSI-licensed, while F3 = 0 records that the product cannot run without Daimo's closed API, relayer and price signer. A reader of F1 alone would conclude the product is freely licensed.

Proposed changes:

- Add a `components` list to the provider file: each component in the payment path with its role, whether it is public, its licence, and who operates it. Score O2, F1, F3, C3, P4 and S4 against this list, so that a closed required component counts as an unlicensed component for F1.
- For absence-of-problem criteria (C4, P1, P4, S5), allow anchor 3 only when every component in the relevant request path is public or a network trace covers it; otherwise the cell is unknown, as Daimo's C4 already is.

### R5. The contributor chooses the unit of assessment

Section 2.1 scores the "primary (flagship)" chain and leaves the choice to the contributor. It also leaves open which product version and which contracts are in scope. The Daimo seed scores the deposit-address contracts used by the current SDK and excludes the older DaimoPay and PayIntent contracts still in the repository. That was a reasonable call, recorded in the research log, but a provider could equally steer an assessment to its best deployment or newest contracts.

Proposed change: define the unit with an objective default and require evidence for it. For example, the chain the provider's SDK uses by default at the pinned commit, or the deployment with the most settlement volume on a named public source at check time. Record the choice and its evidence in the provider file, and list excluded deployments and contracts in `notes`.

### R6. Anchors bundle several conditions, so judgment calls are frequent

Many anchors combine conditions. C1 anchor 2 requires a multisig of at least 2-of-3, a timelock of at least 24 hours, and scope documented in code. Real systems often meet some of these and not others, or meet them in a form the anchor did not foresee. The seed findings contain 24 cells marked "Judgment call" across four providers, including:

- Daimo C1, which treats an owner-controlled relayer allowlist as a pause power;
- Gnosis Pay C1, scored 0 from the card-blocking terms when the onchain layer alone would score 3;
- Gnosis Pay S3, where a refilling daily allowance is neither exact-amount nor unbounded;
- Gnosis Pay S4, scored 2 because the user keeps a withdrawal path even though settlement stops.

Two careful contributors could reasonably reach different numbers on each.

Proposed changes:

- Rewrite each criterion's anchors as an ordered checklist where the first unmet condition sets the score, so a partial match has one answer.
- Add worked examples to each criterion page, starting with the seed judgment calls above.
- Before publication, have a second assessor score one seed provider independently and publish the agreement rate. Disagreements become anchor clarifications.

### R7. Multisig and timelock checks are too shallow

The C1 and S2 anchors read a Safe's threshold. A threshold says nothing about whether the signers are independent people or keys held by one team, and Safes can have modules or guards that act without reaching the threshold. As an example, the Gnosis Pay spender Safe (`0x896a695d…8428`, 2-of-3) has one module enabled, `0x5f07734E…3F8a`, read with `getModulesPaginated` on 2026-10-07. The provider file identifies that address as the spender modifier. Whether it widens what can be done without two signatures was not assessed in the seed, and the rubric does not ask. That is an inference about a gap in the rubric, not a finding about Gnosis Pay.

A 24-hour timelock also protects users only if they can exit within it, through a path the same admin cannot block.

Proposed changes for C1 and S2:

- Require the Safe's enabled modules and guard to be read and listed.
- Require signer disclosure or a statement that it is unknown.
- Replace the fixed 24 hours with "timelock at least as long as the documented user exit takes, and the exit cannot be blocked by the same role".

### R8. Ratings saturate at the floor

16 of the 20 pillar cells in the seed data are 0. Three of those come only from unknown criteria; the rest come from at least one criterion with evidence of absence. With every pillar of both incumbents at 0, and most pillars of both onchain rails at 0, the grid mostly reads as zeros, and the differences that matter to a reader sit inside the pillars.

Three things cause this:

- the minimum rule, which is deliberate and defensible (2.4);
- unknown counting as 0;
- pillars with more criteria having more chances to hit 0. Security has six criteria and Free has three, so the pillars are not equally hard.

Proposed changes, none of which adds a composite score:

- Show each pillar's distribution next to its minimum, for example "0 · three of six criteria at 2 or above".
- Show unknown counts separately from evidenced zeros at pillar level. The site does this only when every limiting criterion is unknown.
- State the criteria count per pillar on the methodology page as a known asymmetry.
- Show, for each pillar, what would raise it (the limiting criteria and the next anchor), which also gives providers a concrete target.

### R9. One design choice fails many criteria at once

A required closed relayer fails C2 (no direct path), C3 (hosted dependence), F3 (proprietary dependency), O2 (stack not public), O3 (cannot self-host) and S4 (walkaway), and through the minimum rule it sets four of the five pillars. The seeds show this for Daimo Pay. Each criterion is correct on its own, but a reader counting failures will count one fact six times.

S4 is explicitly derived from S1, C2, C3 and O3, so it can only repeat them.

Proposed changes: publish the dependency between criteria on the methodology page, and mark S4 as derived on the site. Alternatively, drop S4 from the Security minimum and show it as a summary line.

### R10. Freshness covers about 15% of evidence

Of 152 evidence items in the seed data, 17 onchain items carry a machine-readable `check`, and 6 repo items are LICENSE or lockfile paths that the nightly job compares. The other 129 items, about 85%, are never re-read. In particular:

- Code changes after the pinned commit are invisible. The pin is honest about what was checked, but readers will assume the rating is current.
- New role grants and redeployments go undetected. The nightly job re-reads a recorded role holder; it does not notice a new AccessControl member or a new contract address.
- Drift does not change the rating. A drifted role check on a cell rated Strong keeps showing Strong until a human acts.
- The 180-day threshold is the same for every cell. It applies equally to an immutable contract and to an upgradeable one whose admin can change it tomorrow.

Proposed changes:

- Show "N commits since pinned" for repo evidence (one GitHub compare call per item).
- Re-read AccessControl role membership from events.
- Treat a drifted cell as unknown in the rollup until it is reviewed.
- Shorten the staleness window for cells on upgradeable or admin-controlled contracts.
- Publish the share of evidence that is auto-rechecked on the methodology page.

### R11. Documented sources are mutable or unreadable

`documented` evidence is a URL plus a date. Terms of service and privacy policies change without notice, so a later reader may follow the link and find different text.

The seed research hit two worse cases:

- Client-rendered docs. The Daraja portal returns HTTP 200 for any path, including nonsense API names, so "URL resolves" proves nothing there.
- Bot protection. Safaricom's privacy statement and M-Pesa terms return 403 to non-browser requests. They could not be read or cited, so the relevant M-Pesa cells stay unknown. Any provider behind bot protection is effectively shielded from document evidence that would lower its score.

Proposed changes:

- Record a SHA-256 of the fetched content, plus an archived copy, with each `documented` item. The archive could be a file committed to the repository, which avoids depending on a third-party archive service.
- Allow a committed copy as the citation when the live page blocks automated access.
- Replace the plain resolve check with a content check: the page must contain a quoted phrase stored in the evidence item.

### R12. Legally required screening and KYC are scored as failures

C4 gives 3 for no filtering and 0 for undisclosed filtering. P2 gives 0 for KYC "without a code-visible reason". Regulated rails are required to screen sanctions lists and identify customers, and the institutions this dashboard is for will read a rail without screening as a compliance risk, not a strength. As written, the rubric scores a legally required control as a failure and gives no credit for implementing it transparently.

Proposed change: restate C4 as neutrality of the settlement layer plus transparency of any edge filtering. Allow 3 when the settlement contracts are neutral, any filtering is at the edge, disclosed, and bypassable through the direct path. Restate P2 so that legally required collection, disclosed with its legal basis, scores 2, and collection beyond that requirement scores lower.

### R13. What CROPS does not measure is not stated to readers

The criteria measure inspectability, admin powers, licensing and data flows. They do not measure:

- legal recourse;
- regulatory supervision;
- safeguarding of customer funds;
- operational track record;
- liquidity;
- cost.

A risk committee weighs all of these. M-Pesa's S1 is Weak because funds are held on M-Pesa, which is accurate within the rubric. Kenyan e-money rules require safeguarding of customer balances, and the rubric has no place to record that. The baseline note covers the verifiability gap but not this.

Proposed change: add a "What this does not assess" section to the methodology page and the home page, naming these dimensions. Allow a `context` field per provider for out-of-scope protections, recorded as context and never scored.

### R14. Governance

- Review. One maintainer review approves a score (2.8). There is no conflict-of-interest disclosure for contributors or reviewers. Nothing stops a provider's employee reviewing their own cells.
- Disputes. Right of reply (2.7) has no response time and no appeal path.
- Provenance. There is no record per cell of who assessed it or whether it has been reviewed. The seed data was assessed by AI research agents and is covered only by a site-wide banner.
- Versioning. Ratings are not versioned. A risk committee that cites a rating cannot point to the dataset version it used.

Proposed changes:

- Add `assessed_by` and `reviewed_by` per cell, and show review status per cell. The banner then becomes a count of unreviewed cells.
- Add a conflict-of-interest line to the PR template, and a CODEOWNERS rule that a provider's affiliates cannot approve its file.
- Set a dispute window, for example 30 days to a maintainer response, and an appeal to a second maintainer.
- Tag dataset releases and embed the git commit in `data.json` and the site footer.
- Generate a change history per provider from git.

### R15. O3 measures contributor effort as much as provider openness

O3 anchors 2 and 3 need a recorded self-host attempt. No seed attempted one, so O3 is capped at 1 or lower for every provider. The cap reflects whether a volunteer spent a day trying, not only whether the provider made self-hosting possible.

Proposed change: let a provider earn `verified` O3 evidence by publishing a deploy script that CI can run against a testnet, for example a container setup and a test payment. A recorded manual attempt remains acceptable.

## Proposed order of work

Ordering is a proposal for discussion.

1. Before publication: R1, R2 (`recheck` field, code existence, line ranges), R13, and per-cell provenance from R14. These protect the integrity of what is published, and each is a contained change to the schema, validator or site.
2. Next: R4 (`components` list), R3 (deployed-artifact provenance), R12 (C4 and P2 rewording), R6 (checklist anchors and the inter-rater test), R7.
3. After that: R8 (pillar distribution display), R9, R10, R11, the rest of R14, and R15.

## Decisions needed from you

These change what the methodology claims, so they are not mine to make:

1. Whether third-party claims may ever move a score (R1).
2. Whether C4 and P2 should credit transparent, legally required controls (R12). This changes how existing seeds score.
3. Whether drifted cells should count as unknown in the rollup (R10). This makes ratings fall automatically, which some providers will dispute.
4. Whether S4 stays inside the Security minimum (R9).
5. Who the second assessor is for the inter-rater test (R6), and who reviews alongside the maintainer (R2, R14).

## Sources

- Methodology text: `site/methodology.html`.
- Criteria and anchors: `data/criteria.yaml`.
- Validator rules (tiers enforced only for score > 0; no onchain code check; no line-range check): `scripts/validate.mjs`, function `checkProvider`.
- Nightly re-check scope (only items with `check`, plus LICENSE and lockfile paths): `scripts/recheck.mjs`, constant `WATCHED` and function `findDrift`.
- Daimo F1 = 3 and F3 = 0, C4 unknown due to closed API, P1 hosted-flow telemetry: `data/providers/daimo-pay.yaml`.
- Gnosis Pay judgment calls on C1, S3, S4: `data/providers/gnosis-pay.yaml`; spender Safe address and spender modifier role: same file, `contracts`.
- Gnosis Pay spender Safe module read: `cast call 0x896a695d5cCDd21F9e3Bb18307a558befCCb8428 "getModulesPaginated(address,uint256)(address[],address)" 0x0000000000000000000000000000000000000001 10 --rpc-url https://rpc.gnosischain.com`, run 2026-10-07, returned `[0x5f07734E2B9C4dE6f9C32253d485741800da3F8a]`, threshold 2.
- Daraja portal returns 200 for nonsense paths; Safaricom documents return 403: `docs/research/m-pesa.md`, lines 7 and 12; confirmed with `curl` on `https://developer.safaricom.co.ke/apis/this-api-does-not-exist-xyz` (200) on 2026-10-07.
- Pillar zero count (16 of 20, 3 from unknown only), evidence counts (152 items, 17 with `check`, 6 watched repo paths), judgment-call count (24): computed from `data/providers/*.yaml` with `node scripts/rollup.mjs` on 2026-10-07.
