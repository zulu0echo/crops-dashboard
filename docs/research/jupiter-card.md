# Jupiter Card: research log (2026-10-07)

## Which product
- Jupiter Card is the Visa card in the Spend tab of the Jupiter mobile app ("Jupiter Spend", formerly Jupiter Global). Docs: docs.jup.ag/user-docs/global/spend/*.

## Documents (all curl-readable from docs.jup.ag; Mintlify also serves `.md` copies)
- Spend overview: Global ID (email/Google/Apple), five-step KYC handled by SumSub, deposits in USDC (Solana, Ethereum, Sui, Arbitrum, Base) or USDT (Solana). It also says "Spend balances are managed by the regulated financial partners" and that with a Rain card the stablecoins "stay on-chain as collateral".
- Jupiter Card: issuers Rain (most countries) and DCS (nine APAC countries), one per user; purchases settle in fiat over Visa; supported countries and US states.
- Risks & Security: partners per product (Rain and DCS for the card, Noah for off-ramp and remittance, DCS for QR Pay).
- FAQ: KYC is "required by law"; withdrawal only to bank via Noah, region-dependent, USDT deposits not withdrawable, Rain-card refunds not withdrawable; Global ID cannot be deleted.
- Fees & Limits: Rain has no spending limit; DCS has $50k/day.
- No Jupiter Spend terms of service, cardholder agreement or privacy policy was found. jup.ag/terms-of-use, jup.ag/privacy-policy, jupiter.global/terms and jupiter.global/privacy all return 404. jupiter.money is an unrelated Indian product.

## Repos
- github.com/jup-ag: 202 repos. A name and description scan for spend, card, global, pay, mobile, rain, kyc, offramp, onramp and wallet found only solana-pay forks, unrelated to the card.
- Rain's GitHub org is SignifyHQ (org display name "Rain"). It has collateral-contract-integration-examples (Solana collateral program IDLs v2.00-v2.05 with `"address": ""`, no licence) and rain-sdk-android/ios (Apache-2.0, third-party integrator SDKs). The Android SDK's test fixtures name program A7oUtbpm2pYNeZGNjit9GCGcAQViBbPCuLEnMbu2h15o with the devnet USDC mint. getAccountInfo on mainnet returns null (slot 454164362), so it is a devnet id. No mainnet Rain collateral program id was found.

## Onchain
- Without a Jupiter deposit address there is nothing to read. The docs give no collateral address or program.

## Judgment calls
- Type incumbent: no verified contract or repo needed to run the card. "Stays on-chain as collateral" is a provider claim with no address.
- C1 unknown: no terms were found that state Jupiter's or the issuer's suspension powers. The only suspension mention is in the referral rules.
- C4 1: country gating and KYC review are disclosed in docs only.
- S1 1: the overview discloses that partners manage balances. The Rain collateral claim was not used to raise it.
- S4 0: the only documented exit is a partner-run bank withdrawal, region-dependent, with no crypto withdrawal.
- Unknown: C1, O1, O3, O4, F2, P1 (no privacy policy), P3, P5, S2, S3, S5, S6.

## Availability 2026-10-09

- Source: Jupiter docs, Jupiter Card page, "Supported Countries" and "Supported US States" (https://docs.jup.ag/user-docs/global/spend/jupiter-card). Archived as data/archive/jupiter-card-supported-countries.txt (one live fetch missed the quote). The Spend FAQ and Risks pages point to this list. No terms of service or cardholder agreement exists to cross-check (see above), so there is no prohibited-country list.
- Model `allowlist`, 51 ISO codes: 50 of the 52 listed countries plus US.
- Judgment calls: (1) Bangladesh and Nigeria are "on pause until further notice", so they are left out and named in `note`. (2) US is included because the page lists 31 supported states; the states are in `note`. (3) The page says unlisted countries are reviewed case by case during KYC; that is in `note`, and only listed countries are coded. (4) Evidence is `documented`, matching how this file already cites the Jupiter docs.
