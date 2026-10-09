# Phantom Cash: research log (2026-10-07)

## Which product
- Phantom Cash: a separate "Cash account" in the Phantom mobile app holding CASH (a Bridge-issued stablecoin on Solana), with a virtual Lead Bank prepaid Visa card (US except NY) run by Bridge as program manager.

## Documents (curl-readable; quotes checked)
- phantom.com/cash: issuer Lead Bank, Bridge Ventures LLC program manager, Phantom platform provider.
- help.phantom.com Cash section: FAQ, Understanding your Cash account, debit card, KYC (Link), recovery and compromise articles. Key statements: Cash account is "a self-custodial smart-contract wallet on Solana"; "Phantom, Stripe, Link, or any partner can't access or withdraw your funds"; at payment "Stripe (our partner) draws CASH from your Cash account"; onchain the user sees a transfer to "Bridge's debit card smart contract"; Bridge rotates addresses; partners are Link, Stripe, Bridge, Lead Bank and Galileo.
- bridge.xyz/card-agreements/phantom-card: Lead Bank Prepaid Visa Cardholder Agreement (block or suspend "with or without notice").
- phantom.com/privacy: third-party analytics with opt-out, KYC fields, BSA basis, merchant location data for Cash, sanctions use of IP.
- docs.phantom.com/cash: CASH mint CASHx9KJ..., 6 decimals.
- usecash.xyz: issuer Bridge Building Inc., MSB/MTL (NMLS #2450917), reserve description. Used for context only.

## Onchain (api.mainnet-beta.solana.com)
- CASH mint CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH (slot 454207323): Token-2022, freezeAuthority AyCP3oW1..., mintAuthority HJT2TXrh..., extensions mintCloseAuthority and permanentDelegate E7JdFMP5..., defaultAccountState initialized, confidentialTransferMint, transferHook (programId null), metadata at token-metadata.bridge.xyz. E7JdFMP5... and AyCP3oW1... are system-owned keypair accounts.
- 60 recent CASH transactions: programs seen were Token-2022, ATA, Token, swap aggregators (DF1ow4..., JUP6..., proVF4...), prediction markets and AMMs. There was no Squads or other smart-account program, so the "smart-contract wallet" could not be identified.
- Candidate 99vQwtBwYtrqqD9YSXbdum3KBdxPAVxYTaQ3cfnJSrN2 (ExecuteTransfer plus ed25519 voucher, seen moving 2,545 CASH): its config account Dodg2... holds one admin (6Bz8AWWi..., also the upgrade authority) and one signer HuAjVESM.... Fifteen sampled transfers all pay out of the same vault 7uTT8Xi5... (mostly USDC) to different recipients. It is a payout/claim program, not a Cash account, and was excluded. OtterSec reports it unverified.

## Repos
- github.com/phantom: no repository for Cash, the card or the Cash account program.

## Judgment calls
- Type incumbent: the Cash account and debit-card programs are unidentified and nothing needed to run the product is public. The CASH mint is a token, not a provider contract.
- C5 0 "misstated": the FAQ says no partner can pull funds, but the permanent delegate can move or burn any holder's CASH.
- S1 0: Bridge is both the CASH issuer and the card program manager, so its permanent-delegate power is treated as a provider able to redirect funds (flagged in the finding against the "score issuer powers under C5" guidance).
- P3 1 rather than 2: the minimal-linkage description is documentation only; no sample card transaction was found.
- P1 1: analytics are on by default with an opt-out, disclosed.
- Unknown: O1, O3, O4, F2, P5, S2, S3, S4 (key export and wallet type unproven), S5, S6.

## Availability 2026-10-09

- Source: Phantom help centre, "Use your virtual Phantom debit card (US only)" (https://help.phantom.com/articles/use-your-virtual-phantom-debit-card-us-only-44800221533459) and the Cash FAQ (https://help.phantom.com/articles/cash-faq-44800866087443); "Understanding your Cash account" has the per-feature availability table. The Bridge/Lead Bank cardholder agreement was also read; it names no countries or states.
- Model `allowlist`: US only, with the New York exclusion in `note`.
- Judgment call: the Cash account is "available worldwide" (and Stripe funding covers EU member states), but this file assesses the card payment path, whose required components are the Bridge card programme, Lead Bank and Visa. The card is US-only, so the allowlist follows the card, and worldwide Cash access is described in `note`.

## Operational 2026-10-09

File: `data/operational/phantom-cash.yaml`. Assessed by the AI research agent (operational); every fact pending review.

- Sources read (curl, quotes checked against the live HTML): help.phantom.com Cash section (Cash fees, debit card, Cash FAQ, Understanding your Cash account, withdraw to US bank, withdrawal timing, CASH on exchanges, account closure, compromise, How your wallet is secured), phantom.com/cash, /terms (17 March 2026), /privacy (7 July 2026), /security, /bug-bounty, /.well-known/security.txt, the launch post (30 September 2025), status.phantom.com, the Lead Bank cardholder agreement on bridge.xyz, github.com/phantom/audit-reports, FDIC BankFind API (certificate 8283, archived as `data/archive/phantom-cash-ops-fdic-lead-bank.txt`).
- Group A: fees evidenced from the Cash fees article and the cardholder agreement (card free domestically, international "fees may apply", 0.85% swaps, onramp 1.75%/3.50%/0.30%/1.00%, fast ACH 1 USD + 0.75%); custody `hybrid` (refs S1 0 and 1); licences evidenced for Lead Bank only (FDIC cert 8283, holder partner); cash-out by card (US), ACH to US banks via Bridge and CASH to Kraken; first deployment 2025-09-30 (announcement; rollout "next month"); entity Phantom Technologies, Inc. (US-DE, from the cardholder agreement; Delaware register not searched); incidents unknown; volume not_verifiable.
- Group B recorded: B1.4 (wallet audits only, both predate Cash), B3.4 (status page without a Cash component), B4.1, B6.3, B6.4, B11.1-B11.3 evidenced; B1.1-B1.3, B1.5, B1.6, B2.2, B3.1-B3.3, B4.2-B4.5, B6.1, B6.2, B6.5, B7.x, B8.1, B10.1, B12.1 unknown. B2.1 (security.txt, Cantina bounty) left to the repo-facts bot because the validator requires repository or API evidence for automatable controls; noted in B1.5.
- Judgment calls: custody `hybrid` follows the S1 finding (user-held keys, but Bridge's permanent delegate and freeze authority on CASH). First deployment uses the announcement date because no dated general-availability source exists. Help articles updated in October 2026 say Stripe now issues the card and refer to "replacement Stripe-issued" cards while still naming Lead Bank; recorded in notes, not as a dated change. Bridge Building Inc.'s NMLS licence not recorded: NMLS Consumer Access returned 403 to curl and was not bypassed.
