# Hyperbeat Card (Hyperbeat Pay): research log (2026-10-07)

**Type: incumbent.** I found no verified contract and no public repository needed to run the card. HyperEVM reads are pinned to block **47900593** (RPC https://rpc.hyperliquid.xyz/evm, which rate-limits heavily; reads were retried).

## Where I looked

- **Docs (docs.hyperbeat.org, GitBook).** Liquid Banking, Liquid Banking Architecture, Hyperbeat Pay, Resources > Addresses (beHYPE, vaults, Morpho, USD+; no card contracts), Resources > Audits, Legal (empty page). The architecture page describes ManagementAccount (UUPS), ManagementAccountFactory, ServiceRegistry, TokenWhitelistRegistry, an Operator that calls `settle()`, Turnkey key management, and audits by Zellic and Nethermind. GitBook pages carry an "agent instructions" block offering an `?ask=` query endpoint; I did not use it.
- **hyperbeat.org.** /terms (Zoeion Ltd Corporation, updated 1 Mar 2026), /privacy (Panama City address), sitemap, blog. The Terms refer to a "Hyperbeat Pay Cardholder Agreement"; it is not published anywhere I could find, so the card issuer, program manager and KYC vendor are unnamed.
- **GitHub.** `0xhyperbeat` org: Audits (PDFs) plus forks (DefiLlama-Adapters, Pendle-SY-Public, dimension-adapters, beHYPE, ethena_sats_adapters). The Zellic report's scope names `github.com/0xhyperbeat/Liquid-Bank` at 431de44b; that URL returns 404 (private). `hyperbeat` on GitHub is an unrelated 2015 user. api-evangelist/hyperbeat is a third-party profile (lead only).
- **Pay dapp.** hyperbeat.org/dapp/pay and its 61 Next.js chunks. Chunk 97b00ce1712acb99.js holds the config `OPERATOR` 0xd9CcDB26…, `MORPHO_SERVICE` 0xb90759Ff…, `MORPHO_REPAY_SERVICE` 0xb4a03802…, `WRAPPER_SERVICE` 0x4c70eCA9…, plus beatUSD and USD+ addresses. No factory address. The other ACCOUNT_LOGIC/FACTORY_ADDRESS constants in the bundle are ZeroDev Kernel SDK defaults, not Hyperbeat's. Excerpts archived at data/archive/hyperbeat-card-pay-dapp.txt, because chunk hashes change on each deploy.
- **Explorers.** HyperEVMScan pages for the Operator and the three services all show "Verify and Publish" (unverified). Sourcify v2 (chain 999) has no match for any of them. Routescan does not support chain 999.
- **Onchain.** beatUSD Transfer logs over ~12k blocks: contract 0xFc29c432… received beatUSD from 21 senders via `batchSettle(address[],uint256[])`, called by EOA 0x3DE18bE5…. Sample sender 0xd9c6a70b… is an ERC1967 proxy to implementation 0x6e209362…. All of these are unverified. This matches the documented settle flow, but nothing published by Hyperbeat names these addresses, so they are logged here and not used for scoring.

## Judgment calls

- **Incumbent despite deployed contracts.** The eligibility rule asks for a *verified* contract or a *public* repo. The contracts exist but are unverified, and the repo is private.
- **O1 = 0 rather than unknown.** The provider has contracts (the Operator is named in its own dapp config), and they are unverified.
- **P1 = 0.** The served Pay page loads a Google Ads tag, and the bundles ship the Datadog browser SDK and Intercom. The privacy policy names only categories of processors, not advertising tags. Documented evidence lowering a score is admissible; no network trace was run.
- **S3 = 1.** The documented user-set spending limit would be a bounded allowance (2), but documented-only evidence caps it at 1.
- **S6 = 1.** Public reports pin commits in a private repo against unverified deployments, so they cannot be matched.
- **C5, P3 unknown.** Without verified contracts or code I cannot see the token list or event fields.

## Not found

- The cardholder agreement, card issuer, KYC vendor, ManagementAccountFactory address, and any bug bounty.

## Availability 2026-10-09

- Source: hyperbeat.org Terms (https://hyperbeat.org/terms), section 7 geographic restrictions. The Pay web app bundle (61 chunks from https://hyperbeat.org/dapp/pay) was searched for a country gate; it contains only a phone-prefix country list, no blocked-country list.
- Model `blocklist`: CU, IR, KP, SD, SY, the five countries the Terms name.
- Judgment calls: (1) "any other country subject to United States embargo, UN Security Council Resolutions, HM Treasury's ... sanctions regime" is not expanded, per the brief; this is stated in `note`. (2) The Ontario, Canada exclusion is sub-national and goes in `note`. (3) The 25-country list in the Terms applies to Beatpot only, not to the Pay Service, so it is not used. (4) US access depends on an unpublished "Hyperbeat Pay Cardholder Agreement (U.S.)"; US is not listed as blocked, and the dependence is in `note`.
