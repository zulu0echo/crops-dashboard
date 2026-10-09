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

## Operational 2026-10-09

File: `data/operational/hyperbeat-card.yaml`. No bot facts existed.

- **Sources read:**
  - hyperbeat.org/terms (1 March 2026), /privacy (21 August 2025)
  - newsroom posts: introducing-liquid-banking (8 April 2026), real-world-credit, new-cashback-system
  - docs.hyperbeat.org Liquid banking, Hyperbeat Pay and architecture pages
  - all 87 articles at help.hyperbeat.org (Intercom), including the 15 currency and fee tables
  - FDIC BankFind API
- **New since the seed:**
  - The Terms now name the issuer: "The Hyperbeat Card is issued by Third National" (the same clause mentions "Ether.Fi protocol", apparently copied from another programme).
  - The help centre has fee pages (FX 0.4-1%, ATM 1 USD + 0.65%, fiat ramps via Noah), a supported-country list for the card (article 13512812) and a virtual-account country list (16199140). The provider file's availability is still the Terms blocklist; the help-centre lists could refine it (not done here).
- **Judgment calls**
  - `custody_model: hybrid` per S1 (user-owned account, Operator settles and gates withdrawals). Help article 16019217 says Hyperbeat "cannot steal, freeze, or lock" funds, which conflicts with the architecture docs. It is cited as Hyperbeat's position in B3.3 (with a ref to S4) and in the custody note, not used for the value.
  - `licences: attested`. Third National is named only in Hyperbeat's Terms, and FDIC lists no active Third National. No Zoeion licence was claimed or found.
  - `first_deployment` is 2026-04-08, the dated "live today" Liquid Banking announcement. The card predates it (help articles from January 2026, Zellic audit November 2025), and this is noted. The HyperEVM public RPC returns current code for any block number, so the Operator's deployment block could not be read.
  - `entity` is Zoeion Ltd Corporation, Panama, from the Terms and Privacy Policy. The Panama register was not searched (interactive).
  - B1.4 is evidenced by ref to S6 (public audits, unmatched to deployed code).
  - B10.1 is evidenced as logical architecture only.
  - B12.1 records Agent Cards (AI agents spending).
- **Validator:** `--offline` 0 errors. Online: 0 errors with `NODE_OPTIONS="--network-family-autoselection-attempt-timeout=3000"`. A plain run hits the local Node connect-timeout issue (see the Deblock log).
