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
