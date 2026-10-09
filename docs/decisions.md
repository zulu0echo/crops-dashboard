# Decisions

One paragraph each. Newest at the bottom.

**No static site generator.** The site is five page types rendered from YAML with template literals in one script (`scripts/build.mjs`, about 200 lines). An SSG would add a dependency tree, a config format, and a theme layer to learn, all to produce the same HTML. Plain Node keeps the build auditable in one sitting and lets a fork change any page by editing one function. The output has no client JavaScript: the type filter uses radio buttons and the CSS `:has()` selector, and "expand" uses `<details>`. In browsers without `:has()` (pre-2023) the filter shows every row, which is the safe failure.

**Node, three runtime dependencies.** `yaml` (Node has no YAML parser), `ajv` (JSON Schema, which the spec requires CI to run), and `@noble/hashes` (keccak-256 for EIP-55 checksums; Node's OpenSSL build exposes SHA3 but not Keccak). All three are widely used, have no or minimal transitive dependencies, and are pinned exactly in `package.json` with a lockfile. Nothing else is installed: URL checks, the GitHub API, and JSON-RPC all use the built-in `fetch`.

**Cross-field rules live in the validator, not the schema.** JSON Schema handles shape. The evidence rules (score caps by tier, repo URL must contain the pinned commit, every criterion present, incumbent shape, chain consistency) are written as plain conditionals in `scripts/validate.mjs`, because expressing them in `if/then` schema blocks produces error messages contributors cannot act on. The criterion ID list is read from `data/criteria.yaml` at validation time rather than duplicated as an enum in the schema, so criteria have one source of truth.

**Spec correction: `tier: repo`.** The example provider in the build spec has an evidence item with `tier: repo`. Tier must be `verified`, `documented`, or `claimed`; `repo` is a `kind`. The schema follows the tier table, so that item would be `tier: verified, kind: repo`.

**`verified` is only for onchain and repo evidence.** The tier table defines `verified` as chain state, pinned source, or bytecode matched on Sourcify or an explorer, all of which are `kind: onchain` (a Sourcify or explorer verification page is recorded as onchain evidence for that address) or `kind: repo`. The validator rejects `verified` on `document` or `trace` items, so a contributor cannot raise the cap by relabelling a document.

**Machine-readable onchain checks.** The nightly re-check needs to know what to re-read. Free-text `detail` cannot be parsed reliably, so onchain evidence that records a role or parameter carries an optional `check` with raw calldata (or a storage slot) and the expected 32-byte word. This avoids an ABI-encoding dependency: `cast calldata "owner()"` gives the calldata once, and comparison is a string compare. Items without `check` are not re-checked; that is a visible gap in the data, not a silent one.

**Pillar cells whose minimum comes from unknown show "0?".** The rollup treats unknown as 0, as specified. When every limiting criterion is unknown the grid shows `0?` in the unknown style, so a reader can tell "proven absent" from "nobody has looked" without leaving the grid.

**Five pillars.** CROPS names four properties, but the spec's criteria split "Open Source and Free" into Open (O) and Free (F). The grid shows five pillar columns so the minimum rule does not mix visibility with licensing.

**Relative links everywhere.** Every page links with relative paths to `…/index.html`, so the same `dist/` works on GitHub Pages under a project path, on an IPFS gateway, and from `file://`.

**Staleness clock.** "Older than 180 days" is computed at build time against the build date (`BUILD_DATE`, default today). Pages are rebuilt on every merge; a nightly rebuild is not added, so a badge can lag by the time since the last merge. A fork that wants exact badges can add `schedule:` to the CI workflow.

**Rollup diff as a comment only on same-repo PRs.** GitHub gives fork PRs a read-only token. Rather than adding a `pull_request_target` workflow (which runs with write access next to untrusted code), the diff always goes to the job summary and is posted as a comment only when the PR branch is in the same repository.

**Seed research.** The four seed files were researched by agents following `docs/seed-brief.md`, with every cited commit, block, and URL read at research time. No browser network traces were run, so trace-dependent anchors (P1 "confirmed by trace", O3 "attempted") are capped and the finding says so. `docs/seed-review.md` lists every seed cell scored 2 or 3 for human re-check before the banner is removed.

## After the methodology red team (2026-10-07)

`docs/methodology-red-team.md` raised five questions for the maintainer. They were defaulted as follows so the work could proceed; each is reversible.

**Third-party claims cannot move a score.** Evidence that lowers a score must be verified, documented, or the provider's own admission (`claimed` with `by: provider`). A third-party claim is recorded in the finding and may set `disputed: true`, shown on the site. Reverse by deleting the R1 rule in `checkProvider`.

**Transparent, legally required controls get credit.** C4 now rates settlement-layer neutrality plus disclosed, bypassable edge filtering; P2 lets legally required collection, disclosed with its basis in code or a versioned repo document, reach 2. The documented-tier cap of 1 still applies, so incumbents' ratings did not rise.

**Drift counts as unknown.** A cell with any drifted evidence counts as 0 in the rollup and shows "Under review" until a human clears the flag (`isUnknown` in `scripts/rollup.mjs`).

**S4 stays in the Security minimum** but is marked derived on every page, with its sources named. Reverse by filtering `derived_from` criteria out of `rollup()`.

**Second assessor: not decided.** The inter-rater test (R6) needs a named person; the review rules (two reviewers for 2 or 3) are written into CONTRIBUTING but cannot be enforced in CI without GitHub branch rules.

**Per-cell provenance replaces the global seed flag in substance.** Every cell carries `assessed_by` and `review`. The banner now counts unreviewed ratings; `seed_pending_review` in `site/config.json` still hides it. `npm run review-list` regenerates `docs/seed-review.md` from the data, so the checklist cannot drift from what is published.

**Committed archives instead of an archive service.** Document evidence quotes its passage; pages that block automated access or render client-side are cited through a text copy committed under `data/archive/`. This keeps the no-third-party rule and makes the copy reviewable in the PR.

**Not done yet** (red team items left open): ordered-checklist anchors for every criterion and the inter-rater test (R6), "commits since pinned" and AccessControl role enumeration in the nightly job (R10), staleness windows by risk (R10), CI-runnable deploy scripts as O3 evidence (R15 is in the anchor text, not tooling), tagged dataset releases (R14; the footer shows the git commit instead).

**New provider type: `transfer` (2026-10-07).** Person-to-person value-transfer protocols, including privacy protocols such as Tornado Cash, are neither checkout, card, remittance, nor incumbent. They get their own type and grid group ("Transfers and privacy") rather than being forced into a category that would mislead readers about what they do.
