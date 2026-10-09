# Payy Card: research log (2026-10-07)

## Unit of assessment
- Payy Card docs (docs.payy.network/payy-wallet/payy-card) say card purchases "are settled privately on Payy Network", which is the Payy zk-rollup (UTXO notes, Noir circuits).
- polybase/payy at `2f95947f12981a838f6f0c9dddace825bf835502` (main), `eth/README.md` L142-L170: the "Mainnet" deployment is `ROLLUP_CONTRACT_ADDR=0x367c1eaf...` with ProxyAdmin `0xfe455bac...` on `--network mainnet` (Hardhat chainId 1). L185 documents a "Mint migration (Polygon -> Ethereum)".
- Legacy Polygon rollup `0x4cbb5041...` (from eth/README.md at 9e57964): it holds 0 USDC at Polygon block 95103541, so it is excluded.
- Payy Network EVM L2 (@payy/client 0.1.x, docs predeployed contracts): the client defines only dev and testnet chains, so it is excluded.
- Unit: Ethereum (1), RollupV1 proxy. All reads use `cast` against ethereum-rpc.publicnode.com at block 26139204. Note that publicnode refuses `eth_getLogs` over old ranges ("archive requests require a personal token"), so I listed transactions through eth.blockscout.com API v2 instead.

## Onchain reads (block 26139204)
- Proxy admin slot is `0xfE455baC...` (ProxyAdmin, owner `0x230Dfb03...`). The implementation slot is `0x7d8837b5...`.
- Rollup `owner()` is `0x230Dfb03...`, a Safe 1.3.0 with threshold 2 and 4 owners, all EOAs. `getModulesPaginated(0x1,10)` returns none and the guard slot is 0.
- `usdc()` returns Circle USDC. USDC blacklister is `0x0A06BE16...` and its pauser is `0x4914f61d...`. The rollup holds 710.75 USDC.
- The latest `verifyRollup` was tx 0xda88fb92... (block 26046439, 2026-09-24) from EOA `0x5343B904...`. It used verification key 0x0701c58c..., and `getZkVerifier` returns HonkVerifier `0x14DACD53...`.
- Several reverted `addProver`/`mint` calls from 0xb8913546... on 2026-09-30 show up in the transaction list. They are failed attempts and changed no state.

## Sourcify
- Implementation, proxy, owner Safe: exact_match. ProxyAdmin: runtime exact. HonkVerifier: match (partial). Aggregate verifier from the README (`0xb553c325...`) and the ZKTranscriptLib: not on Sourcify.
- The Sourcify `contracts/rollup3/RollupV1.sol` diffs as identical to the repo file at 2f95947.

## Repo findings
- The public repo is a Copybara export ("sync from internal repo"). `Cargo.toml` L218-L223 declares rain-*/sumsub-* crates, but none of them exist in the tree. `app/packages/payy` contains only assets, scripts and ts-rs bindings, so the wallet app source is not public. The guild backend server is absent; only `guild-interface` and `guild-client-http` are present.
- LICENSE: MIT up to 9e57964 (2025-01-09). Commit c4d2c902 (2026-03-25) removed it. RollupV1.sol is `SPDX-License-Identifier: UNLICENSED`. This is the relicensing event scored under F2 = 0.
- Card funding: `POST /ramps/transactions/{id}/fund` with a `NoteURLPayload` (pkg/ramps-interface/src/transaction/rpc.rs L58-L62). Card transactions are ramps transactions (`TransactionKind::Card`), and FundingStatus is PendingDebit/PendingCredit/InsufficientFunds/Settled.
- UTXO circuit public inputs: 4 commitments and 5 message fields. Messages are zero except for mint and burn.
- No sanctions or geo filtering in RollupV1, pkg/node or pkg/rpc. KYC rejection reasons include Sanctions and WrongUserRegion.
- No audit report, SECURITY.md or bounty in the repo. The FAQ claims audits but links no report, so S6 is unknown.

## Documents
- Terms of Service: a Google Doc linked from payy.link. It is client-rendered, so the text export is archived at `data/archive/payy-card-terms.txt`. Its card section names Rain as issuer and covers suspension with immediate effect (s2.6.22) and restriction without notice (s2.2).
- Privacy Policy (payy.link/privacy, May 2024): OFAC jurisdiction screening and diagnostics collection.
- Card docs: KYC fields, Visa Platinum, U.S. issuer, secured credit card, the "cannot be linked" claim.

