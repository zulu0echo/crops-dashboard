# Wirex One: research log

Checked: 2026-10-07. Base reads pinned to block `52290735` (registry contents and proxy-admin owners first read at 52290562 to 52290604, then re-read at the pinned block), via https://mainnet.base.org.

## Type decision: card

Wirex One runs on Wirex's BaaS contracts on Base. Most of them have source verified on Sourcify, and they are needed for every card debit (FundsManagement, executed by Wirex's oracle).

## How Wirex One was tied to the contracts

- The `one.wirexapp.com` production bundle (Next.js chunks, read with curl) sets `companyName: "Wirex One"`, `externalApiUrl: https://api-baas.wirexapp.com` and localStorage key `wirex-pay-one-uad-local`, registers chains `[84532, 8453, 5042002, 5042]`, and bundles ZeroDev Kernel account code. The excerpts are archived in `data/archive/wirex-one-web-app-config.txt`, with one redaction (see S5).
- `wirexapp/wirex-baas-agent-skills` (Apache-2.0, `7dff6ea`) documents the BaaS deployment: Base 8453 and production ContractRegistry `0xAFa697eb…`; user wallets are Kernel v3.1 with a FundsManagement executor and an ExecutionDelayPolicy.
- The Wirex One privacy policy lists "account abstraction wallet addresses", and the Terms name Privy (keys) and Crossmint Europe (EEA CASP). The registry includes CrossmintOnRampWallet and CrossmintDepositWallet, and FundsManagement has a `dispenseOwed` path for "Wirex App" users migrating to the new stack.
- Activity: 1,104 FundsManagement events in 500 blocks, and 392 OutgoingTransactionProcessed (e.g. "Card-Debit-POS", EUR) in 200 blocks. UserAccountCreated parentEntity values vary, so the registry serves several BaaS programmes, of which Wirex One is one. Judgment call: I treat the shared BaaS deployment as Wirex One's settlement layer because the Wirex One app is hard-wired to it.

## Onchain findings

- Registry `owner()` and `admin()` = EOA `0x8b72904e…`, which also owns the ProxyAdmins of Accounts, FundsManagement, ExecutionDelayPolicy, TokensRegistry and FundsBuffer. FundsManagementOracle = EOA `0x467F3ACD…`. The registry has no Sourcify match.
- Sourcify: the proxies are exact matches; the FundsManagement, Accounts, ExecutionDelayPolicy and FundsBuffer implementations are partial matches (SPDX UNLICENSED); the TokensRegistry implementation is unverified. Basescan verification status could not be read cleanly.
- FundsManagement: `processOutgoingTransaction` (onlyOracle) moves any token amount out of a user wallet to FundsBuffer or to an admin-configured destination. `setApprovalsForRegistryTokens` approves `type(uint256).max` to FundsManagement. On the sample wallet `0x7a55A64c…` the USDC and WUSD allowances are both 2^256-1.
- ExecutionDelayPolicy storage: normal delay 3 s, long delay 86,400 s, validity 600 s. User withdrawals go through request-then-execute.
- TokensRegistry V2: USDC, USDT, DAI, EURC, OUSD, OEUR, WUSD and WEUR (the last two are Wirex synthetics).
- Wirex Pay chain (31415, Polygon CDK validium, blockscout.wirexpaychain.com) has verified "Card" contracts from mid-2025 but only bridge transactions recently. It is excluded, and chain 31415 is not in the dashboard RPC list (reported, not added).

## Judgment calls

- C1 = 0: there is no pause flag, but an EOA oracle that can debit any wallet, set by an EOA-owned registry, is a stronger power that can target individuals.
- O4 = 1, not 2: the ABI docs omit the contracts that move funds, and the API docs are prose with no schema.
- P1 = 1: Sentry, Amplitude, GTM and GrowthBook are on by default in the web app. The privacy policy discloses analytics only by category, which I counted as disclosed. No trace was run.
- P3 = 1: card debits publish type, currency and amount against the wallet. The privacy policy discloses onchain linkability.
- S4 = 0, not 1: a direct withdraw path exists in the contracts, but the Privy key is reached through Wirex's app (export not verified), and admin EOAs can reclassify operations or upgrade.
- S5 = 0: the bundle ships a literal SSO client secret. I did not use it and redacted it in the archive.
- F2 and S6 unknown: no license history applies (contracts are UNLICENSED and no repo holds them), and no audit was found.

