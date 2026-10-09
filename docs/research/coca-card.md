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

## Operational 2026-10-09

File: `data/operational/coca-card.yaml`. Assessed by the AI research agent (operational); every fact pending review.

- Sources read: docs.coca.xyz (llms.txt index; banking overview, COCA Card, IBAN, Is COCA safe?, where is my money stored, why are rewards so high, membership tiers, buy and exchange crypto, roadmap), coca.xyz/terms and /privacy (both dated 4 November 2023), coca.xyz/news and the blog feed (COCA 3.0 post of 20 April 2026, its Q&A recap, monthly updates for August and September 2026).
- Archives: coca.xyz is a Wix site that intermittently served pages without body text to curl, and docs.coca.xyz timed out for Node's fetch over IPv6, so the text read was saved as `data/archive/coca-card-ops-{terms,privacy,coca-3-0,qa-recap,update-aug-2026,update-sep-2026,docs-card,docs-overview,docs-exchange,docs-is-coca-safe,docs-rewards}.txt`.
- Group A: fees evidenced (virtual card free, plastic 5 USD for lower tiers, zero FX on direct pairs, ATM free to 250 USD a month then 2% per the card page vs 200 USD per the overview, purchase and ATM limits); custody unknown (S1 unknown); licences unknown (COCA calls itself a "Software Provider" and names no issuer, programme manager or IBAN provider); cash-out card spend, ATM, SEPA bank transfer for 28 listed IBAN countries; first deployment 2023-11-04 (Wallet Terms already define Card Usage); entity CCA Labs FZCO, AE-DU, DSO-FZCO-31557 (register not searched); incidents unknown; changes COCA 3.0 and the 1 September 2026 loyalty update; volume not_verifiable.
- Group B recorded: B1.1 attested (docs claim "PCI DSS and ISO compliant" with no standard, entity or certificate); B4.1, B6.3 (records up to six years), B6.4 (CCA Labs FZCO controller), B11.1-B11.3, B12.1 (automated application decisions), B12.2 evidenced; the rest unknown.
- Judgment calls: COCA's docs pages were treated as `claimed` in the CROPS file for architecture and custody claims; here fee schedules, limits and login methods from the same docs are `documented` (they are the provider's operative terms), while the certification claim stays attested. First deployment uses the earliest dated primary source. Paymentscan (a third-party card tracker COCA says lists it) is mentioned but no figure is stored. Privy's SOC 2 and audits are recorded only in notes because they cover Privy, not COCA.
