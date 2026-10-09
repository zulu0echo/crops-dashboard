# ether.fi Cash: search log

Assessed 2026-10-07 by AI research agent (seed). Unit: the Optimism (chain 10) core-chain deployment from `etherfi-protocol/cash-v3` at `a5024d0b6e81ac0e6f40335a08f697fc7aafde52` (2026-10-05). Onchain reads are pinned to OP block 157880645.

## Where I looked

- **GitHub.** I listed the `etherfi-protocol` org (23 repos). `cash-contracts` is archived (May 2025); `cash-v3` is live. The `ether-fi` org has no public repos. `gh search repos "etherfi cash"` returns only third-party explorers and clients. npm has no official Cash SDK.
- **cash-v3 at a5024d0.** I read the README, `deployments/mainnet/{10,534352}`, `deployments/mainnet/10/roles.json` and `config.json`, the CashModule Core/Setters/Storage, ModuleManager, EtherFiSafeCore, RecoveryManager, EtherFiSafeFactory, BeaconFactory, RoleRegistry, UpgradeableProxy, EtherFiDataProvider, EtherFiHook, SettlementDispatcherV2 and CashEventEmitter. I also checked the audit/ folder, the workflows, and the commit history for LICENSE (none).
- **Docs (etherfi.gitbook.io; www.ether.fi returns a Vercel 429 to curl).** Read: Cash Card, Technical Documentation, Account upgrade, Vault, Cash Modules, Deployed Contracts, MultiSigs & Controls, Signers, Trust Matrix, Audits, Risks, Legal index, Privacy Policy, Terms of Use, and the Cash Cardholder Agreements (Inc. International and U.S.). The help centre articles (FAQ, CSV export, card freeze, country availability) are support pages, so they count as `claimed`.
- **Onchain (cast, https://mainnet.optimism.io).** Read: RoleRegistry owner and roleHolders; both timelocks' getMinDelay and roles; the governance Safe's threshold, owners, getModulesPaginated and guard slot; EIP-1967 implementation slots; the beacon implementation and owner; DataProvider default modules, hook and recovery delay; CashModule getDelays, paused, whitelisted withdraw assets and getData for a sample Safe; and USDC blacklister/pauser. A sample spend came from the Spend logs (tx 0xdb50399e...f565, block 157880145). On Scroll (https://rpc.scroll.io) the CashModule had no Spend events in the last 50,000 blocks.
- **Verification.** Sourcify v2 for chain 10: proxies and implementations give `match` (partial), never `exact_match`. The DebtManager impl, CashEventEmitter impl and operating timelock are not on Sourcify; Blockscout (explorer.optimism.io) API says `is_verified: true`. optimistic.etherscan.io returns 403 to curl, so the evidence URLs use explorer.optimism.io.
- **Audits.** I downloaded three PDFs at a5024d0 and extracted the text. Certora "Cash Module + Safe" pins PR 3 (final 12cbd745) and gives a fix commit per finding; I confirmed 12cbd745, 34546ae, ef608f4 and 54150cc exist in cash-v3.

## Key facts

- **Primary chain.** Optimism. The docs say "Cash v3 contracts are deployed on Optimism", and the April 2026 account upgrade moved the core chain off Scroll (MigrationBridgeModule exists only in the Scroll deployments). Excluded: Scroll (legacy) and the top-up chains Ethereum, Base, Arbitrum and HyperEVM.
- **Governance.** The RoleRegistry owner is the upgrade timelock (2 days). Its proposer and executor is Safe 0xA6cf...AAC4, 3-of-6, with no modules and no guard. The same Safe holds ADMIN_ROLE directly (no timelock), plus UNPAUSER and PAUSER. ADMIN_TIMELOCK_ROLE is the operating timelock (8 h).
- **PAUSER.** Holders are the Safe, EOA 0x9AF1...844D (ether.fi's "monitoring" key, per their Ethereum docs) and 0x4279...2eE3, a 1-of-6 Safe.
- **Card spends.** spend() is callable only by ETHER_FI_WALLET_ROLE (two EOAs). Funds go to the Rain/Reap/PIX/CardOrder settlement dispatchers. Bridging out of the dispatchers needs SETTLEMENT_DISPATCHER_BRIDGER_ROLE, and withdrawFunds needs the operating timelock.
- **User Safes.** These are BeaconProxies; the beacon is owned by the SafeFactory, which the upgrade timelock controls. There are 22 default modules, enabled on every Safe and set by the 8 h timelock.
- **Ownership and recovery.** The owner is a Turnkey EOA. By default the recovery signers are the ether.fi Safe plus a third-party EOA, 2-of-2, with a 3-day recovery delay that the owner can cancel.
- **User exit.** requestWithdrawal (owner signatures, callable by anyone) and processWithdrawal (anyone, after the 10 s delay) are not pause-gated. They are limited to 27 whitelisted assets, and ADMIN_ROLE can change that list instantly.
- **Card side.** The cardholder agreements name Third National as issuer and Visa as network (BANEX in Nigeria). The KYC vendor is not named in any document I found.

## Judgment calls

- **C1 = 0.** An EOA holds PAUSER, which is the anchor for 0. There is no per-address onchain blacklist; card blocking is offchain and documented.
- **C4 = 1, not 2.** Edge screening is disclosed only in docs, not in code or a repo document.
- **O1 = 2.** Sourcify gives partial matches only. The repo has bytecode-compare scripts, which I did not run.
- **O4 = 1, not 2.** Event schemas and interfaces are in source, but there is no committed ABI or API schema, and the method reference is hosted only.
- **F2 = 2.** No CLA and no commitment, so the anchor applies literally. With no LICENSE file at all, the F1 gap dominates.
- **P1 = 0.** The provider's own privacy policy discloses device fingerprinting and behavioural biometrics. That is documented-tier evidence, which may lower a score; the anchor puts fingerprinting at 0.
- **P3 = 1, not 2.** The indexed card txId works like an invoice id, and the referral cashback events link Safes.
- **S1 = 1, not 0.** The settlement dispatcher can be drained by the 8 h timelock, but it holds the card payment owed to the issuer. I scored it 1 for consistency with the Gnosis Pay settlement Safe; the reviewer should check this.
- **S2 = 2.** The 2-day timelock is longer than the 10 s exit, but three of the six Safe signers are undisclosed and the repo names no notice channel.
- **S3 = 2.** Spending runs against a bounded daily/monthly limit with no ERC-20 approval. The default modules sit outside that limit.
- **S4 = 1, not 2.** The withdrawal contract path is verified, but the owner key sits in a Turnkey enclave reached through the ether.fi app, and I found no documented key export.
- **S6 = 2.** Audits are pinned with per-finding fix commits, but the bounty scope is not in the repo and the deployed code is well past the audited commits.
- **P5 and S5 are unknown.** The app and backend are closed, so there is no config surface or webhook code to read.

## Not found

- No LICENSE file, CLA or CONTRIBUTING in cash-v3.
- No public app, frontend, SDK, backend or API schema.
- No disclosure of the governance Safe's signers for OP.
- No named KYC vendor.
- No primary source for Third National's regulator.
- No user notice channel for upgrades.
- No documented export of the Turnkey key.

## Availability 2026-10-09

- Model `allowlist` with 88 codes.
- Sources:
  - Help-centre article "In which countries is the Cash card available?" (help.ether.fi 758780, "Updated yesterday"). It is first-party but a support page, so it is cited as `claimed`, `by: provider`.
  - Terms of Use section 1(c).
  - Prohibited Activities List (gitbook legal).
  - All three are archived under `data/archive/etherfi-cash-*.txt`.
- The International and U.S. Cardholder Agreements (Inc. and Ltd.) were read. They name no countries, only age, KYC and discretionary eligibility.
- How the list was built:
  - The help article lists 88 physical-card countries, plus BE and IE (virtual only), plus the US (physical card in 30 states and DC).
  - It says unlisted jurisdictions cannot apply, so the model is `allowlist`.
- Judgment calls (more restrictive reading, per the brief):
  - CA is removed. The help article lists it, but the Terms of Use say the Services "are not available to residents or citizens of Canada".
  - HR and CY are removed. The help article lists them, but the Prohibited Activities List's hedged "Prohibited jurisdictions may include" list names them. A reviewer may decide the hedged list should not override the explicit help article.
  - US is included as a whole country. The state limit applies to physical cards only, and the article lists no state as ineligible for the virtual card, so the limit goes in `note`.
  - Puerto Rico is coded PR because the article lists it as its own jurisdiction.
- The bank-transfer availability article (860025) covers a different feature and was not used.

## Operational 2026-10-09

File: `data/operational/etherfi-cash.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) left as filled.

- **Sources read.** GitBook: all four cardholder agreements (Inc./Ltd., International/U.S.), Terms of Use, Privacy Policy, Security & Risks, Incident Management, Incident Response Playbook and the three incident pages, Technical Documentation, Account upgrade, MCP Server, Quickstart, and `llms-full.txt` (full-text search for ISO 27001, SOC 2, penetration, status page). Help centre: limits and fees (303623), first-card fee (833743), payment methods (759961), bank transfer FAQ (758758), bank-transfer countries (860025, 860027), membership benefits (776152), account deletion (842150). Help-centre pages are archived as `data/archive/etherfi-cash-ops-*.txt`.
- **Registers.** FDIC BankFind (`api.fdic.gov/banks/institutions`, search "Third National"): no active institution; only closed Tennessee banks. The cardholder agreements choose Puerto Rico law, so I tried OCIF: `concesionarios.ocif.pr.gov` (licence verification) fails the TLS handshake with curl. OCIF's home page carries 22 Sep 2026 orders revoking the IFE-37 licence of Banex International Bank, Inc. That entity is not linked to ether.fi in any first-party document, and the provider file's "BANEX Microfinance Bank" (Nigeria) is a different name; I did not connect them. The Cayman register has no free search.
- **Onchain.** CashModule proxy on OP: creation tx 0x96728edf...f240, code size 0 at block 149521157 and 122 at 149521158 (2026-03-27 19:51:33 UTC). Spend event topic0 computed with `cast keccak` and checked against the sample tx 0xdb50399e...f565: emitter is the listed CashEventEmitter 0x380B...acB, word 3 is `totalUsdAmt` (6 decimals).

Judgment calls:
- **Fees and cash-out evidenced from help-centre pages.** These are first-party pricing pages, so I treat them as documented here. The CROPS seed cited the same help centre as `claimed`. The FX fee also appears in the cardholder agreement.
- **ATM contradiction.** The international card terms say cash advances are not available. The help centre lists ATM limits. Both are recorded, and the reviewer should confirm.
- **Card spend as `card_withdrawal`.** The schema has no card-spend method, so card spend at merchants is recorded as `card_withdrawal` and labelled in `limits`.
- **Licences `unknown`, not `attested`.** No first-party page claims a licence for Third National; it only names the issuer.
- **First deployment.** Dated to the OP core-chain CashModule (Mar 2026), not the earlier Scroll deployment, which I did not date.
- **Volume spec, not `not_observable`.** Card spends emit a dedicated Spend event with a USD total on a listed contract.
- **Changes date.** The account-upgrade page gives only "Apr 2026", so the change is dated 2026-04-01 and the summary says so.
- **B4.2.** Recorded from the incident note ("key platforms" require hardware authentication). This is narrower than the control asks.
- **Left `unknown`.** B1.1-B1.3, B1.5, B1.6, B2.2, B3.2 and B6.5: nothing was found. For ISO/SOC, the only mentions are about staking node operators.

Validator: offline 0 errors; online 0 errors.
