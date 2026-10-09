# Railgun: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/railgun.yaml`. This log records evidence only. It contains no usage instructions.

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com at block 26153471. Delegator GrantPermission logs via https://rpc.mevblocker.io (RevokePermission and OwnershipTransferred queries returned "service temporarily unavailable" three times; current state was read with `checkPermission` and `owner()` instead).
- Repos: Railgun-Privacy/contract@36bcf5ed, Railgun-Privacy/circuits-v2@0aa2d137, Railgun-Community/deployments@68d93979, engine@6e2614d5, wallet@5c9d04c8, shared-models@b37e643e, waku-broadcaster-client@ef8d2b68, private-proof-of-innocence@4b1eaf6e, subsquid-integration@49922b3a, Railway-Wallet/Railway-Wallet@e9398a1c.
- npm: @railgun-community/wallet 10.9.0 (gitHead 5c9d04c8 = pinned commit), engine 9.6.0 (gitHead = pinned engine commit). npm `latest` is wallet 11.2.0 / engine 9.8.0, published from commits not on the default branch.
- Audit: abdk-consulting/audits@57af593b railgun/ABDK_Railgun_CircomSolidity_v_2_0.pdf (text extracted with a small zlib script; no PDF tools installed).

## Unit of assessment

- **Primary chain: Ethereum (1).** The deployments repo shows Ethereum is the only chain with the governance stack and no L1Sender/L2Executor, and shared-models lists Ethereum first. In scope: RailgunSmartWallet proxy 0xFA70…a4b9, implementation 0xD662…6A0C (deployed at block 25641630), ProxyAdmin 0x4F8E…65c8, Delegator 0xB6d5…B53B, Voting 0xc480…A3CC.
- Excluded: BSC, Polygon, Arbitrum deployments; V3 contracts (Ethereum `supportsV3: false`); RelayAdapt; RAIL token, staking and treasury.
- Railgun has no first-party frontend. Railway Wallet (Right to Privacy Foundation, AGPL-3.0) is assessed as the reference client and listed as a non-required component.

## What we searched

- `gh repo list` for Railgun-Privacy (3 repos) and Railgun-Community (33). GitHub's licence detector shows none for all; we read LICENSE files directly. Contracts: package.json "UNLICENSED", no LICENSE; a 2021 License.md said "No License is provided for any party under any circumstances" and was removed in 2022. circuits-v2 License.md says the same. Engine, wallet, shared-models, waku-broadcaster-client packages, PPOI node and subsquid-integration are MIT.
- Contracts read at 36bcf5ed: Proxy.sol (upgrade, pause, unpause, notPaused), ProxyAdmin.sol, Delegator.sol (permission table), VkeySetter.sol (state machine; commit needs governance), Voting.sol (timing constants), RailgunSmartWallet.sol, RailgunLogic.sol (fees, events, safety vectors), TokenBlocklist.sol. No address or country check; grep for sanction/ofac/country in contracts returns nothing.
- Sourcify v2: proxy, ProxyAdmin, Delegator, Voting `exact_match`; implementation `match`. Sourcify sources of the implementation equal contracts/logic at 36bcf5ed apart from CRLF and a trailing newline.
- Onchain: implementation and admin slots; ProxyAdmin.owner = Delegator; Delegator.owner = Voting; paused slot (keccak("eip1967.proxy.paused")-1) = 0; shieldFee = unshieldFee = 25; treasury = 0xE8A8…FF40; Voting EXECUTION_START_OFFSET 604800, VOTING_START_OFFSET 172800, 33 proposals. Delegator GrantPermission logs: pause/unpause for three EOAs (block 12977000), now false; setVerificationKey for two VKeySetter contracts (owners are EOAs, state SETTING).
- SDK: grepped wallet/engine/shared-models for endpoints (Subsquid squids.live hardcoded in generated GraphQL client; The Graph for V3; ipfs-lb.com gateway), POI (optional `poiNodeURLs`), OFAC list (175 checksummed addresses; the check lower-cases the input, so it never matches), approvals (none in SDK), analytics (none).
- Railway: grepped for endpoints (price APIs, railway.xyz remote config, beacon.railgun.ch, Chainalysis list mentioned in POI text), analytics (none in manifests except @fingerprintjs/fingerprintjs on desktop, used locally as an AES key), approvals (2^256-1 on shield), API keys (none), country gates (none). Remote config read with curl: `proxyPoiAggregatorUrl` = https://ppoi.fdi.network. Railway privacy and EULA pages read; no country list.
- Docs: docs.railgun.org pages and llms.txt searched for audits and bounty; none listed. Trail of Bits publications README lists a RAILGUN engagement (Feb 2022) with no report link.

