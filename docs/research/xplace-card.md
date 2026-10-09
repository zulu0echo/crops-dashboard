# XPlace Card: research log (2026-10-07)

## Which product
- XPlace (x.place; xplace.finance redirects there), operated by Pontech Group L.L.C-FZ (UAE). It is a Visa card with Credit Mode (borrow USDC against collateral in Kamino Finance on Solana) and Cash Mode (USDC balance). Card Partner: Signify Holdings, Inc. (Rain).

## Documents (docs.x.place GitBook, server-rendered; `.md` copies via llms.txt; quotes checked)
- Product docs: overview, Collateral (assets and LTVs: SOL 65, wETH 70, cbBTC 70, USDT 80, jitoSOL 50), Credit, card pages. They claim "XPlace has no direct access" and say Kamino holds collateral.
- Terms and Conditions: s1 definitions (Card Partner = Rain, Protocol = Kamino on Solana), s3.4 sanctions with IP geolocation, s5.1 card settlement by the Card Partner, s5.4 Kamino, s10 risk disclosures (exploit, multisig compromise, liquidation), s11.2 limited licence, s12.3 freeze without notice.
- Privacy Policy: Sumsub biometrics, wallet data, Card Partner and Kamino sharing; cloud, database, APM and analytics providers by category only. The Card Privacy Policy names Google Analytics.
- Homepage: "smart contracts are audited by FYEO". No report or address was found; this is a provider claim and was not used.

## Onchain (api.mainnet-beta.solana.com)
- klend program KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD (slot 454205453): upgradeable, programData 9uSbGW1y.... At slot 454205477 the upgrade authority is GzFgdRJXmawPhGeBsyRCDLx4jAKPsvbUqoqitzppkzkW (last deploy slot 440486775).
- GzFgdRJX... is a Squads v4 vault: it appears in VaultTransactionExecute tx uH9cTFjr... (slot 453889271) of multisig 6hhBGCtm..., which also updates OtterSec verify records. Multisig 6hhBGCtm... (slot 454205583): config_authority default, threshold 5, time_lock 86400 s, 10 members, all with permissions 7.
- OtterSec verify.osec.io/status/KLend2g3...: is_verified true, hash b1344d19..., repo Kamino-Finance/klend commit a08760976f, last verified 2026-08-20.
- api.kamino.finance/v2/kamino-market lists 44 markets, none named for XPlace. No XPlace user obligation, referrer or fee address was found, so the market XPlace uses and its owner powers are unknown.
- Rain's Solana collateral program: no mainnet id published (see jupiter-card.md).

## Repos
- Kamino-Finance/klend at a08760976f: LICENSE is BUSL-1.1 (Licensor StroudGlobal S.A.).
- No XPlace repository: gh search repos xplace returned only unrelated projects (placement tools, Android libs).

## Judgment calls
- Type card: klend is a verified build of a public repo, and XPlace's Terms make it the protocol for Collateral and Credit Mode. The link rests on the Terms, not on an observed XPlace position, and Cash Mode may not use Kamino. A reviewer may prefer incumbent; that is the alternative reading.
- primary_chain basis: Solana, from the Terms and the homepage FAQ. Rain collateral and the claimed XPlace contracts are excluded for lack of addresses.
- contracts[].verified for klend is "explorer": the OtterSec registry, which explorers display, is the Solana equivalent of a verified build. There is no Sourcify for Solana.
- O1 1: klend is verified, but the rest of the payment path is not identifiable.
- O2 1: only third-party contracts are public. O3 0: no XPlace code at all.
- P4 0: some processors are named only by category; I took the lower of 0 and 1.
- S1 1: upgradeable lending program, disclosed.
- S2 2: the Squads 5-of-10 with a 24 h time lock has undisclosed signers and no notice channel in the repo. This covers only the identified program; XPlace or Rain contracts, once found, could lower it.
- No `check` on Solana items: the nightly re-check reads EVM words only (recheck.mjs `live.word` uses eth_call/eth_getStorageAt).
- Unknown: O4, F2, P3, P5, S3, S4 (embedded-wallet key export unproven; Kamino withdrawal needs the user's key), S5, S6 (FYEO audit claimed, no report).

## Availability 2026-10-09

- Source: docs.x.place/legal/legal/xplace-terms-and-conditions (GitBook, server-rendered, effective 20 May 2026). s3.2 lists 17 Prohibited Countries, s3.3 lists 16 Restricted U.S. States, and s3.4 bars sanctioned persons and anyone in a Prohibited Country, enforced by IP geolocation, KYC and screening. Quotes match the live HTML.
- Also read: the XPlace Card privacy policy, which has residents' disclosures for Nevada and Brazil but no country restrictions.
- Recorded as a blocklist of 17, with the US states in `note`.
- Judgment calls: the US is not blocked, because only 16 states are restricted. The s3.2 list also covers nationals of those countries, which a country-of-residence map cannot show; this is stated in `note`. No unnamed sanctioned jurisdictions were added.

## Operational 2026-10-09

File: `data/operational/xplace-card.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) left as filled.

- **XPlace docs read** (GitBook, `.md` variants via llms.txt; quotes checked against the HTML): product pages (membership, credit, collateral, portfolio, cashback, card overview, issue and use card), Terms (effective 20 May 2026), Privacy Policy (20 May 2026), Card Privacy Policy, Card Terms US and International (25 October 2025), EULA (15 October 2025). Homepage for the FYEO claim. status.x.place does not resolve; no security.txt.
- **Registers.** CBN microfinance bank list (client-rendered; `/api/GetMFBs` record archived as `data/archive/xplace-card-ops-cbn-mfb-register.txt`): ODOAKPU MFB present. VARA public register (server-rendered): no Pontech or XPlace entry; Rain MENA FZE is listed (VL/26/10/001) but XPlace does not name it. No Meydan Free Zone register could be read.

Judgment calls:
- **Custody `hybrid`**: collateral in Kamino under the user's obligation (S1 = 1), card balance and settlement with Rain/issuer offchain.
- **Licences evidenced for the Nigerian marketing partner only**; Rain, "Third National" and the US issuer are noted, not listed. Pontech's VARA absence is in the note rather than a separate `absent` state, because one partner licence is evidenced.
- **Fees**: the May 2026 terms (FX 0 to 1% by tier plus Visa 1%) conflict with the October 2025 card terms (0% FX); both recorded with the basis.
- **First deployment `unknown`**: no XPlace-owned program address; klend's deployment would date Kamino, not XPlace.
- **Volume `not_observable`**: offchain settlement, Solana, no XPlace market identified.
- **B1.4 `attested`** from the homepage FYEO line (no report). **B6.5 `attested`**: SCCs on request. **B10.1 `absent`** with the docs index as the search.
- **Left `unknown`**: B1.1 to B1.3, B1.5, incidents.

Validator: offline 0 errors; online 0 errors.
