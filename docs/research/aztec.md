# Aztec: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/aztec.yaml`. This log records evidence only. It contains no usage instructions.

## Deployed?

Yes, as "Alpha".

- **The project's own docs.** `docs/docs-participate/alpha.md` L7 says Alpha is "live on Ethereum mainnet with real staking, governance, and user transactions". The release notes for v5.0.0 (2026-07) call it the first release supported on mainnet.
- **Ethereum state at block 26,153,545.**
  - Registry 0x35b2…e298 points to canonical Rollup 0x91fF…8E34.
  - Proven checkpoint 99,016, pending 99,048.
  - 3,085 active attesters, with a committee size of 48.
- **Value is moving.** Ethereum blocks 26,144,545 to 26,153,545 show L1-to-L2 messages from a third-party OperationExecutor (0xe883…9e19) and from Nyx.money's TokenVaultPortal (0xD0b1…80d0). Both are exact matches on Sourcify.
- **Payable assets are third-party.** The protocol's own asset, Fee Juice, cannot be transferred (`fee_juice_contract` main.nr L11). Payments therefore use app-deployed tokens.

## Pins

- AztecProtocol/aztec-packages@49a59210 (tag v5.2.0). v5.2.1 (2026-10-07) changes only the barretenberg native verifier; the release notes say the network is unaffected.
- AztecProtocol/networks@7182c14b
- AztecProtocol/audit-reports@b3b60cef
- npm `@aztec/aztec.js@5.2.0`, integrity sha512-vQg1…hlg==
- Ethereum reads via https://ethereum-rpc.publicnode.com at block 26,153,545.

## Unit of assessment

- **Primary chain.** `aztec:mainnet`, as the brief directs; it is not a registered CAIP-2 namespace. The L1 contracts are on Ethereum (chain 1).
- **Required path.**
  - The L1 rollup contracts and the L2 sequencer and prover network.
  - Ethereum.
  - A node, plus the PXE and wallet.
  - Fee Juice and its portal.
  - The token contract and portal of whatever asset is paid.
- **Optional.**
  - Governance.
  - Aztec Labs' hosted RPC.
  - The network config and snapshot hosts.
  - Third-party browser wallets and fee payment contracts.

## What we searched

- **L1 contracts at the pinned commit.**
  - Rollup and RollupCore: the owner-only setters, with no pause.
  - EscapeHatch.
  - Registry: owner-only `addRollup`.
  - Governance: `propose` only from GovernanceProposer; `execute` runs arbitrary calls except to the governance asset.
  - GovernanceProposer and EmpireBase.
  - FeeJuicePortal, Inbox and Outbox: immutable, with no owner.
- **Ethereum reads (cast).**
  - Registry `owner()` and `getGovernance()` both return Governance 0x1102…B75e. `numberOfVersions()` is 3.
  - The Rollup owner is Governance, and its EIP-1967 slots are zero.
  - Escape hatch 0xF459…E51A is set.
  - Governance `getConfiguration()`: voting delay 3 days, voting 7 days, execution delay 2 days, grace period 7 days, quorum 20%, yea margin 33%, minimum votes 1e26, proposeWithLock delay 90 days. `proposalCount` is 5.
  - GovernanceProposer quorum is 600 of 1,000, with a lifetime of 5 rounds.
- **Sourcify.** Registry, Rollup, Governance, GovernanceProposer, GSE, Inbox, Outbox, FeeJuicePortal, EscapeHatch, Slasher and the AZTEC token all return `match` (partial).
- **L2 contracts.** The reference Token contract: admin and minters, `transfer_in_private` with `authorize_once`, `cancel_authwit`, and no pause or blacklist. Fee Juice is non-transferable.
- **Docs in the repo.**
  - `alpha.md`: risks, the upgrade model and the lack of state migration.
  - `limitations.md`: no audit, under-constrained circuits, `msg_sender` leaks on private-to-public calls, side-effect counts are visible, and there are no privacy-preserving node queries.
  - `how_to_use_private_fee_juice.md`: the fee payer address is recorded onchain, and there is a setup-phase public function allowlist.
  - `full-node/setup.md`.
- **Client.** `yarn-project/cli/src/utils/commands.ts` defaults the node URL to localhost:8080. The pxe, aztec.js, wallet-sdk and cli-wallet manifests contain no telemetry or analytics dependencies.
- **Deployment config.** `spartan/environments/mainnet.env` sets `RPC_CLOUD_ARMOR_POLICY_NAME=mainnet-rpc-policy` for `mainnet.rpc.aztec-labs.com`. We found no policy rules in the repo.
- **Licensing.**
  - The LICENSE went from GPL-2.0 to Apache-2.0 on 2023-02-28 (356db7c7), four days after the first commit.
  - The copyright holder changed to Aztec Foundation in 82e3c33d (2026-10-06).
  - We found no CLA.
  - The networks repo has no licence.
- **Code search on 2026-10-09** for sanction, country and geoblock. The only hits were a msgpack header and the testnet mock StakingAssetHandler.
- **Audits and bounty.**
  - The audit-reports repo holds Cantina reports for the rollup, governance and escape hatch, and other reports.
  - SECURITY.md both says a bounty is being prepared and links a Cantina bounty page.

## What we did not find or do

