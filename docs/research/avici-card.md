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
