# SafePal Card: research log

Checked: 2026-10-07. Onchain reads pinned to Arbitrum One block 512546136 (`https://arb1.arbitrum.io/rpc`).

## Type decision: card

SafePal's card is the Fiat24 Mastercard and Swiss IBAN account offered in the SafePal app. Fiat24 runs its ledger and card debits on public, Sourcify-verified contracts on Arbitrum, so the eligibility rule is met. The "self-custody" framing does not hold up: the card spends Fiat24 deposit tokens that sit in the user's address but that Fiat24 issues, gates and can move.

## How SafePal is tied to the contracts

- `https://www.safepal.com/en/bank`: "offered in collaboration with Fiat24", "Transactions are made on the Arbitrum network".
- SafePal help centre (Zendesk, server-rendered): the FAQ and the EUR24/USD24 and NFT articles describe the account NFT and cash tokens on Arbitrum.
- Onchain: `Fiat24Account.walletProviderMap(8026)` returns `("SafePal", true)`. Accounts whose `walletProvider()` is 8026 (e.g. #75546) appear among card payers.

## Contracts (Fiat24 developer guide, part 1)

- Card authorizer proxy `0xe2e3B88B...5b14`. Implementation `0x96AA3D05...` is `Fiat24CardAuthorizationMarqeta` (Sourcify `match`; the proxy is `exact_match`).
- EUR24 `0x2c5d06f5...`, USD24 `0xbE00f3db...`, CHF24 `0xd41F1f0c...` (Sourcify `match`); CNH24 `0x7288Ac74...` is not on Sourcify.
- Fiat24Account NFT `0x133CAEec...` (proxy `exact_match`); top-up/FX `0x4582f676...` (`exact_match`).
- Every proxy's EIP-1967 admin slot points to ProxyAdmin `0x50873C85...`. Its `owner()` is EOA `0x1272c99b...9D59` (nonce 1350). The same EOA holds DEFAULT_ADMIN_ROLE and OPERATOR_ROLE on the authorizer and on EUR24.
- AUTHORIZER_ROLE: EOA `0xec659e85...755a` (nonce 7,130,096). It sent every `authorize()` sampled.
- EUR24 has `sanctionCheck() = true` and `sanctionContract() = 0x40C57923...c8fb` (a Sourcify-verified `SanctionsList`).
- Card pulls go to account #9110 (owner EOA `0x084d5c2A...3D22`). `sendToSundry` moves balances to #9103 (owner EOA `0x7089581e...464e`).

Source was read from Sourcify (`?fields=sources`): `Fiat24CardAuthorizationMarqeta.sol` (authorize/increment/advice/reverse are AUTHORIZER-only, and `pause()` is OPERATOR-only) and `Fiat24Token.sol` (`tokenTransferAllowed` checks pause, the sanctions oracle, Live status and limits; operator `sendToSundry`; cash payouts finish via `CASH_OPERATOR_ROLE`).

Allowance sample: I took `Authorized` logs from the 100,000 blocks before the pin (1,256 events), mapped each account to its wallet provider, and read its USD24/EUR24 allowance to the authorizer. 10 of 12 SafePal accounts and 188 of 195 Bitget accounts had near-maximum (2^256 minus spent) allowances. The scan was stopped partway through the unique payers, so these counts are a sample.

## Searched, not found

- GitHub: users `fiat24`, `Fiat24`, `fiat24-ag`, `fiat24ag` return 404. `SafePalWallet` has 16 repos. `safepal-app` (GPL-3.0, last push 2024) is a "core version" Flutter wallet with no card or Fiat24 code. The others are firmware (`safepal-s1`, `safepal-x1`), docs or forks. User `safepal` is an unrelated 2015 project.
- Fiat24 docs mention no audit report or bug bounty, so S6 is unknown.
- Arbiscan returns 403 to scripted requests, so links go to Blockscout and Sourcify.

## Judgment calls

- C4 = 0, not 1. The sanctions and status filtering sits in the settlement token itself. It is visible in verified source, but no Fiat24 or SafePal document discloses contract-level screening or its list. I took the lower anchor.
- C5 = 2. Tokens are enumerated in the contract (`validXXX24Tokens`) and in the docs. SafePal states one freeze case (tokens sent to unregistered wallets) but not the operator freeze, the oracle or the sequencer.
- O1 = 2. Mostly partial (metadata) Sourcify matches, and no build script.
- P3 = 1. Each card spend publicly logs account number, address, card id and amount, though not the merchant. The terms disclose the waiver of bank secrecy.
- S1 = 0. An operator EOA can move any balance (`sendToSundry`), so the provider can redirect funds.
- S3 = 0. The default is inferred from onchain allowances, because the SafePal app is closed. Fiat24's guide shows bounded approvals, but users mostly hold unlimited ones, and neither party discloses that.
- S4 = 0. Derived from S1 = 0, C2 = 0, C3 = 0 and O3 unknown. Payout to a bank needs a Fiat24 operator, and transfers need Fiat24-set status.
- O3, F2, P5, S5, S6: no artifact, so unknown. No browser trace was run.

## Availability 2026-10-09

- Source: SafePal's "Supported regions for SafePal Fiat gateway" page (`https://www.safepal.com/en/bank/regions`, linked from the `/en/bank` FAQ). The page is client-rendered by `/assets/js/bank.js` from two SafePal API lists: `ep.isafepal.com/bank/v1/account/getMasterCountries` (42 regions, "$100,000 monthly transaction limit with Mastercard support") and `.../getCountry` (61 regions incl. IBAN-only, "$1000 monthly transaction limit without Mastercard support"). Both raw responses committed to `data/archive/safepal-card-fiat-gateway-regions.txt`.
- Model `allowlist`, 42 ISO codes (no region name: the list lacks BG, MT and HR, so neither EU nor EEA applies).
- Judgment calls: the dashboard rates the card, so I used the Mastercard list, not the wider IBAN-only list (which is in `note`). Cross-check: Fiat24's own coverage data (`https://info.fiat24.com/api/fiat24/getCountries`, which backs the `info.fiat24.com/overview` page that Fiat24's terms cite) has the same 42 card domiciles; its account list omits HR, which SafePal includes. SafePal's FAQ still mentions a Mainland China limit, but CN is in neither list, so I left it out and said so. Fiat24's nationality exclusions (US persons; Iran, North Korea, Russia) and its 38-country merchant payment blocklist go in `note`, not `countries`.

