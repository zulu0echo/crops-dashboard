# Ethena Pay: research log (2026-10-07)

All onchain reads are pinned to Avalanche C-Chain block **96949020** (RPC https://api.avax.network/ext/bc/C/rpc), except the sample card spend tx at block 96938483. Ethena Pay has no public repository, so there are no pinned commits.

## Where I looked

- **Website.** pay.ethena.fi home, /faq, /legal, /terms (Terms of Use, updated 22 Sep 2026), /card-terms (Spend Card Terms, effective 1 Jun 2026), /privacy, /disclaimers, /promotions, /support, /blog/introducing-ethena-pay. No page names a chain, contract address or repository.
- **Ethena docs.** docs.ethena.fi sitemap and key-addresses page: no Ethena Pay section, and none of the addresses below appear there.
- **GitHub.** `gh repo list ethena-labs` (13 repos: minting clients, sats adapters, role-verification, sui SDK); none is Ethena Pay. `gh search code` for ethenapay, ethena-pay, pay.ethena.fi: only third-party listings (andreolf/neobankbeat, news digests) and crypticdefense/audits, whose README lists private Guardian audits of "EthenaPay Wallet" (passkey/EOA smart wallet) and "EthenaSafeGuard". Third-party, not evidence; used as a lead only.
- **Explorers.** snowtrace.io, routescan.io and avascan.info return 403 to curl. The Routescan Etherscan-compatible API (api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api) answers and is used as the verification citation. snowscan.xyz returns 200 but shows all of these contracts as Unverified. Sourcify v2 has only the UpgradeableBeacon (match).

## How the deployment was found

1. The FAQ says the boost is paid daily in USDe and cashback in AVAX, and the Card Terms name Rain (program manager) and Third National (issuer). Third-party listings say "on Avalanche".
2. `cast logs` for USDe (0x5d3a1Ff2…, the Ethena OFT on Avalanche) Transfer over ~20k blocks: Safe 0xD0Ec8CC7… (3-of-10) sent 1080 small transfers to 1080 distinct addresses, Safe 0xaB2B06eF… (1-of-2) 661. The recipients are BeaconProxies on beacon 0xc831Ea25….
3. Beacon implementation 0xb4446DA2… is `WalletDiamond` (Routescan-verified): passkey/EOA owners, facets resolved via `factory.getFacet(selector)`. This matches the audit-list description.
4. The factory (stored in each wallet at keccak("wallet.factory.storage.v1")) is 0xAc66ca9A…, a TransparentUpgradeableProxy; implementation 0x5fe7e734… is **unverified**. `totalProxies()` = 12335. I recovered its selectors from bytecode (4byte lookups): scheduleUpgrade/executeUpgrade with UPGRADE_DELAY = 172800, executor change, globalPause/addPauser, addDeployer, getAllSelectors (86 selectors) and getFacet.
5. getFacet over all 86 selectors gives ten facets, all Routescan-verified: Allowance, Withdrawal, DirectMode, Recovery, Auth, ERC1271, ExecutorExternalCall, ExternalApprove, ExternalApproveAndPreAuthorizeHash, Compatibility.
6. Top USDe recipient 0x6070848b… is a BeaconProxy to `RainCollateral` (Rain beacon 0x6A93fd36…, owned by a Rain 2-of-? Safe 0x6454cf01…). Tx 0xec33bce0… shows relayer EOA 0x3219FAe3… calling BatchExecutor 0x27f6358a… which calls `spendDailyAllowance` on wallet 0x6455888e…, moving 2.25 USDe to that collateral. 210 distinct wallets paid it in the window.
7. Link: RainCollateral owner(), factory owner(), ProxyAdmin owner() and BatchExecutor owner() are all Safe **0xdD2332Ca…** (v1.4.1, 5-of-10 EOAs, no modules, no guard). Owner 0x7be65cdC… of that Safe is also one of two owners of the USDe payout Safe 0xaB2B06eF….

**Judgment call (unit of assessment).** No Ethena Pay document names these contracts. Attribution rests on: Rain program (documented), USDe-funded wallets with passkey auth (documented features), daily USDe payouts, a Rain collateral owned by the same Safe as the wallet factory, and the third-party audit-list description. I treat this as sufficient to score, and say so in `basis`. If Ethena Pay publishes addresses that differ, every onchain cell must be redone.

## Key reads (block 96949020)

- Factory: owner 0xdD2332Ca…, executor 0xe0EcdCc8… (EOA, nonce 152), globalPaused false, UPGRADE_DELAY 172800, pendingImplementation 0, beacon 0xc831Ea25…, implementation 0xb4446DA2…, default daily limits USDe 10000e18 and USDC 10000e6. Deployers include 0xe0EcdCc8…, 0x3219FAe3…, 0xDE914Fe6…. Pauser set not enumerated (isPauser false for the Safe and the deployer EOAs checked).
- EIP-1967 admin of the factory: ProxyAdmin 0xdDaFfdB1… → owner Safe 0xdD2332Ca….
- Beacon owner = factory; so wallet-implementation upgrades go through the factory's 48 h schedule, but the factory itself can be swapped instantly through ProxyAdmin.
- Sample wallet 0x6455888e…: dailyLimit(USDe) 10000e18, isDirectMode false, recovery admins none, recovery delay 864000 s.
- BatchExecutor: owner Safe 0xdD2332Ca…, paused false, authorizedCallers(0x3219FAe3…) true, approvedRecipients(0x6070848b…) true.
- USDC (0xB97EF9Ef…): blacklister 0x00fEC99e…, pauser 0x303F2f7D….

## Judgment calls

- **S1 = 0.** `spendDailyAllowance` needs only the executor's signature and accepts any `to`. The BatchExecutor recipient allowlist only applies if the relayer routes through it; a signed spend can be submitted to the wallet directly. So Ethena Pay can redirect up to 10k USDe + 10k USDC per wallet per day. The FAQ says Ethena Pay has no access to funds; recorded as a provider claim and the cell marked `disputed`.
- **S2 = 1.** The 48 h UPGRADE_DELAY is real but bypassable through the ProxyAdmin. Signers undisclosed.
- **S3 = 1.** Bounded and refilling, but not receiver-bound (anchor 2 requires one receiver).
- **S4 = 1.** Direct mode (1 h) plus owner-signed withdrawal is a genuine exit in verified source, but only as a manual contract call with no public tooling, and the admin can remap facets instantly.
- **C5 = 2.** Tokens enumerated in onchain factory config from verified source; the Card Terms' generic chain list (Ethereum, Polygon, Optimism, Arbitrum, "and other") is open-ended, so not treated as a misstatement.
- **O2 = 1, O4 = 1.** Explorer-verified source and ABIs counted as "contracts only" / "documented only".
- **P3 = 1.** Minimal linkage (amounts and timing from a fixed wallet to a known collateral), not disclosed to users, but no plaintext metadata.

## Not found / not done

- No repo, SDK, app source or API schema: P1, P5, S5 unknown. F2 unknown (no repo to carry a CLA or licence history).
- No public audit report: S6 unknown.
- No network trace or app inspection. I did not confirm the AVAX cashback payer onchain.
- The factory implementation is unverified, so the facet registry and pauser logic are read from behaviour and selectors, not source.

## Availability 2026-10-09

- Sources: pay.ethena.fi/terms (Terms of Use s4.5 eligibility, s4.6 Restricted Jurisdictions, Appendix 1 Country-Specific Terms with 47 country sections), pay.ethena.fi/jurisdictions ("live in 48 countries", list by region), pay.ethena.fi/faq (card is for non-US persons only). All are server-rendered (Next.js) and the quotes match the live HTML.
- Recorded as an allowlist of 43: the 47 Appendix 1 countries minus AU, SV, PK and MA.
- Judgment calls:
  - Antigua and Barbuda is on /jurisdictions but has no Appendix 1 section (the Caribbean numbering runs 2.1 Bahamas to 2.11 Turks and Caicos). The documents disagree, so it is left out.
  - Australia (s5.1) is left out: the Spend Card is "not generally available" unless offered through a local issuer.
  - El Salvador (s1.8), Pakistan (s3.4) and Morocco (s4.5) are left out: digital-asset services are unavailable unless Ethena Pay confirms them at onboarding, and the card spends stablecoin balances. These are the default-off readings; Ethena Pay may enable them per user.
  - Japan (s3.2) is kept with a `note`: services are limited to unregulated functions, and the document does not say the card is excluded.
  - The s4.6 Restricted Jurisdictions are not listed separately because an allowlist already excludes them; the sub-national ones (Crimea, Donetsk, Luhansk) and the unrecognised ones (Abkhazia, South Ossetia, Northern Cyprus, Somaliland) are in `note`.

## Operational 2026-10-09

- Sources (server-rendered, quotes checked): pay.ethena.fi/pricing (effective 1 Sep 2026, updated 30 Sep), /card-terms (effective 1 Jun 2026), /terms (22 Sep 2026), /privacy (18 May 2026), /legal, /faq, /blog/introducing-ethena-pay (3 Sep 2026). /security, /fees and /.well-known/security.txt return 404.
- Fees: card issuance, replacement, account and closure are free; FX is Visa's fee passed through (about 1%) with no cross-border fee; ATM is 1 USD + 0.65% where available; late fee up to 40 USD and returned payment up to 29 USD; off-ramp fees are set by Iron / MoonPay at the time of the transaction. Outbound wires are not offered.
- Licences: none found. The Terms say Ethena Pay Ltd. is not licensed by any financial regulator in the user's country. The card terms name Third National (issuer) and Signify Holdings, Inc. d/b/a Rain (programme manager) without licence details.
- First deployment: Routescan getcontractcreation plus eth_getCode at the block before. The Rain collateral 0x6070848b... was created at block 87002584 (2026-06-02), by the same Rain EOA 0x21ebc2f2... seen on Plasma. The wallet factory 0xAc66ca9A... was created at block 87652557 (2026-06-10).
- Volume: not_observable. The card spend's AllowanceSpent is emitted by each user's wallet proxy, not by a listed contract. The listed BatchExecutor event 0x1aa7a0dc... carries only counts (receipt of tx 0xec33bce0...).
- Group B: the privacy policy is detailed. It names the GDPR controller, gives a retention table, describes generic safeguards, and discloses automated decision-making and profiling, with machine learning, in screening and fraud, plus a human-review right. These give B6.1, B6.3, B6.4, B12.1 and B12.2. B4.1 (passkeys plus biometrics), B11.1, B11.2 (launch post) and B11.3 are documented. Nothing was found on certifications, pen tests, patch SLAs, incident notification or status pages.
- Judgment calls:
  - first_deployment dates the Rain collateral as the settlement contract. Attribution to Ethena Pay is the provider file's inference.
  - B12.2 is evidenced with a partial value: only the override path is documented.
