# Avici Card: research log

Checked: 2026-10-07.

## Type decision: incumbent

I found no verified contract or public repository needed to run the card.

## Searches

- Sites: `avici.money` and `www.avici.xyz` serve the same Framer site; `avici.app` returns 404. Legal pages are `/tos`, `/tosavicicard` (Avici Spend Card Terms, issuer Third National) and `/privacypolicy` (Avici Inc, Delaware; updated 2026-10-07). There is also a Notion page with US card terms.
- Docs (`docs.avici.money`, GitBook; `.md` variants via `llms.txt`): secured-credit-cards, its FAQ, profile-verification, spending-and-transactions, and avici-wallet. They describe a USDC "Loan Escrow" contract "on EVM", Avici "spend attestation" charges, weekly liquidation to settle with Visa, Sumsub KYC and AML, a ZeroDev smart wallet on 10 EVM chains plus Solana, an Avici gas relayer, and Relay for auto-swap. They give no chain, address, ABI, audit or repository for the escrow.
- GitHub: the `Avici-Labs` org has 4 repos (v-mcp, redirectAvici, octane, meme50), none card-related and none licensed. Users `avici`, `avicimoney` and `aviciii` have no relevant repos. Code search for `avici.money` found only phishing lists and ecosystem listings.
- The card terms' wording (Third National issuer, "Supported Blockchains" list, liquidation clauses) matches the Rain-platform card terms used by Exa and Avalanche Card. That suggests Rain infrastructure, but I found no artifact naming the contracts, so it is not used.

## Judgment calls

- C2 = 0 and F3 = 0 rest on the provider's own docs (claimed, by: provider), which describe Avici-run attestation, liquidation and API. Provider admissions may hold a score down.
- C5 = 0. The chain holding collateral is not named ("on EVM").
- The custody claims ("only user's wallet can withdraw", "neither Third National or Avici or Visa controls the loan contract") are unverifiable marketing, so S1 to S4 stay unknown.

## Availability 2026-10-09

- Source: Avici docs "Regions and Prohibitions for Avici Card", read as the GitBook Markdown copy (`https://docs.avici.money/getting-started/secured-credit-cards/regions-and-prohibitions-for-avici-card.md`, listed in `llms.txt`; quotes checked live). Tabs: Available Regions (50 entries), Prohibited Regions (17 countries, plus 7 where spending is blocked), Supported US States (31).
- Model `allowlist`, 49 ISO codes (no region names apply).
- Judgment calls: the list has "Dominica Republica" and "Dominicana". Both are names for the Dominican Republic, so I listed DO only and left out Dominica (DM), the more restrictive reading. USA is listed with an asterisk pointing to the supported-states tab, so US is included and the 31 states go in `note`. The Avici Spend Card terms (`/tosavicicard`) require a "not a United States citizen" attestation; I treat this as the international programme, with US cardholders on the separate US terms (the Notion page noted above), and say so in `note` rather than dropping US. The page's statement that the self-custody wallet is "available to all without any restrictions" concerns the wallet, not the card, and is only noted.

## Operational 2026-10-09

- Sources (server-rendered, quotes checked): avici.money/tos (last updated 25 Jun 2026), /tosavicicard (disclosures effective 5 Dec 2024, last updated 20 Jun 2025), /privacypolicy (7 Oct 2026); docs.avici.money Markdown copies (card fees and limits, card FAQ, secured credit cards, withdraw funds, virtual accounts fees and regions, CLI & MCP and its FAQ). Rain: rain.xyz/security, Rain privacy policy, status.rain.xyz.
- Avici never names Rain. The Rain link rests on Rain's privacy policy identifying Third National as its affiliate Nimbus LLC; partner facts are labelled "Issuer group (Rain)" with that note.
- Fees: virtual Platinum $15 then $10, Signature $30 then $20/yr; physical $50 / $75 + $20/yr; no Avici FX markup (terms: FX up to 3%, currently 1%; cross-border currently 0%); ATM $1 + 0.65% on Platinum; $35 dispute fee; virtual account payout ACH $0, wire $15, SEPA EUR 0, SWIFT $25.
- Licences: attested (Rain's statement on Third National); FDIC, NMLS and OCIF as for Avalanche Card. Moonpay and Bridge not checked.
- Cash-out: card spend, ATM ($1,000/txn, $3,000/day), bank payout via virtual accounts (country risk table not split out; noted).
- Maturity: first_deployment 2024-12-05 (card disclosures effective); entity Avici Inc (Delaware, register not checked); incidents = Rain platform incidents with the inferred-link note; changes from document dates.
- Custody unknown (S1 unknown). Volume not_verifiable.
- Group B: Avici publishes no security page, trust centre or status page. Evidenced from Avici documents: B4.1 (biometric passkey for withdrawals), B5.1 (OAuth for the read-only MCP), B6.1, B6.3 (KYC typically five years), B6.4, B10.1 (logical flow only), B11.1, B11.2, B11.3, B12.1 (Avi and the CLI are read-only, so not in the payment path; Rain screening is), B12.2. B1.4 unknown: the escrow is described as Avici-created, so Rain's audit claim was not applied.
