# Contributing

Everything on the dashboard comes from YAML files in `data/`. You change a score by
opening a pull request that edits one of those files. CI checks the evidence rules
below, and a maintainer re-checks your artifact before merging.

## Add a provider

1. Copy an existing file in `data/providers/` (Daimo Pay is the reference) to
   `data/providers/<slug>.yaml`.
2. Fill in `slug`, `name`, `type`, `website`, `primary_chain` (with `basis`: why this chain or
   deployment, with evidence, and what you excluded), `repos`, `contracts`, and `components`:
   every component in the payment path, public or closed (API, relayer, signer, KYC vendor,
   card issuer...). Optional `context` records protections outside CROPS (regulation,
   safeguarding); it is shown but never scored.
3. List every criterion from `data/criteria.yaml` under `scores`. Any criterion you
   have not evidenced is `unknown: true`. Do not leave one out; CI rejects that.
4. Give every cell `assessed_by` (your name or handle) and `review: {status: pending}`.
   Only a reviewer sets `status: reviewed` with `by` and `date`.
5. Run `npm run validate` locally (set `GITHUB_TOKEN`), then open a PR.

Eligibility: a non-`incumbent` provider needs at least one entry in `contracts` or
`repos`. If it has neither, it is an `incumbent` (no `primary_chain`) or it does not
belong here.

## Change a score

Edit the cell, add the evidence item that justifies the change, update `finding`, and
say in the PR description which artifact you inspected and how a reviewer re-checks it.

## Evidence rules

Every evidence item has a `tier`. The highest tier on a cell caps its score.

| Tier | What qualifies | Caps score at |
| --- | --- | --- |
| `verified` | Onchain state anyone can read (address + function/role/slot + block number); source in a public repo at a pinned 40-character commit SHA and file path; bytecode matched to source on Sourcify or an explorer | 3 |
| `documented` | Terms, privacy policy, audit report, technical docs, or a network trace with written reproduction steps. URL-linked and dated | 1 |
| `claimed` | Vendor statements, blog posts, marketing, support replies, third-party articles | 0 |

CI enforces:

- A `score` needs at least one evidence item and a `finding`.
- `score > 0` needs a `verified` or `documented` item. `score > 1` needs a `verified` item.
- `kind: repo` needs `commit` (40-hex) and `path`. The URL must point at that commit
  (`.../blob/<commit>/<path>` or `.../tree/<commit>/...`), and the commit must exist in that repo.
- `kind: onchain` needs `address` and `block_number`; `chain_id` defaults to the provider's.
- Addresses must be valid EIP-55 checksums (or all lowercase).
- Every URL must resolve.
- `tier: claimed` needs `by: provider` or `by: third_party`. A cell cannot rest on third-party
  claims alone: a provider's own admission can hold a score down, a third party's cannot. Record
  the claim in `finding` and set `disputed: true` if it contests the rating.
- A score of 2 or 3 needs a `recheck` command on at least one evidence item, and repo evidence
  behind it needs a `#Lx-Ly` line range that exists at the commit.
- A 3 on C1, C2, S1 or S2 needs onchain evidence about the deployed contracts. A 3 on C4, P1, P4,
  S3 or S5 needs an item with `package: {name, version, integrity}` (from `npm view`) or a trace.
- F1 is 0 if any required component is closed; at most 1 if any is source-available. C4, P1, P4
  and S5 cannot be 3 while a required component is closed, unless a trace covers it.
- `kind: document` needs `quote`: an exact passage CI finds on the live page. If the page blocks
  automated access or renders in the browser, commit the text you read to `data/archive/` and
  set `archive`.
- Onchain addresses must have code, unless marked `eoa: true`.

Evidence that **lowers** a score (a privacy policy that discloses sharing, a trace that
shows an analytics call, a provider's own admission) is admissible whether it is verified,
documented, or claimed by the provider. Third-party claims are recorded but cannot lower a
score on their own.

Unknown is not zero in meaning, but it is zero in the pillar rollup. If you cannot find
the artifact, the cell stays `unknown`. Never score from reputation. Where you make a
judgment call between two anchors, say so in `finding`.

### Onchain items the nightly job can re-check

Add a `check` to an onchain item that records a role or parameter (owner, pauser, proxy
admin, Safe threshold, timelock delay):

```yaml
check:
  call: "0x8da5cb5b"     # calldata: `cast calldata "owner()"`
  expect: "0x000000000000000000000000<owner address, lowercase, no 0x>"
# or
check:
  slot: "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"  # EIP-1967 admin
  expect: "0x...64 hex..."
```

`expect` is the raw 32-byte word returned at `block_number`. The nightly job reads the
same word at the latest block and flags `drift: true` if it changed. It never edits scores, but a
drifted cell counts as unknown in the pillar rollup until a human re-checks it and removes the flag.

### Country availability (displayed, never scored)

Add an optional `availability` block: `model` (`global`, `allowlist` or `blocklist`), `countries`
(ISO 3166-1 alpha-2 codes, `XK` for Kosovo, or `EU`/`EEA` from `data/regions.yaml`), an optional
`note` for sub-national limits or product variants, `evidence` (the provider's own terms, docs or
code, with `quote` for documents) and `checked_at`. CI checks the codes and the evidence rules.
Comparison sites and press are not sufficient. If the provider publishes no country list, leave
the block out; the site shows "no evidence either way".

### Operational and procurement layer (displayed, never scored)

Facts live in `data/operational/<slug>.yaml`, validated against `schema/operational.schema.json`
and `data/operational-criteria.yaml`. Each fact has `status` (`evidenced`, `attested`, `unknown`,
`absent`, `not_applicable`), a `value` where evidenced, `evidence` and/or `refs` (pointers to
evidence already in the provider file, `{criterion, index}`), `assessed_by` and `review`.

- `evidenced` needs verified or documented evidence; a provider's own statement makes a fact
  `attested`, never evidenced. `absent` needs evidence of what was searched. `not_applicable`
  needs a `reason` and a `burden` (`institution` or `none`).
- Controls marked `applies: operator` or `custodial` cannot be `absent` on a rail with no required
  closed component or with self-custody; use `not_applicable`. The site implies that state when
  the fact is missing.
- Automatable controls (B2.1, B2.3, B8.2, B9.x) are filled by `npm run repo-facts` from the
  public repositories; do not hand-write them unless you have better evidence, and then set
  `assessed_by` to yourself so the bot leaves them alone.
- `volume` is computed by `npm run volumes` from `volume.spec` over the provider's listed
  contracts only; never type a volume figure by hand. Use `not_observable` or `not_verifiable`
  with a reason where settlement cannot be read from a chain.

### Right of reply

Providers may set `provider_response` on any cell by PR. It is shown beside the score
and never changes it. If your response links new admissible evidence, change the score
in the same PR.

## Review

`CODEOWNERS` names the maintainers for `data/`. Every PR touching a score needs CI passing and
one maintainer review; a PR setting a score of 2 or 3 needs two reviewers, at least one not
affiliated with the contributor. The reviewer runs each `recheck` command and records the review
on the cell. `npm run review-list` writes the outstanding checklist to `docs/seed-review.md`.

Declare conflicts of interest in the PR. Nobody affiliated with a provider approves changes to
that provider's ratings.

Disputes: a provider who contests a rating opens an issue or PR. A maintainer responds within
30 days; the provider can appeal to a second maintainer.