## Operational 2026-10-09

Created `data/operational/safepal-card.yaml` (no bot facts yet; the provider lists no repositories).
- Sources: safepal.com/en/bank, SafePal help centre "Fee Rates for the SafePal Fiat Gateway and Mastercard" (updated 25 July 2026; archived as `safepal-card-ops-fees.txt`), Fiat24 user manual (docs.fiat24.com/user: MasterCard Debit, Cash Payout, Individual Account) and legal pages (Terms of Use, Privacy Policy), FINMA authorised-institutions search in a browser (archived as `safepal-card-ops-finma-register.txt`), Swiss UID register for CHE-256.014.995.
- Fees: top-up 0%, 1% FX on non-USD card settlement, 1 USD/EUR/CHF or 7 CNH per refund, free bank payouts (10 EUR/CHF if returned). Contradiction: the card page still advertises top-up fees from 0.4% and fiat fees from 0.6%. Judgment call: recorded the linked fee article (newer, more specific) and stated the contradiction in the note.
- Cash-out: card spend (virtual Mastercard only, no PIN, so no ATM) and EUR or CHF payouts to registered bank accounts (minimum 100).
- Licences: FINMA lists SR Saphirstein AG, Zurich, under "Licensed persons pursuant to Article 1b BA (FinTech licence)"; holder `partner`. No licence number or date is shown.
- First deployment: Fiat24CardAuthorization proxy created at Arbitrum block 273715521 (2024-11-12), from Sourcify's deployment record and the creation receipt's contractAddress (arb1.arbitrum.io serves no historical state, so codesize before the block could not be read). The Fiat24Account NFT dates from block 4699178 (2022-01-16).
- Changes: Fiat24's 5 June 2026 cap of 30,000 USD a month for new individual accounts. Proxy upgrades not listed (Arbiscan and arbitrum.blockscout.com refuse scripted requests). Incidents: none found, unknown.
- Group B: B4.1 (wallet-held account NFT plus email OTP for online purchases), B6.1 ("industry standard security measures" only), B6.3, B6.4, B11.1, B11.3 (two months' notice, forced payout grounds, no deposit protection) from Fiat24 documents; B10.1 refs O4. Everything else unknown: neither SafePal nor Fiat24 publishes a security page, certification, status page or DPA that I found.
- Volume: `not_observable`; the card authoriser serves every Fiat24 wallet provider, and isolating SafePal needs per-account walletProvider reads the spec cannot express.
