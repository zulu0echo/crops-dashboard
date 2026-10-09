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
