# Curvy: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/curvy.yaml`. PSE's Private Transfers Analysis was used only to find the product's own links.

## Deployed?

Yes. The V2 aggregator and vault on Arbitrum One are live:

- `getCurrentNoteIndex` 3159 and 1369 nullifier batches.
- The vault held 14,013 USDC and 2.87 ETH at block 513140605.
- The web app is at app.curvy.box. The SDK is labelled closed beta.

## Pins

- Arbitrum reads via https://arb1.arbitrum.io/rpc at block 513140605 (earlier reads at 513136581 and 513136874).
- Role, upgrade and ownership history comes from `eth_getLogs` in 10M-block windows from block 488600000. The V2 deploy is at block 488602245 per the Ignition journal.
- Arbiscan returned 403, and the Arbitrum Blockscout API served a bot challenge, which we did not bypass. The Blockscout address pages (HTML shell, 200) are used only as citation URLs.
- Repos:
  - `0xCurvy/contracts@e996fe71` (develop). This is the branch whose source matches the deployed implementations.
  - `main@0afe6c80` differs by 280 or more lines in the aggregator and factory.
  - `0xCurvy/sdk@75ce11ed`.
  - `0xCurvy/docs@73d17acd`.

## Unit of assessment

- **Primary chain: Arbitrum (42161).** The contracts README (L35-L36) says the production aggregator chain is Arbitrum and all others are portal-only.
- **In scope:**
  - Aggregator proxy `0xE519…cbB1`, implementation `0x855d…3F0A`.
  - Vault proxy `0xcC8d…4f00`, implementation `0xBf38…eEb0`.
  - PortalFactory `0x4f32…1389`.
  - Verifiers `0xEFf8…d044` (withdraw, 2 inputs), `0xDB3b…b804` (aggregation 2×3) and `0xFEed…7A73` (commit, batch 5), each read with the getters.
- **Excluded:** portal-only chains, Solana, V1, testnet and staging.
- `deployed_addresses.json` lists older implementations (`0xE884…`, `0x8c0D…`) and an older factory (`0x5E98…`). The live addresses were read from the proxy slots and from `portalFactory()`.

## What we searched

- `gh repo list 0xCurvy`: contracts (Apache-2.0 root, GPL-3.0 verifiers, one BUSL-1.1 interface), sdk (MIT), rs-core (MIT), payments-sdk and docs (no licence), plus HOPR and VPN forks that are unrelated.
- No repository holds the API, indexer, relayer, Portal Broadcaster or web app.
- **Source match.** We fetched Sourcify sources for the three implementations. Each is identical to develop `e996fe71` apart from a trailing newline.
- **Onchain roles.**
  - AUTHORITY_ROLE on vault and aggregator: Safe `0xB2c1…4b9F` (1.4.1, 4 of 6, no modules, no guard).
  - OPERATOR_ROLE on the vault and on PortalFactory: `0xE679…06d2`, an EIP-7702-delegated EOA.
  - No operator on the aggregator.
  - The deployer `0x6182…2dc6` was revoked everywhere.
  - Upgrades at block 0x1dadba35 were sent directly by the Safe, with no timelock.
- **Contracts.**
  - Shielding goes only through operator-deployed portals.
  - `directShield` exists but `directShieldEnabled()` is false.
  - Withdrawals, `commitPendingNotes` and portal recovery are permissionless.
- **SDK.**
  - Configurable `apiBaseUrl`, indexer, relayer and circuit-key URLs. The default API is api.curvy.box.
  - The network registry and protocol parameters come from the API at start-up.
  - The only approval is exact-amount, in `directShield`.
  - No analytics dependencies.
  - No country or geolocation code.
- **Docs repo.**
  - Compliance model: Global Ledger scores addresses before the broadcaster deploys a portal. Retroactive tainting is marked work in progress.
  - Portals and recovery.
- **Audit.** `audit/Curvy 2026 Audit Report Final.pdf` (Ethernal, March to April 2026), read by FlateDecode stream extraction. It pins commit `5f6e43cf` (which exists), covers the V6-named V1 contracts, and lists fix commits. The README says V1 was the audited stack.
- **Privacy policy.** `curvy.box/privacy-policy` is server-rendered. It discloses analytics, compliance screening and portal metadata. No terms page was found (`/terms`, `/terms-of-service` and `/legal` return 404).

## What we did not find or do