- **We did not read the audit PDFs,** so we cannot name an audited commit.
- **We did not verify L2 contract classes against source.**
- **We did not identify every token live on Aztec.** We cannot say whether any canonical stablecoin bridge exists; only the Nyx.money portal was sampled.
- **We could not inspect the hosted RPC's Cloud Armor rules or the third-party wallets.**
- No `context`: we found no primary legal source specific to Aztec.
- No transactions, node runs, builds, traces or self-host attempts.

## Judgment calls

- **C1, C2, S1, S2 capped at 2.** The rollup contracts are on Ethereum, but the row's primary chain is `aztec:mainnet`, and the validator rejects onchain evidence whose chain differs from the primary chain. Ethereum reads are therefore in repo evidence details with `cast` rechecks. In substance:
  - C1 is near 3: no pause, plus an escape hatch.
  - S2 is near 3: the code is immutable in place, and the governance timelock of at least 12 days exceeds the user exit of about one epoch. Forced state migrations and governance's arbitrary-call execution are noted.
- **C5 = 0.** No token list exists anywhere we looked, and the payable assets are third-party.
- **P3 = 2.** The recipient and amount are hidden, but the fee payer (usually the sender) is public unless a private fee payment contract is used. Fingerprinting is documented.
- **O1 = 2.** The L1 contracts are partial Sourcify matches; L2 contracts were not checked.
- **O2 = 3.** The full protocol stack is in one public monorepo.
- **F1 = 2.** The networks repo has no licence. It is non-critical, because the same values are compiled into the CLI.
- **F2 = 0.** This is the literal anchor (a prior relicense event, early and permissive). A reviewer may prefer 2.
- **S6 = 1.** Audit reports exist, but no pinned commit was shown, and the docs say the stack is not fully audited.
- **S4 = 2.** Derived from S1, C2, C3 and O3=1. Fee Juice can never be withdrawn, and token exits depend on portal owners.

## Schema gaps hit

- **L1 contract evidence for an L2 row.** The rollup's L1 contracts cannot be cited as `kind: onchain` with `chain_id: 1` while `primary_chain` uses `caip2: aztec:mainnet`. Aztec L2 addresses (32-byte field elements) fit neither address pattern. That is why `contracts: []` and the caps above.

## Recheck

- Ethereum reads: `cast call <address> "<sig>" --rpc-url https://ethereum-rpc.publicnode.com`, using the addresses in the notes.
- Sourcify: `curl -s https://sourcify.dev/server/v2/contract/1/<address> | jq .match`.

## Operational 2026-10-09

Facts are in `data/operational/aztec.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.**
  - Fees are paid in Fee Juice, as mana multiplied by fee per mana.
  - The L1 minimum is sequencer cost plus prover cost plus congestion cost (FeeLib.sol L269-L330).
  - A cast read on Rollup 0x91fF…8E34 at Ethereum block 26,154,934 gave getManaMinFeeAt = 2,269,387,395,825 base units per mana, with congestion at its minimum.
  - Congestion cost is burned. The remainder is split 70% to sequencers and 30% to provers (economics.md L39-L51).
  - No Aztec Labs fee. Third-party fee-paying contracts were not reviewed.
- **Deployment.**
  - Registry 0x35b2…e298 was created at Ethereum block 23,786,827, and the first rollup 0x603b…CA12 at 23,786,836 on 2025-11-13.
  - The second rollup 0xAe20…4962 followed at 24,586,322 (2026-03-04).
  - The canonical 0x91fF…8E34 is at 25,428,902 (2026-06-30).
  - Creation blocks came from Sourcify `?fields=deployment`; dates come from block headers.
  - Judgment call: the first rollup in the Registry is recorded. State does not migrate between versions.
- **Incidents.**
  - SECURITY.md L37-L44: 8 critical and 7 high vulnerabilities in v4, found by 2026-05-11.
  - GHSA-778c-2h5c-8r96 (low; an escape-hatch checkpoint can halt nodes).
  - GHSA-2hc8-mq24-76v2 (high; the barretenberg native verifier, which the v5.2.1 notes say does not affect the network).
- **Entity.** Spilsbury Holdings Limited (Aztec Labs), England and Wales, company 11093783 at Companies House, active. Aztec Foundation (Swiss Stiftung, Zug) runs aztec.network and now holds the copyright.
- **Licences.** `absent`. Neither entity's terms names a licence, and Companies House lists SIC 62012. The FCA and FINMA registers were not searched because they are client-rendered.
- **Cashout.** `not_applicable`.
- **Volume.** `not_observable`, with the reason given in the file.
- **Group B facts recorded.**
  - B6.3: Aztec Labs privacy policy, 12-month retention. It does not cover the RPC, and the RPC ingress logs every request (mainnet.env L18-L23).
  - B8.1: the hosted RPC sits behind a Cloud Armor policy whose rules are unpublished.
  - B10.1: the foundational-topics overview.
  - B11.1: no terms cover the hosted RPC. The Aztec Labs and Foundation terms cover their websites and testnet tools.
  - B11.2: protocol rewards fund operators. The Foundation stewards development.
  - B12.1 is absent (refs C4).
- **Not set.** B2.2: SECURITY.md promises acknowledgement "as soon as reasonably possible", with no timelines.
