# HesabPay: search log (2026-10-07)

Result: **incumbent**. I found no public repository owned by HesabPay and no verified contract. `primary_chain` is omitted, and `repos` and `contracts` are empty.

## Website

- `https://hesabpay.com`, `www.`, `/privacy-policy`, `/terms`, `developers.`, `api.`: all return a Cloudflare "BLOCKED 403" page to curl. I did not try to get past it. The block page links to `hesab.com`.
- `https://hesab.com` returns 200. The privacy policy names it as the company website ("Website: hesab.com"), so it is used as `website`.
- Documents read: `https://hesab.com/terms` (effective 2026-04-06) and `https://hesab.com/privacy` (last updated 2026-04-06). Both return 200.
- `https://developers.hesab.com/` returns 200, but it is a Vite SPA shell. Its bundle (`/assets/index-3ba26325.js`) contains the developer docs: REST endpoints on `api.hesab.com` / `api.hesabpay.com`, a Stripe guest-checkout flow, and a webhook guide. In that guide, merchants verify signatures by POSTing `{signature, timestamp}` with their API key to HesabPay's hosted `/api/v1/hesab/webhooks/verify-signature`, not by checking an HMAC locally. The docs routes sit under `/dashboard/developer/docs/*` behind an SSO-token guard, so I did not treat them as public documents. **S5 stays unknown.** That hosted-verification design is a reviewer lead.

## GitHub

- `gh search repos hesabpay`: 13 hits, all third-party. They are merchant integrations (`habib-studio/hesabpay-payment-gateway`, `XAbubakr/hesabpay-gateway-for-woocommerce`, `mabdullahjan/HesabPay_Gateway_Laraval`, `mabdullahjan/hesabpay_flutter`, `Cyber0x3a/django-hesabpay-boilerplate`, `TheHadiAhmadi/hesabpay`) or apps that call HesabPay. Some READMEs say "Official", but the owners are individuals, and every repo is a client of the hosted API rather than code needed to run the product.
- `gh search repos hesab`: unrelated accounting tools and Hesabe (a Kuwaiti PSP).
- `gh search code hesabpay`: the same integrations, plus mentions in Algorand Foundation xGov notes and blog mirrors.
- `gh api users/<x>` for `hesabpay`, `HesabPay`, `hesab-pay`, `hesabpay-official`, `hesabpayglobal`: all 404. User search "hesabpay" returned `HesabPayZinzir` (0 repos) and `habib-studio`. Org search "hesab*" turned up no HesabPay org.

## Chains

- EVM: Blockscout `eth.blockscout.com/api/v2/search?q=hesab` returned `[]`. The base, polygon, gnosis, optimism and arbitrum Blockscout search endpoints returned non-JSON (blocked), so they gave no evidence either way. The Etherscan search handler returned 200 but needs a browser session, and I did not pursue it. hesab.com, the terms, the privacy policy, the site JS chunks and the developer bundle contain no `0x` address, contract, or token reference.
- Sourcify: has no name search. With no candidate address, there was nothing to check.
- Algorand (claimed context only): hesab.com links to an Algorand Foundation case study (`algorand.co/case-studies/how-hesabpay-became-...`), which says HesabPay "migrated to the Algorand blockchain in 2022" with "over 3.5M" transactions. It gives no asset or app IDs. The privacy policy and terms say transaction records are "secured using blockchain technology", with no specifics. Algorand indexer (`mainnet-idx.algonode.cloud/v2/assets?name=hesab`, read at round ~65747944) returns:
  - ASA 1258542524 "HesabPay"/HesabPay: url `https://web.hesab.com/`, creator `OVUDPQ...57LBH4`, total 3e13 base units at 6 decimals, no freeze or clawback.
  - ASA 3561304383 "HesabPay"/HSB: url `www.hesab.com`, creator `RAARIV...OT27EU`, no freeze or clawback.
  - ASA 849191641 "Hesab Afghani"/HAFN and 849229386 "Hesab USD"/HUSD: url `https://hesab.af`, with freeze address `QAADZZ...YO6YOIQA`.
  - NFD names `hesabpay.algo` and `hesab.algo`.

  The ASA `url` field is set by whoever creates the asset, and no HesabPay document links to these IDs. ASAs are native assets with no source to verify, and the schema only represents EVM addresses. **I did not use them as evidence or for eligibility.** If HesabPay publishes its asset or app IDs, a reviewer could revisit this.

## Scoring judgment calls

