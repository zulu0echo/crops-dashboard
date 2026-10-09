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
