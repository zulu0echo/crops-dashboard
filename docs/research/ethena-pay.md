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
