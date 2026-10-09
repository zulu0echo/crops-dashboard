# Aleo: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/aleo.yaml`. This log records evidence only. It contains no usage instructions.

## Deployed?

Yes. The Provable API reported Aleo mainnet at height 22,659,198 on 2026-10-09. Consensus version V21 has been active since height 22,437,000, according to `consensus_heights.rs` L165-L190. A committee of 23 validators was read from the same API.

## Pins

- ProvableHQ/snarkVM@29343ebb (tag v4.11.0)
- ProvableHQ/snarkOS@493fca39 (tag v4.11.0)
- ProvableHQ/sdk@9bbe5e63 (tag v0.12.0); npm `@provablehq/sdk@0.12.0`, integrity sha512-xGOt…9VIQ==

## Unit of assessment

- **Primary chain.** Aleo mainnet, `aleo:0`. This is the mainnet id in the registered CAIP-2 `aleo` namespace (ChainAgnostic/namespaces aleo/caip2.md).
- **Settlement path.** The built-in `credits.aleo` program: `transfer_private` with `fee_private`, plus the public and mixed variants.
- **Required path.**
  - The validator committee.
  - `credits.aleo` and snarkVM.
  - A snarkOS node and the developer CLI.
  - The proving parameters, which are downloaded from Provable hosts.
- **Optional.** The SDK, the Provable API, delegated proving and record scanning, and consumer wallets (Shield, Leo Wallet, Puzzle). We found no public source for any of the consumer wallets.

## What we searched

- **snarkVM.**
  - `synthesizer/src/restrictions/mod.rs`: a consensus-level registry that can restrict programs, functions or public and constant argument values by block range.
  - `parameters/src/mainnet/resources/restrictions.json`: empty, and unchanged since June 2024 (e8e59b7f, e579d0a9).
  - `consensus_heights.rs`: versions V1 to V21 on mainnet.
  - `credits.aleo`: the transfer and fee functions; `bond_validator` needs 10M credits.
  - `parameters/src/mainnet/mod.rs` L25-L42: remote parameters come from parameters.provable.com with an S3 fallback.
- **snarkOS.**
  - `cli/src/commands/developer/transfer_private.rs`: takes `--endpoint` and `--broadcast`, and needs a fee record.
  - `developer/mod.rs` L80: `DEFAULT_ENDPOINT` is api.explorer.provable.com/v2.
  - README: validator telemetry is local metrics only.
- **SDK.**
  - `program-manager.ts` L597-L610: the default host is edge.provable.com when none is given.
  - `program-manager.ts` L3266-L3315: the transfer type and private or public fee are explicit parameters.
  - `network-client.ts`: optional gateway keys, a prover URI and a record-scanner URI.
  - `package.json`: no analytics.
  - The demo website imports Amplitude, but the init call is commented out.
- **Deployed program.** We compared the mainnet `credits.aleo` text from `api.explorer.provable.com/v1/mainnet/program/credits.aleo` with the snarkVM source. With comments removed, the two match token for token (1,471 tokens).
- **Committee.** `api.explorer.provable.com/v1/mainnet/latest/committee` returned 23 members, 21 of them open to delegation, with about 1.05 billion credits bonded.
- **Licensing.**
  - snarkVM and snarkOS moved from GPL to Apache-2.0 on 2023-05-21 (b8cd7cbc and 2f449c59).
  - The SDK and Leo are GPL-3.0.
  - We found no CLA.
- **Code search on 2026-10-09** for country, geoip and telemetry in snarkOS, and for country, analytics and sentry in the SDK. We found no client-side gate. The SDK hits are licence text and the demo website's terms and privacy pages.
- **Audits and bounty.** snarkVM SECURITY.md L1-L11 sends reports to GitHub issues or email and mentions no bounty. The repo trees contain no audit reports.

## What we did not find or do

- We found no public source for any consumer wallet, and no first-party country list. The hosted API was not inspected beyond the reads above.
- No audit report pinned to a commit, so S6 is unknown.
- **Chain reads went through Provable's hosted API.** We did not run our own node, so a reviewer should treat these reads as dependent on that API.
- No `context`: we found no primary legal source specific to Aleo.
- No transactions, node runs, builds, traces or self-host attempts.

## Judgment calls

