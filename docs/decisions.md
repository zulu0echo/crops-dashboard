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

**Country availability is evidence, not a score (2026-10-09).** Each provider may carry an `availability` block (global, allowlist or blocklist of ISO codes, with the provider's own terms, docs or code as evidence). The site renders a Countries index and one static page per country listing rails offered, not offered, and with no statement. Availability never enters the rollup: where a rail is offered says nothing about whether it is safe to use. Third-party listings (Card Map, review sites) are never sufficient evidence, for the same reason they cannot move a rating. Region names (EU, EEA) expand from `data/regions.yaml`; country names come from `Intl.DisplayNames` at build time so none are hardcoded.

**PSE Private Transfers list, scope (2026-10-09).** From PSE's Private Transfers Analysis the dashboard takes the analysed protocols that let a user send value on a mainnet today (26 entries), as `type: transfer`. Excluded: entries PSE marks pending, infrastructure toolkits (Zama, Inco, Fairblock, Merces), the bytecode obfuscator (Mirage), a general-purpose L2 (Coti) and the enterprise validiums (Scroll Cloak, ZKsync Prividium), which are not themselves rails a payer uses. PSE's analysis is used only to find the products; it is third-party and cannot be evidence. Own-chain protocols use CAIP-2 chain ids and rest on their public repos for eligibility.

**Operational and procurement layer (2026-10-09).** Built from `docs/build-prompt-operational-layer.md`; design and decisions in `docs/operational-layer-design.md`, open steps in `docs/operational-layer-plan.md`. One parallel file per provider, five fact states (evidenced, attested, absent, not applicable, unknown), no ratings, no composite, never in a CROPS pillar. Group B controls derive from a UN humanitarian agency's vendor requirements and are recorded as the provider's position, not as a requirement. Repository practice is read automatically from GitHub; volumes only from reproducible chain queries over listed contracts.

**PSE batch P4 (2026-10-09): nothing deployed.** Nightfall (mainnet untested in its own docs, config has no mainnet), Intmax (deposits and block posting paused since February 2026; exits run by an operator role; app shows a suspension notice, archived), Plasma Fold (archived prototype, no contracts) and Pretty Good Payments (one mainnet Entrypoint with seven deployer-only transactions, test parameters, unlicensed). None got a provider file; this note is the record.

**PSE batch P7 (2026-10-09).** Houdini Swap is `type: incumbent`: private swaps are created through its hosted Partner API and settle through partner exchanges, and the two public repositories are API clients. Miden has no mainnet usable today (the SDK's mainnet endpoint does not resolve; official configs and docs list only testnet and devnet; its own posts say mainnet is "coming"), so no file was written.

**Open after PSE batch P2 (2026-10-09): own-chain protocols and the contract-provenance rule.** Zcash, Monero, Aleo and Aztec have no contract addresses, so under the red-team rule that a 3 on C1, C2, S1 or S2 needs onchain evidence about a deployed contract, those four cells are capped at 2 on all four even where the substance (no admin key, direct settlement, no custody) would support 3. Likewise their Rust and C++ clients can never carry an npm `package` record, so C4, P1, P4, S3 and S5 are capped at 2 without a trace. Options: (a) keep the caps and say so on the criterion pages; (b) accept consensus-rule source at a pinned release plus a live chain read (height, activation) as the "deployed" evidence for own-chain protocols; (c) accept a release artifact hash as the client-provenance record. Not decided; the findings state the cap.

**Open: F2 "prior relicense event" read literally.** Zcash (orchard to MIT/Apache in 2023; the optional Zodl SDK to AGPL under a CLA in 2026), Aleo (GPL to Apache 2023) and Aztec (GPL-2.0 to Apache four days after its first commit) score 0 on F2 because a relicense happened, although each change was towards a more permissive licence. The anchor was written for the BUSL direction. Options: score 2 where the only relicense was to a more permissive OSI licence, or keep the literal reading. Not decided; reviewers of F2 should look at these four.

**PSE batch P3 (2026-10-09).** Hinkal (Ethereum) and Curvy (Arbitrum) got files. Bermuda has no usable mainnet: its docs list only Base Sepolia, the SDK is partners-only, and deposits need a compliance engine whose endpoints are unset placeholders; Platus is a waitlist with no contracts or protocol repository. Neither got a file.

**PSE batch P5 (2026-10-09).** Blanksquare (Base; live contracts, services dormant) and AnomaPay (BNB Chain) got transfer files. Nullmask is live on Ethereum but filed as `incumbent`: its proxy, implementation and upgrade controller are unverified everywhere and the only public repository is a landing page, so the eligibility rule leaves no verified contract or public repo needed to run it. Stellar Private Payments is testnet-only by its own README and deployment files; no file.

**PSE batch P6 (2026-10-09).** Tongo (Starknet), WORM (Ethereum) and zERC20 (BNB Chain) got transfer files. Redact is testnet-only (its roadmap says "Phase 0 - Testnet Deployment (current stage)", deployed-contract files list only testnets, and redact.money does not resolve); no file. All 26 PSE entries in scope are now resolved: 16 files written, 10 excluded as not deployed with the evidence recorded here.

**Follow-up (2026-10-09): Tuyo CROPS cells are out of date.** During operational research, Tuyo's own pages were found to name the issuer (Third National) and the card collateral contract on Base (0x221677d8…, Sourcify exact match). The CROPS provider file records neither, which affects P4 and the unknown S1, S2 and S3. Not edited in this pass; it needs a CROPS re-assessment of those cells under the normal review rules.

**Follow-up (2026-10-09): Jupiter Card S4.** Jupiter's Fees & Limits page now documents a wallet withdrawal to Solana for some cards, which contradicts the provider file's S4 finding ("no crypto withdrawal path documented"). Logged in the research log; the CROPS cell needs a re-assessment under the normal review rules.

**Follow-up (2026-10-09): Deblock availability.** Deblock's Client Terms v12.3 are reachable as a public PDF (archived at `data/archive/deblock-card-ops-terms.txt`) and state that customers must live in France. The provider file has no `availability` block because its terms were previously unreadable; an allowlist of FR can be added from that archive under the normal rules.

**First-party script for usability (2026-10-12).** `site/app.js` adds search, column sorting, filters kept in the address, pick-to-compare and print expansion. It is progressive enhancement: every page renders and every link works without it, and the controls it drives stay hidden when it does not run. It makes no network requests and uses no storage; CI fails the build if it gains a URL, `fetch`, storage or cookie access, or if any page loads a third-party or inline script. Before this the site had no client JavaScript; search and sorting cannot be done in CSS alone.

**Provider logos (2026-10-12).** One icon per provider, taken from the icon the provider's own home page declares, or from its own GitHub organisation's avatar where the site blocked automated requests, re-encoded to 64x64 PNG and committed in `site/logos/` with sources in `site/logos/SOURCES.md`. Logos identify providers only; the sources file says their use implies no endorsement or participation, and a provider can ask for removal. Providers without a usable icon show initials (Blanksquare, ether.fi Cash, Houdini Swap, Umbra, Zcash at the time of writing). Chain symbols are simplified marks drawn as inline SVG in `scripts/marks.mjs`, not copies of chain logo files.

**Security audit log (2026-10-13).** Each provider file has an `audits` block listing every published audit, formal verification, audit contest, security review or penetration test of code in its payment path (250 reports across 50 providers at first compilation), with `covers_deployed` and a `searched` line saying where the log came from. It is shown under Security and never scored; S6 still scores audits. Reports whose host refuses scripted requests carry `blocked_to_bots` and a note saying where the link is published, and the link check skips them. Follow-ups the research raised, for a reviewer (ratings were not changed):
- Ethena Pay S6 says no report is public; Guardian has published two Ethena Pay reports.
- Fuse Card: the deployed Squads v4 program hash equals the build hash named by three final audits, so the S6 and O1 findings may understate verification.
- zERC20 S6 could not read the zkSecurity report; the auditor's own page gives scope and commit.
- Aleo S6 says no audit is pinned to a commit; several logged reports state commits.
- Hinkal: a July 2026 zkSecurity report records a double-spend incident and redeployment that the ratings do not mention.
- Solayer Card leaves out Rain's shared collateral audit (funds are in Solayer-run wallets), while other Rain-template cards include it; Avici, Jupiter and Oobit include it with a note that it may not apply.
