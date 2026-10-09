# Solayer Card (Emerald Card / Solayer Pay): research log (2026-10-07)

## Which product
- The Solayer Visa card is marketed as the Emerald Card, and the docs call it Solayer Pay. Apply at app.solayer.org/card (403 to curl). Docs: docs.solayer.org/solayer-pay/*, legal pages under docs.solayer.org/resources/legal/*, mirrored in github.com/solayer-labs/solayer_docs at b9c49657.

## Documents (curl-readable; quotes checked)
- Overview says "built on Solayer Chain", spend directly from USDC, "Non-custodial and fully on-chain", $20/year.
- Security describes a hybrid hot-wallet layer for swipes and "the majority of your assets" in Solayer cold storage behind multisig, plus circuit breakers that freeze suspicious activity. This contradicts the non-custodial claim.
- Eligibility lists 17 restricted US states and 96 restricted countries/territories (residence or citizenship), citing sanctions, regulation and security.
- KYC (Sumsub) collects address, occupation, annual salary, email, ID front and back, and liveness.
- International Card Terms: issuer Third National; Supported Blockchains = Solana; Solayer or the Issuer may suspend "with or without cause and with or without giving you notice".
- US Card Terms (credit card, no set line, collateral-secured): collateral "held in your custody within one or more smart contracts on the Supported Blockchains"; withdrawal needs 3 business days' notice to Solayer; Solayer may liquidate. This is Rain's card-terms template; the Oobit and XPlace terms share it.
- opening-account is Third National's GLBA privacy notice. solayer.org/privacy returns 404; solayer.org/terms covers the website only.

## Repos
- github.com/solayer-labs: 15 repos (agave fork, solana-sdk fork, solayer-rpc, solayer-cli, token-metadata, docs and others). The only card material is the docs in solayer_docs (no LICENSE). No deposit, wallet or card code.

## Onchain
- No deposit address, collateral account or program is published, so nothing was read. sBridge and sUSD programs exist but are not needed for the card (sUSD is an optional savings product).

## Chain decision
- Solana or Solayer Chain? The Card Terms say Solana; the product pages say Solayer Chain. Neither is backed by an address, so as an incumbent the file has no primary_chain and the conflict is recorded in notes and in C5.

## Judgment calls
- Type incumbent: no verified contract or repo needed to run the card.
- S1 1: the Security page discloses provider-held hot and cold wallets. The terms' user-custody claim has no contract behind it, so I took the lower reading.
- S4 0: withdrawal is a request to Solayer with notice.
- C5 1: tokens and chains are in docs only, and the two documents disagree on the chain.
- Unknown: O1, O3, O4, F2, P1 (no Solayer privacy policy), P3, P5, S2, S3, S5, S6.

## Availability 2026-10-09

- Source: Solayer docs, Eligibility (https://docs.solayer.org/solayer-pay/eligibility), "Restricted U.S. States" and "Restricted Countries and Territories (Global)". Cross-checked against the international card terms (not for US citizens) and the US card terms (no country or state list).
- Model `blocklist`, 95 ISO codes from the 96 listed entries.
- Judgment calls: (1) "Darfur" is a region of Sudan and is covered by SD (said in `note`). (2) "Eritea" is read as Eritrea (ER), "Palestinian Territory" as PS, "Democratic Republic of Congo" as CD. (3) Slovenia is the only EU member not listed, so no `EU` shorthand is used. (4) The 17 restricted US states go in `note`; the US itself is not blocked. (5) The page restricts citizens as well as residents; the per-country field cannot express that, so it is in `note`.

## Operational 2026-10-09

File: `data/operational/solayer-card.yaml`. Assessed by the AI research agent (operational); every fact pending review.

- Sources read: docs.solayer.org Solayer Pay pages (overview, fee structure, physical card, security, FAQ, top-up), audits page, legal pages (international and US card terms, opening-account GLBA notice; legal/privacy.md 404), solayer.org/terms, solayer.org/privacy (404), solayer.org/resources/blog, status.solayer.org, the solayer_docs commit history (GitHub API), FDIC BankFind exact-name search for "Third National" (no match; archived as `data/archive/solayer-card-ops-fdic-third-national-search.txt`).
- Group A: fees evidenced (20 USD a year; top-up 1%; 0.15 USD per USD transaction; 0.10 USD + 1.5% non-USD plus up to 3% cross-border; ATM fees unstated, 250 USD per withdrawal; physical card shipping; penalty fees); custody `provider_custodial` (refs S1 0); licences unknown (no licence for anyone; Third National absent from FDIC); cash-out card spend and ATM; first deployment 2025-04-11 (card terms effective; no launch post); entity unknown (Solayer Labs, Inc. named, jurisdiction not stated, notice address a placeholder); incidents unknown; volume not_verifiable.
- Group B recorded: B1.4 (audits cover restaking/sUSD/token programs, not the card), B3.4 (status page without a card component), B6.1 (issuer GLBA notice only), B10.1 (hot/cold wallet description), B11.1-B11.3 evidenced; B6.3 absent (card terms cite a Solayer Privacy Policy that is not published); the rest unknown.
- Judgment calls: Solayer's own pages disagree on fees (top-up 1% / 0.5% / 0.10 USD; international 1.5% / 1.75%); the dedicated fee page is listed first and the others named. First deployment uses the card terms' effective date as the earliest dated primary source. Entity left unknown rather than inferring "US" from New York governing law. Rain is not named in any Solayer document, though the terms follow Rain's template.
