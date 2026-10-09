# COCA Card: research log

Checked: 2026-10-07.

## Type decision: incumbent

I found no verified contract or public repository needed to run the card.

## Searches

- `www.coca.xyz` (Wix): the home page, `/terms` (COCA Wallet Terms, dated 4 November 2023, CCA Labs FZCO, Dubai) and `/privacy` (same date). The terms describe card use as transferring assets "to a third party linked smart contract wallet ... provided by third party services providers". They name no issuer, programme manager or licence. `/card` returns 404.
- `docs.coca.xyz` (GitBook): all 19 pages via `llms.txt` and the `.md` variants. They describe an EIP-7702 smart wallet, Privy keys, per-authorization approvals, IBAN top-ups, 54 supported countries and Morpho/Gauntlet yield. The only addresses given are the COCA ERC-20 token (Polygon `0x7B12598E...F206`, Base `0x959fC04D...906D`), which is not in the card payment path.
- GitHub: `coca-xyz`, `cocaxyz`, `cocawallet`, `coca-wallet`, `coca-card`, `coca-finance`, `ccalabs`, `cca-labs`, `CCALabs` all return 404. `coca-labs` (an org named "Coca Labs") has two 2024 repos (`distr` web server, `memoria` database) with no link to the wallet. `cocalabs` has 0 repos. Code search for `coca.xyz` finds only phishing and filter lists, the OSS Directory entry, and a defiprime guide.
- Subdomains `app.`, `web.`, `api.`, `wallet.`, `card.coca.xyz`: no response. There is no web app whose bundle could be read.
- Google Play id `com.wirex.wallet`: COCA is the former Wirex wallet. The defiprime guide (third party) says Wirex supplied the card infrastructure at launch. The Wirex One provider file in this repo documents Wirex's BaaS contracts on Base, but no COCA artifact ties COCA's card to them. Not used.

## Judgment calls

- COCA's docs pages are treated as provider claims (`claimed`, `by: provider`), the same treatment Avici's docs got. They can hold scores down (C2, C3, C5) but cannot raise them.
- C4 = 1. The terms list prohibited countries, and the docs list supported residence countries. The settlement layer is undisclosed.
- The custody claims ("COCA cannot move your money", "cannot freeze") are unverifiable, so S1 to S6 stay unknown.
- O2 is unknown rather than 0, because attribution of the `coca-labs` org could not be established either way.

## Availability 2026-10-09

- Source: COCA docs, Banking account overview (https://docs.coca.xyz/coca/banking-account/overview), which lists the card's supported residence countries by region. Cross-checked against the COCA Wallet Terms (https://www.coca.xyz/terms), whose "Prohibited Countries" definition names 17 countries plus any UN-sanctioned country.
- Model `allowlist` (the card list is the more restrictive of the two documents). Codes: `EU`, `IS`, `NO` for the 29 countries under "EEA countries" (Liechtenstein is not named, so `EEA` is not used), plus AD, GI, MC, ME, CH, GB, AU, HK, ID, MY, NZ, PH, SG, TW, TH, VN, AR, BR, CL, CO, EC, MX, PE.
- Judgment call: the docs say "54 supported countries, which include" but name only 52. I listed the 52 named and said so in `note`.
- The docs evidence is `claimed, by: provider`, consistent with how this file treats COCA docs elsewhere; the terms are `documented`.
