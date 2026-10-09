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
