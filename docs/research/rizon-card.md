# Rizon Card: research log

Checked: 2026-10-07.

## Type decision: incumbent

I found no verified contract or public repository needed to run the card and attributable to Rizon. Rizon is an app over Rain (Signify Holdings / Nimbus LLC) and Privy, and the card is issued by Third National on Visa. The Terms say each user is assigned a Rain-managed collateral smart contract, but no address, factory or team id is published.

## Searches

- GitHub: repo search "rizon" returns unrelated projects (the RIZON Cosmos chain, the Rizon IRC network, personal repos). Orgs `rizonapp`, `rizon-app`, `rizonmoney`, `rizon-fi`, `rizonfi`, `rizon-labs`, `rizonhq` and `rizonxyz` do not exist. Rain's org `SignifyHQ` (from earlier Rain-program research) has SDKs but nothing Rizon-specific.
- getrizon.com: Terms of Service (Rizon Global, Inc., Delaware; Rizon Technologies, UAB as agent), privacy policy, card and non-custodial-wallet pages. All are server-rendered and the quotes were verified live.
- Intercom help centre: the legal collections hold the Rizon Global and US card terms. "Supported Blockchains" there is Polygon, Optimism and "Arbitrium", plus any added by the issuer. The help article "Which blockchains are supported?" lists Arbitrum, Solana, Base, Polygon, Optimism, Avalanche and BSC.
- dashboard.getrizon.com is a business login shell with no chain or contract config. app.getrizon.com returns 404. No consumer web app was found.
- Rain's collateral contracts on the listed chains serve many card programs. Without a published address or program id, no contract can be tied to Rizon.

## Judgment calls

- Incumbent, consistent with the Avalanche Card file. Rain's shared contracts cannot be attributed to this program.
- C1 = 0 from the card terms' block and suspend power (documented).
- C5 = 0: the card terms enumerate chains but not tokens, and they conflict with the help centre's list.
- C4 = 1: sanctions exclusion (EU, OFAC, UN) is disclosed in the Terms. Contract neutrality cannot be checked.
- P2 = 1 and P4 = 1 from privacy-policy disclosure (KYC partner unnamed; Rain and Privy named).
- The custody claims ("non-custodial", the issuer does not hold collateral custody, liquidation rights) cannot be checked without the contract, so S1 to S6 are unknown.

## Availability 2026-10-09

- Source: Rizon help centre article "Is Rizon available for me?" (https://intercom.help/rizon/en/articles/13517852-is-rizon-available-for-me, dated 18 July 2026), which gives the full list of 44 supported nationalities. Cross-checked against the Terms of Service (https://www.getrizon.com/terms-of-service, "Jurisdictional Restrictions": 30 named prohibited jurisdictions plus Crimea, Donetsk and Luhansk) and the Rizon Global, Inc. Spend Card Terms (not for US citizens; US citizens use the separate Rizon US Spend Card Terms).
- Model `allowlist` with the 44 nationalities as ISO codes. The help article is the most restrictive document; no blocklisted jurisdiction appears on it.
- Judgment calls: (1) eligibility is by nationality, not residence; the dashboard field is per country, so I used the nationality list and explained the difference in `note`. (2) US is kept because US citizens are served by the US card programme; the Global card's exclusion of US citizens is in `note`. (3) The Terms' line that Rizon does not actively market outside the US and Latin America is not a prohibition, so it goes in `note` only.