- No transactions, UI runs, traces or self-host attempts.
- Explorer verification on Arbiscan was not checked (bot protection).
- No disclosure of the Safe signers.
- No bug bounty found.
- We did not verify from rs-core whether `ownerHash` changes for each note.
- S5 left unknown: the SDK uses signature-derived JWT auth and Privacy Pass tokens, and we did not trace the payments-sdk key handling.
- No primary legal source, so no `context`.

## Judgment calls

- **C1 = 0**: an EOA operator decides, per portal, whether funds are shielded.
- **C2 = 1**: entry needs the operator. Withdrawal and recovery are direct.
- **C3 = 0**: the API, broadcaster and key host are required and closed.
- **C4 = 1**: screening is disclosed in a versioned docs repo but cannot be bypassed, and the entry is operator-gated, so the settlement layer is not neutral.
- **O1 = 1**: implementations verified on Sourcify; proxies and verifiers not.
- **O4 = 1**: ABIs and events are in the repo, but the required API has no schema.
- **P3 = 2**: stealth-style portals, but plaintext entry amounts, and `ownerHash` freshness not verified.
- **S1 = 1**: an upgradeable vault, disclosed in source.
- **S2 = 1**: Safe 4-of-6, no timelock.
- **S3 = 2**: exact-amount in substance, but no package or trace evidence.
- **S4 = 1**: portal funds recoverable by a documented manual call. Shielded funds depend on Curvy-hosted keys and data.
- **S6 = 1**: the audit covers V1, not the deployed V2.

## Availability 2026-10-09

- Model `global`. The contracts and the public SDK have no country gate, and no first-party document lists countries.
- Judgment call: the closed web app and API could geoblock by IP, and we could not inspect them.

## Operational 2026-10-09

File: `data/operational/curvy.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) left as filled. Group B covers Curvy's hosted services (API, Portal Broadcaster, circuit-key host), which are required and closed.

- **Sources.** Privacy policy (`curvy.box/privacy-policy`, last updated 25 February 2026). No terms page: `/terms`, `/terms-of-use`, `/tos`, `/imprint` and `/legal` all return 404. Docs repo at `73d17acd`: FAQ (fees, incorporation), payments fees page, authentication, compliance model. SDK at `75ce11ed`: HTTP auth and the JWT refresh interval. Contracts at `e996fe71`: CurvyVaultV2 fee code and the `production_arbitrum_v2` Ignition journal. status.curvy.box does not resolve.
- **Onchain** (arb1.arbitrum.io, block 513202075):
  - Vault `depositFee` = 10 bps and `withdrawalFee` = 20 bps; MAX_FEE is 1000 bps.
  - USDC `perTokenGasFees` = (14557, 23026, 21973) base units.
  - `feeCollectorAddress` = the 4-of-6 Safe.
  - Aggregator `protocolFeePerThousand` = 0.
  - The vault proxy was created in tx 0x90553cc1…9c4e at block 488602304 (2026-07-28). The receipt matches the journal.
  - Both proxies were upgraded in tx 0xe7e2d721…532c at block 497924661 (2026-08-24).
- **Registers.**
  - The National Bank of Serbia register of virtual currency service providers (server-rendered) lists three firms. Curvy Tech d.o.o. is not one of them.
  - The Serbian Business Registers Agency search (pretraga2.apr.gov.rs) did not connect.

Judgment calls:
- **Fees.** The onchain values are used. The FAQ's 0.1% aggregation fee is not in force (the onchain value is 0), and the file says so. The withdrawal fee is recorded as paid by the payee, meaning the note holder who unshields.
- **Custody `self_custody`**, agreeing with S1 = 1. The note covers the no-timelock upgrade power and the operator-gated entry.
- **Licences `absent`.** Based on the NBS register and the docs. The Serbian Securities Commission and MiCA registers were not searched.
- **Entity.** Taken from the docs FAQ, a versioned repo file. The privacy policy names no entity.
- **Volume `not_observable`.** Amounts are public, but in dynamic arrays (PendingNotes) or with the token only in an indexed topic (Vault Deposit/Withdraw). The spec format cannot express either. The note says which spec would work if token-topic filtering were added.
- **B11.3 `absent`.** No terms exist.
- **Left `unknown`:** B1.1 to B1.3, B1.5, B3.1 and B3.4.

Validator: offline 0 errors; online 0 errors.