## What we did not find or do

- No audit of the deployed implementation; no SECURITY file or bounty programme.
- No transactions, UI runs, traces or self-host attempts (O3 capped at 1).
- No primary legal sources about Railgun were found, so `context` is omitted.

## Judgment calls

- **C1 = 2, S2 = 2, S1 = 2**: token governance with a 7-day minimum execution delay is treated as the timelocked multisig the anchors describe; user exit (unshield) is immediate. No notice channel named.
- **C4 = 3**: neutral contracts, edge filtering disclosed in code with named sources, bypassable via C2; package evidence is the wallet npm release built from the pinned commit. The SDK OFAC check is ineffective because of a case mismatch; noted, not scored.
- **C5 = 0**: open token set, not enumerable; freeze risks not stated.
- **O2 = 2**: hosted indexer, POI aggregator and broadcaster builds not tied to public commits.
- **F1 = 0**: contracts and circuits explicitly unlicensed.
- **P1 = 0**: fingerprinting library in Railway desktop, used locally; the anchor names presence.
- **S3 = 0**: Railway approves 2^256-1 to the upgradeable proxy without a visible label.
- **S5 = 3**: no secrets in SDK or Railway source; package pinned.
- **S6 = 1**: ABDK audit covers an early version, not the deployed code.

## Operational 2026-10-09

Facts are in `data/operational/railgun.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.** The proxy was read at block 26153698: `shieldFee` = `unshieldFee` = 25 bps and `nftFee` = 0. The one FeeChange event since deployment (block 14737691) set these values. Broadcaster premiums are taken from docs.railgun.org (railgun-deductions.md), which says they are set per broadcaster, at about 10% of gas.
- **Deployment.** Sourcify creation data and the receipt (read via rpc.mevblocker.io, because publicnode does not serve old receipts) show the proxy was created at block 14693013 on 2022-05-01. The Delegator's 2021 permission logs show governance contracts existed earlier; any earlier settlement contract was not traced.
- **Changes.** We read the proxy's ProxyUpgrade, FeeChange and TreasuryChange logs over the full range. There were five upgrades: 2022-05-08 (setup), 2022-11-29, 2023-03-09, 2025-07-28 and 2026-08-14 (the current 0xD662…6A0C). The treasury changed on 2022-07-24. The governance proposal texts were not read.
- **Incidents.** None found:
  - no ProxyPause events;
  - no GitHub security advisories on contract or engine;
  - no post-mortem in the docs index.
- **Entity.** None disclosed. We searched the docs index (llms.txt), railgun.org and both GitHub orgs, and recorded the result as `absent`.
- **Licences.** `not_applicable`, because no operating entity runs the rail.
- **Volume spec.** The Unshield event (topic0 0xd93c…5284) on the proxy, with the amount in word 4 and the token in word 2; we checked these positions on a live log. Judgment call: private transfers are not observable, so the spec measures exits from the pool only.
- **Group B facts recorded.**
  - B1.4 refs S6.
  - B10.1: docs, logical view only.
  - B11.2: the onchain fee switch to the treasury and the staker distribution.
  - B12.1 is absent: PPOI uses list-based screening only.
- **B2.2 not set.** There is no SECURITY policy, and the rail has no required closed component, so the control is implied not applicable.
