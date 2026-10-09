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
