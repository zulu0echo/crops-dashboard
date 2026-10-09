# Tornado Cash: research log

Assessed 2026-10-07 by the AI research agent (seed). The scores are in `data/providers/tornado-cash.yaml`. This log records evidence only. It contains no usage instructions.

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com. publicnode serves state only for recent blocks (older reads return HTTP 403 "Archive requests require a personal token"), so the reads span several blocks:
  - 26140925: InstanceRegistry `instances()` for all 19 instances (state 1 = enabled), pool balances.
  - 26141280: `operator()`, `verifier()` and EIP-1967 slots on the pools; proxy slots on router, registries, FeeManager, governance and verifier; governance EXECUTION_DELAY (172800), VOTING_PERIOD (432000), QUORUM_VOTES (1e23), PROPOSAL_THRESHOLD (1e21).
  - 26141552: ETH 1 pool `operator()`, router and RelayerRegistry `governance()`, RelayerRegistry `minStakeAmount` (5000 TORN), `proposalCount` (72).
  - 26141584: USDC/USDT blacklist status of the four stablecoin pools (all false), raw EXECUTION_DELAY, ENS owner of tornadocash.eth (= governance 0x5efd…A1Ce).
- Repos: tornado-core@7033f344 (tag v2.0, the deployed build) and @1ef6a263 (master); tornado-classic-ui@a83fae07; tornado-cli@378ddf8b; tornado-governance@6464973b; circomlib fork @c372f14d; abdk-consulting/audits@57af593b.

## Unit of assessment

- **Primary chain: Ethereum (1).** The classic UI config lists netId1 first with deployedBlock 9116966, and the onchain InstanceRegistry lists 19 enabled mainnet instances. In scope: the 4 ETH pools and 8 stablecoin pools (DAI ×4, USDC ×2, USDT ×2), the verifier and the hasher. Excluded: cDAI and WBTC pools, other chains, Nova, and governance-only contracts (staking, vesting). The router, registries and governance are assessed as optional components, because the pools can be called directly.
- **Canonical source.** github.com/tornadocash still exists, but all 47 repos are archived, with the last push on 2022-08-22. We treat it as canonical for the immutable pools, circuits and clients, because the deployed pool source matches tornado-core v2.0. The governance-era router and registries are public only as Sourcify source. We did not review later community repositories.

## What we searched

- `gh repo list tornadocash`: licences and archive state for every repo; SHAs resolved via the API.
- Pool source: Sourcify v2 for all 12 pools (`match`), the verifier (`match`), the router, InstanceRegistry, RelayerRegistry and FeeManager implementations (`exact_match`), and governance (`match`). The hasher 0x8358…28fe has no Sourcify record. Etherscan requests timed out or were challenged, and we did not bypass that. We diffed the Sourcify source of the ETH 1 pool against tornado-core v2.0: Tornado and MerkleTreeWithHistory are identical apart from CRLF line endings. The compiler (0.5.11, optimizer 200) matches truffle-config.js at v2.0. The DAI 10k/100k pools are a later 0.7.6 build with no operator.
- Onchain roles: `operator()` is zero on every 0.5.11 pool. The 0.1 ETH pool's extra migrate functions are operator-only, and therefore dead. No pool, nor the verifier or router, has a proxy. RelayerRegistry, InstanceRegistry and FeeManager are proxies whose admin is governance, and governance is its own admin (LoopbackProxy).
- Router (Sourcify source): deposit and withdraw refuse DISABLED instances and call `RelayerRegistry.burn`, which lets non-relayer senders through ("Only custom relayer" branch). `rescueTokens` is governance-only.
- Governance: `execute()` delegatecalls the proposal (tornado-governance Governance.sol L184-L200). We read proposals(20) onchain: target 0xC503…752D, ending 2023-05-18, executed. Sourcify records the target's creation at block 17299150 (2023-05-20), and its code has an owner-only selfdestruct. We describe only that onchain state. We did not reconstruct the May 2023 takeover in detail. The 2024 IPFS frontend backdoor was not evidenced from a primary source, so it is mentioned only in notes.
- Frontend: tornado-classic-ui source read at the pinned commit, never run or built. It has no analytics dependencies and sets a CSP. It runs a Chainalysis oracle check on wallet connect, followed by a redirect. The RPC is selectable in Settings. The Graph URLs are hardcoded, with an RPC fallback. The approval defaults to unlimited. RPC keys are baked into the bundle from env.
- CLI: tornado-core src/cli.js calls the pool directly. tornado-cli calls the router and pings ip.tornado.cash; its package.json says ISC but it has no LICENSE file. The `tornado-cli` npm package (0.0.1) could not be tied to the org, so it is not used as `package` evidence.
- Audits: ABDK reports are in abdk-consulting/audits/tornado. The Solidity audit pins peppersec/tornado-mixer 0484408e and links fix commits. `gh api compare` shows v2.0 is 107 commits later, with contract changes. tornado.cash audit links do not resolve. We found no bounty and no SECURITY file.
- Legal context: Treasury press releases jy0916 and sb0057, OFAC recent-actions 20250321, the Fifth Circuit opinion 23-50669-CV0.pdf (text extracted: the immutable smart contracts are not property and cannot be blocked under IEEPA), the SDNY charge announcement, and Rechtbank Oost-Brabant ECLI:NL:RBOBR:2024:2069 (summary read via data.rechtspraak.nl). We did not verify trial outcomes or appeals after these.

## What we did not find or do

- No transactions, deposits or withdrawals, no UI run, no network traces, no self-host attempt (O3 capped at 1).
- We did not inspect the frontend build currently served at tornadocash.eth, or current relayer builds.
- No Etherscan verification check for the hasher.
- No primary post-mortem for the May 2023 takeover or the 2024 frontend incident.

## Judgment calls

- **C1 = 3 and S2 = 3**: the pools are the settlement contracts, and they have no live admin and no proxy. Governance control over the registries reaches only the optional router path and the frontend name.
- **C3 = 3**: relayers are optional for settlement. Without one, the withdrawer needs gas from elsewhere, which affects privacy, not settlement.
- **C4 = 2**: the substance fits 3 (neutral pools, edge screening visible in code, bypassable), but there is no package or trace, and the live UI build was not inspected.
- **O1 = 1**: the pools are partial matches, and the hasher is unverified.
- **O2 = 1**: everything is public on GitHub but archived. The live UI and relayer builds were not shown to be public, so we take the lower anchor.
- **O4 = 2**: no API is needed, so the ABIs and events cover the interface. There is no export.
- **F1 = 2**: circomlib's licence is stated only in package.json, and the optional repos are unlicensed.
- **F3 = 2, P1 = 2**: code-only evidence, with no reproduction or trace.
- **P3 = 3**: scored from what the chain and code reveal. Anonymity-set size and timing heuristics are behavioural and noted in the finding.
- **P4 = 2, P5 = 2**: the Graph endpoint is hardcoded in the optional UI. The required path uses only the user's RPC.
- **S3 = 1**: the UI default is an unlimited approval to the immutable router. The core client uses an exact approval.
- **S4 = 2**: derived from S1=3, C2=3, C3=3, O3=1.
- **S6 = 1**: the audit is pinned to a commit 107 commits before the deployed tag.

## Recheck RPC

All `recheck` commands use https://ethereum-rpc.publicnode.com at the latest block. The nightly `check` words are the raw 32-byte returns at the cited blocks.
