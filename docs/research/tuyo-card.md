# Tuyo Card: research log (2026-10-07)

## Product and unit
- tuyo.com is the Tuyo, Inc. app with a Visa card. The FAQ (help.tuyo.com/guides/faq.html) says "The Tuyo Card and account services operate on Base", and the card is powered by USDC on Base.
- help.tuyo.com/guides/recover-kernel-assets.html names the account contracts on Base: Kernel 3.2 implementation `0xD830D15D...` and ECDSA validator `0x845ADb2C...` (ZeroDev). Both have code at Base block 52290868, and Sourcify reports `match` (partial) for each.
- Source: zerodevapp/kernel tag v3.2 at `cfedcb9b`, MIT (LICENSE.txt). `execute` and `upgradeTo` are `onlyEntryPointOrSelfOrRoot` (L80-L95, L147, L315).
- Eligibility: a public repo and verified contracts are needed to run the wallet, so the type is `card`.

## What I could not find
- A sample Tuyo account, or the card collateral contract. The recovery guide mentions "separate collateral contracts".
  - base.blockscout.com returns a Cloudflare challenge, which I did not bypass.
  - The mainnet.base.org `eth_getLogs` call for USDC Transfer over 300 blocks failed with "backend response too large".
  - Rain's docs need a login.
  - Kernel 3.2 and the ECDSA validator are shared by all ZeroDev users, so they cannot identify Tuyo accounts on their own.
- A name for the card issuer or provider in any Tuyo document. The Terms say "third party card issuer". Card Map (a third-party source) says Rain; this is not used as evidence.
- A Tuyo GitHub org. The GitHub user `tuyo` has 0 repos, and code searches turned up only `tuyoinc/jobs`, which is unrelated.

## Documents
- The Terms of Service (Notion, updated 2026-07-28) render client-side. I read them in the browser pane and archived the text at `data/archive/tuyo-card-terms.txt`. Points used:
  - s2.1: sole-discretion suspension and OFAC eligibility.
  - s3.1: third-party issuer.
  - s3.3: self-custodial wallet, with withdrawal via block explorer if access is suspended.
- The Privacy Policy (Notion, 2024-07-17) is archived at `data/archive/tuyo-card-privacy.txt`. It covers analytics sharing and names Bridge for ramps. It predates the card.
- help.tuyo.com guides (card, FAQ, card availability, Kernel recovery) are curl-readable VitePress pages, and all quotes were checked.

## Judgment calls
- C1 0: per-user suspension at sole discretion with no stated notice.
- C5 1: tokens are enumerated in docs only.
- O1 1: the account contracts are partial matches, and the collateral contracts are unidentified.
- P2 1: card KYC is disclosed, but the policy is stale.
- P4 0: the card provider, issuer and KYC vendor are not named.
- S4 1: the guide documents a manual `execute` call, and the Kernel source shows the root-validator path. Funds in collateral may not be covered.
- Unknown: O3, O4, F2, P3, P5, S1, S2, S3, S5, S6. These need a sample account or collateral contract. The "Tuyo shields your transaction details" claim (card guide) is unverified, so P3 stays unknown.

## Availability 2026-10-09

- Sources: help.tuyo.com/guides/tuyo-availability.html (27 platform-wide prohibited jurisdictions) and help.tuyo.com/guides/tuyo-card-availability.html (card-provider issuance and spending exceptions, plus 20 US states/DC and 5 US territories). Both are VitePress, curl-readable, and say they were verified by Tuyo on 16 July 2026 against its Prohibitions page (about.tuyo.com, Notion, last updated 15 July 2026). Quotes match the live HTML.
- Terms (data/archive/tuyo-card-terms.txt) s2.1 add a general US embargo/OFAC exclusion without naming countries.
- Recorded as a blocklist of 34: the 27 platform-wide countries, plus IL and NI (the only card-issuance exceptions not already on the platform list), plus the five excluded US territories (PR, VI, AS, GU, MP).
- Judgment calls: the US is not blocklisted, because most states are eligible; the 20 excluded states and DC are in `note`. The five excluded US territories have their own ISO codes, so they are listed as countries even though the guide places them under "United States availability". Spending-country restrictions are in `note` only, since they limit where the card can be used, not where it is offered. The Notion Prohibitions page itself was not read (client-rendered); the help guides are Tuyo's own transcription of it.

## Operational 2026-10-09

- New first-party sources since the seed run:
  - about.tuyo.com (Notion, read in the browser pane, archived as data/archive/tuyo-card-ops-*.txt) links an Account Opening Disclosure, which is Third National's privacy notice, and the US and International cardholder agreements. Both agreements define the issuer as **Third National**; the US agreement also mentions Rain in its indemnity clause. The hub also has a "Security audits" file "Tuyo card.pdf" (not downloaded) and an account-deletion page.
  - help.tuyo.com/guides/understand-your-smart-account.html (verified by Tuyo 15 Sep 2026) links the card collateral implementation 0x221677d88E507D21b4f7eC4D8D17e0f2FEd526af on Base (Sourcify exact match, CollateralAccount) and describes its release rules: counterparty-signed release, or depositor ejection after a cooldown, which cancels all cards.
  - These contradict two provider-file points: P4's "issuer not named" and the "collateral contract not identified" notes. The provider file was not edited; a CROPS re-run should use them.
- Fees: from the card guide and FAQ, no issuance or periodic fee; 1% FX plus 1% abroad (max 2%); 0.25% trading fee. The international agreement allows up to 3% plus 3%; the US agreement says 1% international and a 2% late fee.
- Cash-out: card spend; ATM (250 USD per withdrawal, 3 attempts per rolling 24 h, operator fees only); bank transfer through Bridge (USD ACH/wire, EUR SEPA, MXN), with Bridge's country table. The international agreement says cash advances are not available, which contradicts the ATM guide.
- Licences: attested only. BANEX Microfinance Bank (CBN) markets the card to Nigerian users per the international agreement. No register reached: the CBN microfinance list page returned no list. Third National's regulator is not stated anywhere.
- First deployment: bisecting eth_getCode on mainnet.base.org puts the CollateralAccount implementation at block 26827639 (2025-02-25). The card disclosures are effective 7 March 2025.
- Group B: B1.4 attested (audit file listed, not read); B6.3, B6.4, B10.1, B11.1 and B11.3 documented. Nothing found for B1.x, B2.2, B3.x, B4.x or B12.x.
- Judgment calls:
  - custody_model is `unknown` because S1 is unknown in the provider file. The documented structure reads as hybrid.
  - Entity jurisdiction is recorded as US, inferred from the Delaware governing-law clause and the 302 support number. Neither Delaware ICIS (CAPTCHA) nor EDGAR confirmed it.
  - Volume is `not_observable`: the per-user collateral proxies are not listed, and the listed Kernel contracts carry no card events.
