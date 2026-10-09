# Exa Card: research log

Checked: 2026-10-07. Repo pins:

- `exactly/exa@4fba32be1803f15c0db9f39a055bda4740c1fdf1` (main HEAD; server, app, docs config)
- `exactly/exa@aceb1b5be29a84cb2a37742e2204647d249443ab`, the commit that added the OP Mainnet broadcasts. Its `contracts/src/ExaPlugin.sol` matches the Sourcify exact-match source byte for byte apart from a trailing newline, so all contract line citations use this commit.
- `exactly/docs@fd734e9c…`, `exactly/protocol@0d1ca2a6…`, `exactly/audits@a430a152…`

Onchain pin: OP Mainnet block `157885618`.

## Type and scope

- Type `card`. Exa's contracts are verified and public, and Exa publishes its own backend and app (`exactly/exa`, with no license). The card is issued by Third National ("The issuer for this card program is Third National" in the card terms) through Rain (docs tech-stack page; "panda" in the server code), on Visa. KYC runs through Persona and transaction risk scoring through Sardine.
- The website is `https://www.exactly.app`. `exa.app` belongs to an unrelated company.
- Primary chain is OP Mainnet. `common/wagmi.config.ts#L18` defaults EAS production builds to `optimism.id`, and the help article "Which blockchain does Exa App work on" says Optimism. Base broadcasts exist and were excluded; Base markets add a Firewall allowlist that Optimism lacks.

## Onchain reads (block 157885618)

| Read | Result |
| --- | --- |
| ExaPlugin / IssuerChecker / ProposalManager / Refunder | not proxies; Sourcify exact_match |
| ExaPlugin `hasRole(DEFAULT_ADMIN_ROLE)` | Safe `0x6561b09d…` 1.4.1, 3 of 4, no modules, guard 0 |
| ExaPlugin `hasRole(KEEPER_ROLE)` | EOA `0xcDdB2365…` (nonce 417500) |
| `collector()` | `0x3a73880f…`, a BeaconProxy → RainCollateralBeacon `0xE84110fF…` (owner Safe `0x6454cf01…` 2 of 5) → RainCollateral `0xD71Fd741…` (Sourcify exact) |
| IssuerChecker `issuer()` | `0x3Ed5B7C4…` (no code, nonce 0); operationExpiry 4838400 |
| ProposalManager `delay()` | 60 s |
| exaUSDC `0x6926B434…` | TransparentUpgradeableProxy; ProxyAdmin `0xfBa759BC…` → owner TimelockController `0x92024C4b…` (minDelay 86400, PROPOSER includes Safe `0xC0d6Bc5d…` 3 of 6); impl `0xEBd58C87…` not on Sourcify |
| exaUSDC pause roles | PAUSER_ROLE: Safe `0xC0d6Bc5d…`; EMERGENCY_ADMIN_ROLE: Pauser `0x8cC05394…`, whose `owner()` is EOA `0xEa2127b1…` |
| Sample account `0x973ccce3…` | installed plugins ExaPlugin and WebauthnOwnerPlugin; impl UpgradeableModularAccount `0x00460000…a61e` |
| Sample debit tx `0x906cb586…` (block 157882808) | keeper → `collectDebit` → IssuerChecker `Collected` → exaUSDC `Withdraw` to collector |
| USDC (OP) `blacklister()` | `0x551e855b…` |

## Searches

- `gh repo list exactly`, the exa tree (contracts, server, src, substreams, broadcasts), the `exactly/docs` exa-app pages, and the `exactly/audits` file list.
- Help center: sitemap at intercom.help/exa-app → help.exactly.app articles (app terms, card terms, privacy policy, issuance, chain). All are server-rendered, so quotes are checked live.
- Optimistic Etherscan returns 403 to scripts. Explorer links use `explorer.optimism.io` (Blockscout). Its API showed ExaPlugin verified, the collector BeaconProxy unverified, and no record for the market implementation.
- Bug bounty: no SECURITY.md or bounty reference in the exa tree.

## Judgment calls

- C1 = 0. The Pauser owner is an EOA and can pause the market holding all card collateral, which blocks card debits and user exits.
- S1 = 0. Exa's issuer signature plus keeper can debit any amount without a user signature, and the admin Safe can repoint the collector without a timelock.
- S2 = 1, not 2. The market upgrade sits behind a 1-day timelock, but the plugin admin can swap the ProposalManager and swapper (the withdrawal rules) with no timelock.
- S3 = 1. There is no approval; the keeper's built-in collect permission is unbounded and disclosed.
- S4 = 2. Withdrawal through propose/executeProposal after 60 s needs no keeper. The pause and ProposalManager-swap risks are noted.
- O1 = 1. The market implementation is unverified on Sourcify.
- O2 = 3. Exa's own full stack is public; the closed parts are third parties and keys, scored elsewhere.
- F2 = 0. No CLA, but no license either. I took the lower anchor because nothing constrains relicensing.
- P5 = 0. Only the Alchemy key is configurable, not the endpoint.
- S6 = 1. The Mar-25 Quantstamp audit has per-finding fix commits and ends at 368df25, but the deployed plugin (aceb1b5) is 23 commits later and ExaPlugin.sol changed in between. Only a summary excerpt is archived.