- **C1 = 0.** "Role" read as HesabPay's own power to suspend or terminate an account (terms s5.1, s7, including on government order) with no notice period. Anchor 0 covers targeting individuals with no notice.
- **C2 = 0, C3 = 0.** Custodial ledger (terms s2.3). Every channel is HesabPay-operated (s1.2, s2.7, s2.8) and no intermediary code is public.
- **O2 = 0, F1 = 0.** Nothing public, and terms s6 grants only a limited, non-transferable use license.
- **O4 = 1.** A REST API (terms s2.8) and statement export "in standard formats" (privacy s5) are documented. I did not read a public API schema, and the export format is not named.
- **P1 = 1, not 0.** `curl -sL https://hesab.com` shows Google Analytics `G-GMHMD0CKK3` and Google reCAPTCHA loading unconditionally. Privacy policy s6 discloses analytics cookies but names no vendor. Scored 1 because collection is disclosed. Not inspected: web.hesab.com (a Flutter web build that registers a Firebase messaging service worker) and the mobile apps.
- **P2 = 1.** KYC (national ID or passport, date of birth), device and location data are collected and disclosed in privacy s1, with a Da Afghanistan Bank KYC/AML basis. Following the criteria's common-failure note, disclosed regulated KYC is scored 1, not 0.
- **P4 = 1.** Privacy s3 discloses third-party recipients (banks, card networks, Duffel, AI model providers). Docs only.
- **S1 = 1.** Custodial wallet, disclosed (terms s2.3).
- **S4 = 0.** Derived: S1 = 1, C2 = 0, C3 = 0, O3 unknown.
- **Left unknown** (no admissible artifact): C4, C5, O1, O3, F2, F3, P3, P5, S2, S3, S5, S6. Privacy s4.2 mentions "regular security audits and penetration testing" and PCI DSS but links no report, so S6 stays unknown.

## Migration 2026-10-07

Migrated to the post-red-team evidence rules (docs/seed-brief.md, final section).

- **Quotes.** Every `kind: document` item now has a `quote`. hesab.com/terms and /privacy are server-rendered and fetch with curl, so each quote is checked against the live page; no archive was needed. Quotes avoid apostrophes because the page encodes them as `&#x27;`, which the validator's normaliser does not decode. The P1 `kind: trace` item keeps its reproduction command in `detail` and has no quote (the rule and the validator apply to `kind: document`).
- **`by`.** The file has no `tier: claimed` items, so there was nothing to add.
- **Components.** Added 11, all closed (`public: false`, proprietary): the custodial ledger/backend (the only one marked `required: true`), partner banks holding funds, the mobile app, USSD *580#, web.hesab.com, the merchant REST API and developer portal, HesabPOS, KYC verification, the Visa card issuer, the Visa network, and the cash-out agent network. The channels are alternatives, so none of them is individually required. KYC is marked not required because terms s1.1 lets an account open with only a phone number and s5.1 says ID "may" be required. I left out third-party merchant plugins on GitHub because HesabPay does not own them (see GitHub above).
- **Context.** Da Afghanistan Bank's list of licensed electronic money institutions (`https://www.dab.gov.af/non-banking-financial-institutions`, read 2026-10-07) shows "HesabPay", legal name Zinzir Ltd, licence EMI101005, dated 5 June 2023, website hesab.com. The terms name HesabPay, Inc. (Delaware), and the relationship between the two entities is not stated. The 1:1 bank holding of funds is recorded as HesabPay's own statement (terms s2.3, privacy s3). DAB's "Licensing and Oversight of Payment" regulation link (`dab.gov.af/sites/default/files/2018-12/PSORegulation...pdf`) returned 404, so I cite no regulatory safeguarding rule. Governing law is Delaware (terms s9).
- **C4: unknown -> 1.** Under the new anchor, 1 covers "edge filtering disclosed in docs only, or the neutrality of the settlement layer cannot be shown from code". HesabPay discloses AML/KYC compliance with DAB rules (privacy s2), automated fraud detection and real-time transaction monitoring (privacy s4.2), jurisdiction-based transaction limits (terms s3.1), and termination on court or government order (terms s7). The ledger is closed, there is no direct path (C2 = 0), and no list source is named. Judgment call: 1 rather than 0, because what I read is disclosed and nothing I read shows undisclosed filtering. The documented tier caps the cell at 1 in any case.
- **P2: 1 -> 0.** The new anchor 0 includes "collection beyond the stated legal requirement". KYC on its own has a stated legal basis (DAB KYC/AML, privacy s2) and would score 1, since that basis is disclosed in a policy rather than in code or a repo document. But privacy s1.2 and s2 also disclose automatic collection of app usage data (features accessed, transaction frequency, session duration) for "Improvement", a purpose with no legal basis. That is collection beyond the stated legal requirement, so the score drops to 0. The lowering evidence is HesabPay's own policy. Judgment call: device and location data tied to fraud prevention and the agent finder were not counted.
- No other score changed. Validator: `node scripts/validate.mjs --offline data/providers/hesabpay.yaml` and `GITHUB_TOKEN=$(gh auth token) node scripts/validate.mjs data/providers/hesabpay.yaml` both report 0 errors.
