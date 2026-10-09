# Tria (card): research log (2026-10-07)

**Type: incumbent.** I found no public repository needed to run the product and no published or verified contract. All scores rest on Tria's own legal pages (documented tier), plus one repo listing used to show absence.

## Where I looked

- **GitHub.** `TriaHQ` (the org docs.tria.so links to) has four public repos: tria-krapi-seoul-ai-builders (ideathon datasets, 2026-09-29) and forks of relay-server (from j-labs-xyz), sdk-testing-grounds and tria-rainbowkit. None holds card, wallet, SDK or backend code. `tria-labs`/`TriaLabs` belong to an unrelated Tria Labs (triafed.com); user `triaso` has 0 repos. `gh search repos "tria sdk"` returned unrelated projects.
- **npm.** Every `@tria-sdk/*` package named in the docs (core, connect, authenticate, authenticate-react, authenticate-web, react-native, react-native-core, chains, utils, constants) returns 404 from the registry. Legacy `tria-sdk-core` 1.1.21 and `tria-sdk-web` 2.1.14 (Aug 2023, ISC) declare repository github.com/TriaHQ/tria-core-sdk, which returns 404. Following the brief, an npm package without a public source repo is not counted as a public repo, and these 2023 wallet SDKs are not in the card path anyway.
- **docs.tria.so.** All 54 linked pages, including Protocol Construct, Security and TSS, BestPath AVS, TX Flow, Supported Networks, the SDK references, and every legal page. The only addresses are example wallet addresses in SDK sample JSON (Polygon test wallets). No card, collateral or settlement contract is named.
- **Legal.** Terms of Service (/platform-agreement; Threely Dimensions, Inc., Delaware law), Privacy Policy, International and US Card Terms, Card Cashback Terms, Account Opening Privacy Notice.
- **www.tria.so.** A client-rendered shell (71 bytes of text to curl).

## What the documents say

- The card program is run by "Third National, LLC and one or more of their partners" (Card Program Providers). The US Cardholder Agreement is with Third National. The International Card Terms leave the Issuer unnamed and follow the same collateral template as other Third National programs.
- Collateral is digital assets in a Linked Wallet. It can be liquidated if a payment is more than one day overdue or its value drops below charges. "Supported Blockchains" is generic: Ethereum, Polygon, Optimism, "Arbitrium", and others at the issuer's discretion.
- KYC via Sumsub, including biometrics. Analytics and advertising partners are disclosed in general terms.

## Judgment calls

- **Incumbent.** Without a published collateral chain or address, I could not find the card's contracts. Searching every listed chain for unattributed Third National/Rain collateral would not tie anything to Tria, so I did not do it.
- **C5 = 1.** Chains are listed only in the terms; tokens and freeze powers are not.
- **S1 = 1.** Issuer-controlled, liquidatable collateral is disclosed; the onchain form is unknown.
- **P1 = 1.** Trackers are disclosed in the privacy policy; there is no code to check defaults.
- **O1, O4, P3, P5, S2–S6, F2 unknown.** There are no contracts or code to read.

## Not found

- The collateral chain and contracts, any audit or bounty, and any public source for the Tria app, TSS infrastructure or BestPath.

## Availability 2026-10-09

- Source: Tria Prohibited Use Policy, section 4 "Sanctions & Restricted Jurisdictions" (https://docs.tria.so/prohibited-use-policy; identical text at /prohibitions-list, which /platform-agreement-v2 incorporates). Also read: /platform-agreement and /terms-of-service (generic sanctions clause, no names), /card-terms-international (not for US citizens), /card-terms-us (no state list).
- Model `blocklist`, 25 ISO codes: CU, IR, KP, SY (sanctions) plus the 21 distinct high-risk countries named (AF, BY, CF, CD, ER, ET, GN, GW, IQ, LB, LY, ML, MM, NI, RU, SO, SS, SD, VE, YE, ZW).
- Judgment calls: (1) Both lists are "including, without limitation"; only named countries are listed and this is said in `note`. (2) Crimea, Donetsk and Luhansk are sub-national and go in `note`. (3) "Democratic Republic of the Congo" maps to CD. (4) The US is not blocked: the international card excludes US citizens, but a separate US card programme exists.

## Operational 2026-10-09

File: `data/operational/tria-card.yaml`. No bot facts existed.

- **Sources read:** these docs.tria.so pages, plus all 25 articles at help.tria.so (Intercom):
  - /platform-agreement
  - /privacy-policy
  - /card-terms-international and /card-terms-us (both last updated 9 January 2026)
  - /prohibited-use-policy
  - /legal
  - /security-tss, /tx-flow and /network-construct
  - /introduction and /coresdk
- **Searches with no result:** status.tria.so (no DNS); www.tria.so/.well-known/security.txt (404); SEC EDGAR full-text search for Threely Dimensions (no hits). The SEC company browse endpoint refused an undeclared tool, and I did not retry with any identifying header.
- **Changes since the seed (2026-10-07):**
  - The Security and TSS, TX Flow and Protocol Construct docs pages are now behind a password ("authorized use only"). I did not try to get past it. B10.1 is recorded as attested.
  - The International Card Terms name Nimbus, LLC (Delaware) as issuer. The US Cardholder Agreement names Third National. The platform agreement still says "Third National, LLC and one or more of their partners". BANEX Microfinance Bank (CBN-licensed) markets the card in Nigeria.
- **Judgment calls**
  - `custody_model: hybrid` per S1: a self-custodial wallet, but collateral and top-ups sit under an issuer programme with liquidation rights.
  - `licences: attested`. Issuers are named only in Tria's terms, none was confirmed in a register, and Tria claims no licence.
  - Fees: the card terms (ATM up to 2 USD + 3%, FX up to 3% plus 1% international) and the help centre (ATM 1 USD + 1%; no Tria FX fee for members) disagree. Both are recorded; the terms are the binding ceiling.
  - `first_deployment` is the card terms' fee disclosure date (2025-10-31), a terms effective date, because no dated launch was found.
  - `entity` jurisdiction US-DE is inferred from the governing-law clause; no register was checked.
  - `cashout`: card spend and ATM only. No fiat bank off-ramp was found.
  - B12.1 unknown: nothing on AI or automated decisions.
- **Validator:** `--offline` 0 errors. Online: 0 errors with `NODE_OPTIONS="--network-family-autoselection-attempt-timeout=3000"`. A plain run hits the local Node connect-timeout issue (see the Deblock log).