## Availability 2026-10-09

- Model `allowlist` with 41 countries.
- Sources (help.exactly.app sitemap; all archived under `data/archive/exa-card-*.txt`):
  - "Card availability and usage" (8979641, "updated over 2 weeks ago"). This is the allowlist.
  - "List of prohibited countries for the Exa Card" (10715755, 2026-01-15).
  - Exa App Terms (9942510, 2025-10-02).
- Also read:
  - Exa Card Terms (10707672, 2025-10-02). They contain a non-US attestation and no country list.
  - Exa Card terms for US citizens (11384293, 2025-05-20).
  - "Where is the Exa Card issued?" The answer is the US, via Rain.
- Judgment calls (more restrictive reading, per the brief):
  - NG is removed. The help article lists it as eligible "with conditional approval", but the prohibited list names it.
  - EC, SV, GT and HK are removed. The help article lists them, but the App Terms' sanctions clause names them.
  - US is removed. The help article lists 31 eligible US states and US card terms exist, but the App Terms prohibit US Persons from the App, and the card is created in the App.
  - All three removals are recorded in `note`. A reviewer who weighs the newer help article over the App Terms would add US (state-limited), EC, SV, GT and HK back.
- The "where you can spend" exclusions (CU, IR, KP, RU, SY, UA, VE) are about card use, not issuance, so they are kept in `note`.

## Operational 2026-10-09

File: `data/operational/exa-card.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) left as filled.

- **Help centre.** Read from the sitemap: fees and costs (9055779), FX rate (10102554), ATM withdrawal (11758961), on/off-ramp fees (14093183), purchase limits (8971540), physical card (10026846), "How secure is your card?" (9449573), where issued (10209480), passkey (8977188), card terms (10707672), app terms (9942510), privacy policy (9945134), Bridge terms (13862897) and Manteca terms (13616694). The ATM, ramp-fee, card-fee and Bridge pages are archived as `data/archive/exa-card-ops-*.txt`.
- **Repos.**
  - `exactly/exa@4fba32b`:
    - `server/middleware/auth.ts`
    - `server/api/auth/authentication.ts`
    - `common/AUTH_EXPIRY.ts`
    - `server/hooks/panda.ts` (webhook signature check and Sardine risk calls)
    - `server/utils/sardine.ts`
  - `exactly/docs@fd734e9`: security/ (audits, bug bounty, emergency procedure, Hypernative, testing) and exa-app/the-exa-tech-stack.md.
  - GitHub code search in the exactly org for post-mortem or exploit: no results.
- **Onchain.**
  - IssuerChecker 0x59A6...b3A was created at OP block 134272952 and ExaPlugin 0x3d73...7f3e at block 134273180, both on 2025-04-08 (code size 0 the block before).
  - `Collected(address,uint256,uint256)` topic0 was checked on sample debit tx 0x906cb586...e79b: the emitter is IssuerChecker and word 0 is 43150000 (43.15 USDC).
- **Registers.** Third National: same result as for ether.fi. The FDIC lists no active institution, and the OCIF verification site failed TLS. Neither Uruguay's register nor Bridge's licences were checked.

Judgment calls:
- **Custody `hybrid`.** The site label is "self-custody with a provider-controlled spend path". The S1 = 0 finding (unbounded keeper debit, collector repointable without a timelock) is stated in the note. A reviewer could argue for `provider_custodial`, but funds at rest sit in the user's own passkey-owned account.
- **Fees.** The card terms say up to 1.5% FX plus up to 1.5% cross-border; the help centre says 1.5%. Both are recorded. Help-centre pricing pages are treated as documented.
- **ATM contradiction.** The card terms say cash advances are not available; the help centre documents ATM withdrawals (1 USD + 0.65%, 250 USD per withdrawal, 4 per day). Both are recorded.
- **Card spend as `card_withdrawal`.** The schema has no card-spend method.
- **First deployment.** Dated to the currently deployed IssuerChecker/ExaPlugin (Apr 2025). The card existed earlier on previous plugin versions, which are not dated.
- **B12.1 evidenced.** Sardine risk scoring runs on every authorisation, but in code it only raises an alert. Whether it is machine-learning based is not stated, and B12.2 is unknown.
- **B3.1 evidenced.** Recorded as "no time-bound commitment", from the emergency checklist.
- **Incidents `unknown`.** No primary source was reachable (Medium and Mirror return 403; I did not bypass them).
- **Licences `unknown`.** No first-party licence claim; the terms only name the issuer.

Validator: offline 0 errors; online 0 errors.
