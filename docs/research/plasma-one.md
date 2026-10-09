# Plasma One: research log (2026-10-07)

All onchain reads are pinned to Plasma block **34429835** (RPC https://rpc.plasma.to); the sample pull tx is at block 34424414. Plasma One has no public repository, so there are no pinned commits.

## Where I looked

- **Website and legal.** www.plasma.org/personal (plasma.to/one redirects there), /terms-of-service, /plasma-one-international-card-terms, /plasma-one-us-card-terms, /privacy-policy, the sitemap, and the blog post "Introducing Plasma One". No page lists a contract address or repo.
- **GitHub.** PlasmaLaboratories org: forks (reth, alloy, ethrex, veil, react-native-passkeys, open-agents, open-swe), plasma-tokenlist, node-templates. Nothing that runs Plasma One. `gh search repos "plasma one"` found two third-party repos: HarrisHan/plasma-one-account (claims the account contract is Biconomy Nexus 1.2.0 at 0x000000000032dDC4…) and mediakov/plasma-card-sdk (unofficial API client). Used as leads only.
- **Explorers.** plasmascan.to (Etherscan family) serves pages to curl and shows verification status; its v1 API is deprecated (needs a v2 key). Routescan has no source for chain 9745. Sourcify v2 has none of the addresses below.

## How the card contracts were found

1. Terms: card issued by Rain under Visa licence; International Card Terms: Supported Blockchains = "the Plasma blockchain network"; wallet = Privy smart contracts and TEE key management.
2. `cast logs` for USDT0 (0xB8CE59FC…) Transfer over 50,000 blocks (80,779 transfers). The top recipients by distinct sender are EOAs (exchanges). Senders with code were classified: 44 of ~114 are EIP-7702 delegations to 0xd6CEDDe8… (`accountId()` = "kernel.advanced.v0.3.3", ZeroDev Kernel). None delegate to the Nexus address in the lead.
3. Those Kernel accounts send USDT0 to BeaconProxies (beacon 0xBb931B7B…, implementation `Collateral` 0x05263D24…, Exact Match on Plasmascan). Tx 0x32bbf2f4… shows `Coordinator.pullAssetFromUserWallet("edd302da-…", user, collateral, USDT0, 1.34)` sent by EOA 0x2ebE9d77….
4. Coordinator 0xd5dd7939… (Exact Match): owner EOA 0x21ebc2f2…, treasury 0x8454D827… (EOA), publishers(0) 0xcBD8eaE5…, executors(0) 0xB92949bd…, `timelockWithdrawWithoutSignatureAllowed` false, USDT0 supported. The collateral factory 0x36F5A315… is a TransparentUpgradeableProxy whose ProxyAdmin 0x6f3b5Fd9… is owned by the same EOA, which also owns the beacon. The same EOA is the owner() of Rain's RainCollateral implementation on Avalanche (seen in the Ethena Pay work), which supports reading it as Rain's key.
5. Sample collateral 0xe0C209Db…: admins(0) = Kernel account 0xDc4930f1…; USDT0 allowance from that account to the collateral is 2^256-1.

**Judgment calls on attribution.**
- The terms tie Plasma One's card to Rain on Plasma, so I score Rain's Plasma Coordinator/Collateral system as the card's settlement contracts. The Coordinator takes a `_teamId`, so it may serve more than one Rain program on Plasma.
- The sample account and its collateral are not confirmed as Plasma One's. Cells that rest on the sample (P3, S1, S3) say so.
- The wallet contract is not identified: observed card-funding accounts use Kernel 7702, while a third party says Nexus. The wallet is listed as a closed Privy component, not scored as a contract.

## Judgment calls between anchors

- **C5 = 2.** USDT0 is enumerated onchain; the Terms warn generically that issuers can freeze; chain assumptions are not stated.
- **O1 = 1, O2 = 1, O4 = 1.** Explorer-only verification and ABIs; the beacon is unverified.
- **P1 = 1.** Google Analytics is disclosed in the privacy policy; there is no app code to show whether it is opt-in.
- **P3 = 2.** Public visibility is disclosed in the privacy policy; onchain data shows only wallet, collateral, amount and a UUID.
- **S3 = 0.** Unlimited approval observed, not disclosed. If Plasma One's own accounts use bounded approvals, this cell must be redone.
- **S4 = 0.** Funds in collateral cannot leave without Rain's signature.

## Not found / not done

- No repo, SDK or app source: P5, S5 unknown; F2 unknown.
- No audit report for the Plasma One app or for Rain's contracts: S6 unknown.
- No trace of the app; no confirmation of which wallet implementation Plasma One deploys.

## Availability 2026-10-09

- Source: www.plasma.org/terms-of-service, Appendix I "Plasma One Prohibited Activities List" s1 (Geographic and Jurisdictional Restrictions), server-rendered; quotes match the live HTML. Also read: /plasma-one-international-card-terms (card for non-US citizens), /plasma-one-us-card-terms (US card; default if the holder permanently resides outside the US), /personal (Bridge entities for US, EEA and other residents; "Geographic, regulatory, and other eligibility limits apply").
- Recorded as a blocklist of 31: CU, IR and KP from s1.1, plus the 28 countries in s1.2.
- Judgment calls:
  - s1.2 says Plasma "may" restrict or terminate access in those 28 countries. They are included as the more restrictive reading, and the discretionary wording is stated in `note`.
  - The s1.1 catch-all (any OFAC, EU, OFSI or UN sanctioned jurisdiction) names no further countries, so none were added.
  - The occupied Ukrainian regions are sub-national; Ukraine as a whole is on the s1.2 list.
  - The US is not blocked: the US card programme exists alongside the International one.

## Operational 2026-10-09

- Sources (server-rendered, quotes checked): www.plasma.org/personal, /personal/core, /plasma-one-international-card-terms (disclosures effective 26 Feb 2026), /plasma-one-us-card-terms (last updated 12 Feb 2026), /terms-of-service (15 Jun 2026), /privacy-policy, /plasma-one-rewards, and Companies House 16405367. /security and /trust return 404.
- Fees:
  - International card: FX up to 1%, no cross-border fee; late fee up to 40 USD, returned payment up to 29 USD.
  - US card: 1% international fee, no annual fee, 2% late fee.
  - Core tier: 199 USD per year or 20,000 XPL locked. Plasma charges no added fees; partner FX and off-ramp fees are shown in the app.
  - Per-tier card fees are in a Help Center that was not read.
- Issuer contradiction: both card agreements define the issuer as Third National, while the site footer says the card is "issued by Rain, a Visa Principal Member". Licences are `unknown`: no regulator or licence number is given for either, and Bridge's entities were not checked.
- Cash-out: card spend and Bridge off-ramp (rails by region). ATM access is not documented.
- First deployment: bisecting eth_getCode on rpc.plasma.to puts Rain's collateral factory 0x36F5A315... (and the beacon) at block 17026601 (2026-03-19), creation tx 0x3885b508... from Rain EOA 0x21ebc2f2.... The Coordinator in use (0xd5dd7939..., block 33757874) and the Collateral implementation (block 33757857) were deployed on 2026-09-29 and are recorded under changes.
- Volume: spec written over the listed Coordinator's AssetPulled event (topic0 0x114ae074..., from the Plasmascan-verified source). Data word 0 is the asset and word 1 the amount, checked on tx 0x32bbf2f4.... In a 3,000-block sample, 126 of 134 Coordinator logs were AssetPulled. Status `unknown` until the maintainer runs volumes.mjs. The figure would include any other Rain programme using this Coordinator.
- Group B: B4.1 (authentication methods; MFA optional), B6.3 (retention), B6.4 (joint controllers), B11.1, B11.3, B12.1 (automated KYC/AML processing, not stated as AI) and B12.2 (human review only) are documented.
- Judgment calls:
  - The entity is Plasma (Cayman, CO-412800), not the UK affiliate.
  - first_deployment dates the factory and beacon, not the newer Coordinator.