- **C1 = 1.** credits.aleo has no admin. However, consensus has a purpose-built restrictions list that can block named functions or public argument values, such as an address, from a chosen height once validators run a release containing it. The list is empty today.
- **C2, S1 capped at 2.** These are schema gaps; see below.
- **C3 = 2.** The proving parameters have no download host independent of Provable, and the API defaults to Provable but can be overridden.
- **C4 = 2.** Settlement is neutral today, but a filtering mechanism exists in the settlement layer. There is no package or trace record.
- **O1 = 2.** The deployed program matches the source exactly through an explorer-style API. Sourcify does not cover Aleo.
- **O2 = 2.** The default API backend and the common wallets are closed.
- **F2 = 0.** This is the literal anchor (a prior relicense event, GPL to Apache in 2023). The change was permissive, and a reviewer may prefer 2.
- **P3 = 3.** This is what a private transfer with a private fee reveals. Public fees and public transfers reveal the payer, and the finding says so.
- **S2 = 2.** Rule changes come through releases with fixed heights adopted by 23 validators. There have been 21 versions in about two years, and the cadence is noted in the finding.
- **S4 = 1.** Spending one's own funds needs proving parameters fetched only from Provable-run hosts unless they are cached, and no repo documents a manual workaround.
- **P1 = 2.** We have package evidence but no trace, so the brief's cap at 2 applies.

## Schema gaps hit

- Aleo addresses (`aleo1…`, bech32, 63 characters) and program IDs fit neither schema address pattern, so we could not cite chain state as `kind: onchain`. The height, committee and deployed-program reads are recorded in repo evidence details with curl rechecks, and C1, C2, S1 and S2 are capped.

## Recheck

- The `credits.aleo` match: the diff command in the O1 recheck.
- Height: `curl -s https://api.explorer.provable.com/v1/mainnet/block/height/latest`.
- Committee: `curl -s https://api.explorer.provable.com/v1/mainnet/latest/committee | jq '.members|length'`.

## Operational 2026-10-09

Facts are in `data/operational/aleo.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.**
  - Base fee: 1 microcredit per byte of the execution (quadratic above 5,000 bytes) plus the finalize cost. Sources: snarkVM@29343ebb `cost.rs` L576-L583 and `console/network/src/lib.rs` L144-L153.
  - Optional priority fee, paid through credits.aleo `fee_private` or `fee_public` (L988-L1046).
  - Fees go to validators in the block reward (`target.rs` L54-L69).
  - Sample: a transfer_private in block 22,664,958 (2026-10-09) paid a public fee of 2,308 microcredits. Nearby transfer_public transactions paid 56,166.
- **Deployment.** Genesis block 0 at 2024-09-04 15:00:00 UTC, read from api.explorer.provable.com/v1/mainnet/block/0. Changes list six consensus versions, with dates from the activation blocks:

  | Version | Height | Date |
  | --- | --- | --- |
  | V2 | 2800000 | 2024-12-09 |
  | V8 | 9430000 | 2025-07-22 |
  | V9 | 10272000 | 2025-08-18 |
  | V10 | 11205000 | 2025-09-16 |
  | V18 | 20794000 | 2026-08-04 |
  | V21 | 22437000 | 2026-10-01 |

- **Incidents.** Empty list, with the search recorded:
  - No security advisories in snarkVM, snarkOS, sdk or leo.
  - Issue search for halts finds only devnet, isonet and prerelease reports.
  - No post-mortem on the aleo.org blog.
- **Entity.** Provable Inc., Delaware (provable.com terms quote). Judgment call: Provable is recorded because it maintains snarkVM and snarkOS. The Aleo Network Foundation runs aleo.org and grants, but its jurisdiction was not found. The Delaware register search sits behind a CAPTCHA and was not used.
- **Licences and cashout.** Both `not_applicable`, burden institution. Judgment call: Provable runs optional hosted services but is not in the settlement path.
- **Volume.** `not_observable`: private records hide amounts, and the script reads EVM logs only.
- **Group B facts recorded.**
  - B5.2: Provable API registration issues an API key, exchanged for a Bearer JWT. Rate limits are 5 per second and 100,000 per day. Rotation, scoping and expiry are not documented.
  - B6.3: Provable privacy notice, "no longer than reasonably necessary", with no fixed periods.
  - B10.1: AleoNet/aleo-docs-source@fe73f750 `learn/network/architecture.mdx`.
  - B11.1: Provable Inc. (Delaware, California law). The Shield Wallet terms refer API use to "API Terms ... available at [LINK]", a literal placeholder, and no API terms page exists (404).
  - B11.2: no protocol funding stream, plus ANF grants of up to $100K.
  - B12.1 is absent (refs C4; Provable states no automated decision-making).
- **Not set.**
  - B2.2: snarkVM's SECURITY.md has no timelines.
  - B3.4: status.provable.com did not resolve, and an operator control cannot be absent on an operator-free rail.
  - The other operator controls.
- **Parameter hosts.** parameters.provable.com and its S3 fallback have no published terms or SLA. The files are checked against checksums compiled into snarkVM (`parameters/src/mainnet/mod.rs` L25-L42).