## Judgment calls
- C1 0: the onchain role alone would be 1. The documented per-user restriction without notice gives anchor 0, following the Gnosis Pay precedent.
- C4 1 rather than 2: the settlement contract is neutral, but screening runs in closed services with no named list source.
- O2 1 and O4 1: lower anchor taken. A typed Rust client is not an API schema.
- P3 3: shielded sends reveal only commitments, and the L1 sees roots and proofs. I did not observe Payy's funding of Rain. Privacy is against the public, not against Payy.
- S3 2: the design is exact-amount, but it is capped at 2 because the app is closed and there is no package or trace.
- S1 0: owner `setRoot` and the verifier swap let the provider redirect funds.
- Not found: issuing bank name, Rain collateral addresses, app analytics SDKs (P1 rests on the policy only).

## Availability 2026-10-09

No `availability` block: Payy's documents state a scope but name no country.
- docs.payy.network/payy-wallet/payy-wallet-faq ("What countries does Payy work in?"): Payy "is available in all countries where the App and Play Store are available" and "may not be used in countries sanctioned by the Office of Foreign Assets Control (OFAC)". Neither the App Store/Play Store country lists nor the OFAC countries are named.
- Terms of Service (archive data/archive/payy-card-terms.txt): card terms vary by issuing partner "in various jurisdictions" and add GLBA disclosures for US users; no country list. Privacy policy (payy.link/privacy): automated screening so that "no OFAC jurisdictions are utilizing Payy"; no list.
- Card docs (docs.payy.network/payy-wallet/payy-card): US-based issuer, bank deposits from the US and Argentina only; no list of card countries. The repo's KYC rejection reasons include `WrongUserRegion`, but the region rule lives in closed services.
- Judgment call: a blocklist with an empty `countries` would render every OFAC-sanctioned country as "available", contradicting the FAQ, and the brief says to omit the block when no first-party source lists countries. Omitted rather than expanding "OFAC-sanctioned countries" from outside sources.

## Operational 2026-10-09

File: `data/operational/payy-card.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) left as filled.

- **Sources read.** docs.payy.network (llms.txt index, Payy Card, Payy Wallet FAQ, Privacy Architecture); payy.link/privacy (Privacy Policy, May 2024, with the footer naming "Zeplo Inc. (6772334)" and a New York address); the archived Terms of Service (`data/archive/payy-card-terms.txt`).
- **Onchain.** Blockscout gives creation tx 0x8d002955...8abd for the RollupV1 proxy, at block 24475975 on 2026-02-17. `eth_getCode` via eth.drpc.org returns 0x at 24475974 and code at 24475975; publicnode refuses archive reads.
- **Not found.** Issuer name, regulator or licence; the "Pricing and Fees Disclosures" that the ToS refers to; any status page, post-mortem, ISO/SOC statement or breach-notification clause. The Delaware company search is CAPTCHA-protected and was not used.

Judgment calls:
- **Custody `provider_custodial`.** Payy calls itself non-custodial, and note keys sit on the device. But S1 = 0 (owner can overwrite the escrow root) and S4 = 0 (exits need Payy's prover) put the funds at rest under provider control. That is unlike Exa and MetaMask Card, where only the spend path is provider-controlled. A reviewer may prefer `hybrid`.
- **B1.4 `attested`.** The FAQ claims audits but publishes no report.
- **Entity jurisdiction `US`.** The number 6772334 looks like a Delaware file number, and the ToS is performed in Delaware, but no register was read, so the state is not recorded.
- **Volume `not_observable`.** Card debits are private notes; L1 sees only roots and proofs.
- **Cash-out.** Card spend (`card_withdrawal`) and an ATM private beta. No bank withdrawal is documented. `ALL` is used because Payy publishes no country list.
- **Changes.** The Ethereum rollup deployment (Feb 2026) and the LICENSE removal (c4d2c902, Mar 2026, ref F2).

Validator: offline 0 errors; online 0 errors.
