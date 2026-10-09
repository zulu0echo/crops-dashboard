# Avalanche Card: research log

Checked: 2026-10-07. Avalanche C-Chain reads were made at block `96949792` (`cast block-number --rpc-url https://api.avax.network/ext/bc/C/rpc`).

## Type decision: incumbent

I found no verified contract or public repository that is shown to be needed to run this card (seed-brief eligibility rule).

## Searches

- `avax.network/card` returns 404. The product site is `avalanchecard.com`, which says the card is "offered by Rain Liquidity" and supports USDC, USDT, AVAX and WAVAX. Its legal hub (`legal.avalanchecard.com/legal`, SpotDraft, server-rendered) links the app terms, the international and US card agreements, the privacy policy and a Third National financial privacy notice.
- The privacy policy defines Rain as Signify Holdings, Inc. and affiliates, including Nimbus LLC d/b/a Third National (the issuer) and Rain Liquidity LLC (app and collateral functionality).
- GitHub: `SignifyHQ` is Rain's org (SDKs for "Rain collateral on EVM chains and Solana"). Licences: rain-sdk-android Apache-2.0, rain-sdk-typescript Apache-2.0, rain-sdk-ios MIT, rain-skills MIT; collateral-contract-integration-examples has none. Its `withdraw-collateral.mdx` says EVM withdrawals need a Rain API signature passed to the controller's `withdrawAsset`. No Avalanche Card app, backend or contract repo exists. Code search for `RainCollateral` found only third-party scrape repos.
- Onchain: Rain v1 `RainCollateralController` `0x753Fb325…` and `RainCollateral` `0xD71Fd741…` have code on Avalanche and are verified on Routescan, though not on Sourcify. Controller reads: `controllerAdmin` `0xB92949bd…`, `treasury` `0x8454D827…`, `owner` Safe `0x6454cf01…`. In verified source, `liquidateAsset` lets controllerAdmin move any collateral to the treasury without a signature, and `withdrawAsset` needs a controllerAdmin signature.
- Tie to this card: Routescan getLogs for the last 1000 `Withdrawal` events shows USDe (986), USDC (7) and USDT (7), and no AVAX or WAVAX. No WAVAX or USDC transfers into the Rain treasury appeared in about 10,000 recent blocks. The card agreement's "Supported Blockchains" list omits Avalanche. I could not show that these contracts hold Avalanche Card collateral, so they are not listed or scored.

## Judgment calls

- Incumbent rather than card. The Rain contracts on Avalanche serve multiple Rain programs (USDe dominates), and nothing ties a specific Avalanche Card account to them.
- C5 = 0 ("misstated"). The binding card agreement enumerates chains that do not include Avalanche, while marketing promises AVAX and WAVAX collateral.
- O2 = 0. Rain's public SDKs are for integrators and are not shown in this app.
- P1 = 1 and P4 = 1, at the documented cap, from privacy-policy disclosure. No trace was run.
- S1 to S6 are unknown. The custody terms ("will not ... be holding custody", liquidation rights) cannot be checked without the contract.

## Availability 2026-10-09

- Sources: the FAQ on `https://www.avalanchecard.com/` (server-rendered Webflow, quote checked live), "What countries are supported?", and the international card agreement on `legal.avalanchecard.com` (non-US-citizen attestation, OFAC). The app terms add a generic US-embargo representation with no list.
- Model `blocklist`, 18 codes: BY, CN, CU, IL, IN, IQ, IR, KP, LK, NG, NI, NP, RU, SY, TR, UA, VE, VN.
- Judgment calls: the FAQ mixes a positive scope ("many U.S. states, Latin America, and the Caribbean", not enumerated) with an explicit list of excluded countries and US states. The brief says to expand only what a document names, so I used a blocklist of the 18 named countries and put the positive scope in `note`, saying that nothing affirms availability outside the Americas. The 16 excluded US states are sub-national, so they go in `note`; US stays off the blocklist because the US card agreement covers the other states.

## Operational 2026-10-09

- Sources (server-rendered, quotes checked): avalanchecard.com FAQ (fees: FX 1%, account, cards and shipping $0); legal.avalanchecard.com international card agreement (disclosures effective 2/12/25; archived as data/archive/avalanche-card-ops-international-card-agreement.txt because one validator fetch missed the quotes), US card agreement (last updated 5 Feb 2025), app terms (Rain Liquidity LLC, last updated 26 Feb 2025, Montana law), privacy policy (the consolidated Rain policy, last updated 16 Jul 2026, with change log). Rain: rain.xyz/security, legal.raincards.xyz privacy policy and AI exhibit, status.rain.xyz incident pages. trust.rain.xyz is a client-rendered Vanta page (not read); docs.rain.xyz redirects to a login.
- Fees: the FAQ (1% FX) conflicts with the agreements (international: FX up to 3% plus cross-border up to 3%; US: 2% international transaction fee); the FAQ also says no conversion fees. All recorded with the conflict in the note.
- Licences: attested. Rain's policy says Nimbus LLC d/b/a Third National is "a licensed lender, money transmitter and Visa-authorized card issuer", with no regulator or number. FDIC BankFind API: no institution named Third National or Nimbus. NMLS Consumer Access returned 403 to curl (not bypassed); the Puerto Rico OCIF licence check (concesionarios.ocif.pr.gov) failed the TLS handshake.
- Cash-out: card spend only. The international agreement excludes cash advances; the US agreement allows ATM cash only "if enabled". No bank off-ramp found.
- Maturity: first_deployment = 2025-02-12 (international disclosures effective). Entity Rain Liquidity LLC, country only (state of formation not stated; no register checked). Incidents: five Rain platform incidents from status.rain.xyz (scope across programmes not stated). Changes: card agreements, app terms, privacy policy consolidation and 11 Jul 2026 revision.
- Custody unknown (S1 unknown). Volume not_verifiable (no listed contracts).
- Group B: Rain Liquidity is a Rain entity, so Rain's security page is the operator's position: SOC 2 Type II, PCI DSS and a pen-test summary available to partners only (B1.3, B1.5 attested); contract audits claimed with no report (B1.4 attested); code scanning before production (B1.6); incident response plan with partner notice, no time (B3.1); status page without post-mortems (B3.4); central security monitoring (B7.2). Privacy policy gives B6.1 (plus TLS 1.1 refused, 1.2 accepted), B6.3, B6.4, B12.1 and B12.2 (override only). Terms give B11.1 and B11.3. ISO 27001, patch SLAs, backups, recovery, access controls, APIs, DPA, logging and hosting are unknown.
- Judgment calls: Rain status incidents recorded as this card's incidents with a scope note; entity jurisdiction recorded as US only; B11.2 evidenced from fee revenue only.
