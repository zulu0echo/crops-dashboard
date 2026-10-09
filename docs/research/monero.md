# Monero: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/monero.yaml`. This log records evidence only. It contains no usage instructions.

## Deployed?

Yes. Monero mainnet is a live proof-of-work chain. The current release is v0.18.5.3 (2026-10-06), the last hard fork (v16) was at height 2,689,608 in August 2022, and the README lists the next fork as undetermined.

## Pins

- monero-project/monero@22578c3f (tag v0.18.5.3)
- monero-project/monero-gui@d7c2f13d (tag v0.18.5.3)
- monero-project/meta@97fb74b0
- monero-project/monero-site@5a596d19
- monero-project/research-lab@a4ceef2e (tree listing only)

## Unit of assessment

- **Primary chain.** Monero mainnet, `monero:418015bb9ae982a1975da7d79277c270`. This is the mainnet id in the registered CAIP-2 `monero` namespace (ChainAgnostic/namespaces monero/caip2.md at 463bae56).
- **Required path.** The consensus network, a monerod node (the user's own or a remote one), and the wallet2 library with the CLI, both in the monero repo. The GUI, remote and bootstrap nodes, and MoneroPulse DNS are optional.

## What we searched

- **Consensus and upgrades.**
  - `src/hardforks/hardforks.cpp`: the mainnet fork table.
  - README L120-L150: the upgrade schedule.
  - `src/cryptonote_core/blockchain.cpp` L3264-L3325: ring size 16 from fork v15, with uniform ring sizes.
  - `cryptonote_config.h`: Bulletproofs+ and view tags from fork v15.
- **Core-team levers.**
  - `checkpoints.cpp` L315-L338: the MoneroPulse DNS checkpoint domains.
  - `cryptonote_core.cpp` L119-L180: `enforce-dns-checkpointing` defaults to false, `disable-dns-checkpoints` exists, and `check-updates` defaults to notify.
- **Wallet paths.**
  - GUI `main.qml` L786-L795: simple modes start monerod with bootstrap address "auto".
  - GUI `main.qml` L1530-L1548: the remote-node list in settings.
  - `core_rpc_server.cpp` L197-L250: "auto" picks a public node advertised on P2P.
  - `simplewallet.cpp` L9025-L9045: `export_transfers` writes a CSV.
  - `core_rpc_server_commands_defs.h` L614-L650: `send_raw_transaction`.
- **Licensing.**
  - `monero` and `monero-gui` are BSD-3-Clause, and `monero-site` is BSD-3-Clause. `meta` has no licence file and is not listed under repos because nothing runs from it.
  - The LICENSE history since 2016 shows only copyright-year updates.
  - docs/CONTRIBUTING.md L104-L110 says patches are owned by their authors and there must be no copyright assignment.
- **Code search on 2026-10-09** for country, analytics and telemetry in monero and monero-gui. The only hits were an old mnemonic word list and a Trezor protobuf.
- **Audits and bounty.**
  - The CLSAG audit report (Aumasson and Vennard, 2020) is at `monero-site/resources/research-lab/audits/clsag.pdf`.
  - Bulletproofs audit statements of work are in `research-lab/audits/BP`.
  - `meta/VULNERABILITY_RESPONSE_PROCESS.md` defines an XMR bounty with code-only scope. The README links HackerOne.

## What we did not find or do

- We did not open the audit PDFs, so we have no audited commit to compare with v0.18.5.3.
- No reproducible-build check (contrib/guix), so O1 is unknown.
- **No `context`.** EUR-Lex returned an HTTP 202 challenge for Regulation (EU) 2024/1624. We did not bypass it.
- No transactions, node runs, builds, traces or self-host attempts.

## Judgment calls

- **C1, C2, S1, S2 capped at 2.** There are no contracts, and score 3 needs onchain contract evidence; this is a schema gap. The substance of each is recorded in the finding.
- **C4, P1, S3, S5 = 2.** Each is absent in code, but there is no package or trace record.
- **O4 = 2.** The CSV export and RPC structs are in the repo. We were unsure whether C++ serialization structs count as an API schema, so we took the lower anchor.
- **F1 = 3.** Every repo needed to run the rail is BSD-3-Clause.
- **F2 = 3.** We read the no-assignment and share-alike rules in CONTRIBUTING as the written licence-stability commitment.
- **P3 = 3.** Stealth addresses, RingCT and ring size 16 apply by default. Decoy-selection and timing heuristics are noted in the finding and not scored.
- **S6 = 1.** Audit reports and a bounty with scope exist, but no pinned audited commit was shown.
- **S4 = 2.** Derived from S1, C2, C3 and O3=1.

## Schema gaps hit

- Monero has no contracts. Its addresses (95 characters) fit neither address pattern. That is why `contracts: []` and the caps above.

## Recheck

All rechecks use `gh api` at the pinned commits, or `gh search code` on default branches.

## Operational 2026-10-09

Facts are in `data/operational/monero.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.** Consensus minimum per byte since fork v15: 0.95 x block reward x 3000 / median weight², with a 2% acceptance buffer (monero@22578c3f `blockchain.cpp` L3621-L3718). Sample from xmrchain.net/api/block/3780260 (2026-10-09): about 0.00049 XMR for a 1.5 kB two-output transaction. There is no provider or developer fee.
- **Deployment.** Block 1 on 2014-04-18 10:49:53 UTC. The genesis block (height 0, hash 418015bb…) carries timestamp 0. Fork heights are from the README table (L120-L145) and `hardforks.cpp` L34-L76; dates were checked against the activation blocks on xmrchain.net:

  | Fork | Height | Date |
  | --- | --- | --- |
  | v4 (RingCT allowed) | 1220516 | 2017-01-10 |
  | v8/v9 (Bulletproofs) | 1685555 | 2018-10-18 |
  | v12 (RandomX) | 1978433 | 2019-11-30 |
  | v13/v14 (CLSAG) | 2210000 | 2020-10-17 |
  | v15/v16 (ring 16, BP+, view tags) | 2688888 | 2022-08-13 |

  Judgment call: block 1 is recorded as the first deployment because the genesis block has no real timestamp.
- **Incidents.** From the project's own post-mortems in monero-site@5a596d19 `_posts/`: the 2017 key-image inflation bug (never exploited on Monero), the 2018 multiple-counting and burning bugs (wallet-side, exchange losses not stated), the 2021 and 2023 decoy-selection bugs and the 2025 find_and_save_rings bug (privacy only), and the 2023 CCS wallet drain of 2,675.73 XMR (project donation funds). The 2021 multisig notice is not listed.
- **Entity.** `absent`. The site FAQ (en.yml L468) says no company runs Monero; the Core Team is an informal group. Judgment call: absent (none exists) rather than unknown.
- **Licences and cashout.** Both `not_applicable`, burden institution.
- **Volume.** `not_observable`: ring signatures, stealth addresses and RingCT hide parties and amounts, and there is no contract address.
- **Group B facts recorded.**
  - B2.2: the meta repo's Vulnerability Response Process (L55-L131) states 3 working days to respond, point release for HIGH and MEDIUM, public notice within 3 working days of the patch for HIGH, and 90 days to complete. Recorded as evidenced even though it sets no per-severity patch deadline.
  - B10.1: monero-docs@fff7b8ec `interacting/overview.md` L51-L96 (node and wallet split, interfaces) plus docs/LEVIN_PROTOCOL.md.
  - B11.2: donations only (CCS and General Fund, 2019-12-03 Core Team post; the bounty is donation-funded).
  - B12.1 is absent (refs C4).
- **Not set.** All operator and custodial controls: the rail is operator-free and Monero runs no hosted service. MoneroPulse DNS is optional and advisory.