## Availability 2026-10-09

No `availability` block: no first-party source lists the countries where Wirex One is offered or prohibited.
- Wirex One Terms (wirexapp.com/legal/one/terms, read 2026-10-09): s1.8-1.11 name the providing entity per region (EEA: Crossmint Europe and UAB Wirex; UK: Wirex Limited; Australia and New Zealand: Novatti; "Rest of the world": Wirex Limited). s1.13 and s5.7 bar use "in any Prohibited Territory" and require residence "in a supported jurisdiction", but neither term is defined or linked, and s1.14 still has a placeholder link ("available at XXX"). s18.5 (Apple clause) excludes US-embargoed countries without naming them. The page footer says "Available in 130+ countries" without a list.
- help.wirexapp.com "Supported countries" (article 1189, client-rendered) has a per-country feature table, but it describes the classic Wirex app (Wirex account, X-Accounts, card) and does not mention Wirex One, which replaced the classic stack for EEA and AU users in May 2026. Judgment call: not used, because it covers a different product.
- Also tried: wirexapp.com/supported-countries and /legal/one/prohibited-territories (404), the help-center search (not reachable as an API), and a web search (only third-party listings, which are not sufficient).

## Operational 2026-10-09

Filled `data/operational/wirex-one.yaml` (bot facts untouched).
- Sources: wirexapp.com/legal/one/terms and /legal/one/privacy (server-rendered), FCA Register in a browser (archived as `wirex-one-ops-fca-wirex-limited.txt`), Companies House 09334596, status.wirexapp.com and its API, and `wirexapp/wirex-baas-agent-skills` at 7dff6ea (auth and overview skills).
- Fees: the Terms (1.14) cite a Fees and Limits Schedule "available at XXX", so no Wirex One fee schedule exists. The help centre's general "Wirex Fees" article (help.wirexapp.com/article/wirex-fees-1379, client-rendered, read in a browser) lists card and ATM fees, but it does not name Wirex One and describes the classic account. Judgment call: not recorded as Wirex One fees, matching the availability judgment above; only the FX mark-up and gas clauses from the Terms are recorded.
- Licences: Wirex Limited, FCA FRN 902025, authorised EMI since 17/08/2018 (register). Crossmint Europe (CNMV, Bank of Spain) and Novatti are named in the Terms but not checked in their registers. UAB Wirex has no Bank of Lithuania register entry.
- First deployment: FundsManagement proxy created at Base block 29552868 (2025-04-29), from Sourcify's deployment record and confirmed with `cast codesize` and the creation receipt (base.blockscout.com is behind a Cloudflare challenge and was not used).
- Incidents and changes: status page API (50 incidents back to 2024-04-17, no post-mortems). Three critical incidents since the Wirex One rollout are recorded. Changes: FCA authorisation date, the legacy-to-Wirex One balance migration (status incident of 29 June 2026), and Terms 13.7 routing EEA card complaints for transactions before 30 September 2026 to TRANSACT Payments Malta Limited's terms. Judgment call: read with 1.8 as a change of EEA card provider; the Terms do not say so in so many words.
- Custody: recorded `hybrid` (user smart account with Privy key plus a Wirex executor that can move balances), with the S1 = 0 reason in the note. The Terms' "self-custodial" claim is contradicted by the onchain executor.
- Group B: B5.1 to B5.3 and B10.1 from the BaaS skills repo (OAuth2 client credentials, single scope partner:full, 48-hour JWTs, Privy for retail users); B6.3, B6.4, B12.1 from the privacy policy (six-year retention, controller routing to Wirex Europe sp. z o.o., automated application decisions and risk profiling); B11.1 and B11.3 from the Terms and Companies House; B3.4 from the status page. No security page, certification, SOC report or DPA was found on wirexapp.com.
- Volume: `not_observable`; the BaaS contracts are shared by several partner programmes and also carry non-card operations.
