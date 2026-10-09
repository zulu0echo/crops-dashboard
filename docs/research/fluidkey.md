# Fluidkey: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/fluidkey.yaml`. This log records evidence only. It contains no usage instructions.

## Pins

- Base reads via https://base-rpc.publicnode.com at block 52372315 (mainnet.base.org returned HTTP 429 for log queries; publicnode serves only recent logs, drpc caps ranges at 10k blocks).
- Repos: fluidkey/fluidkey-stealth-account-kit@2a4ccfaf, fluidkey/fluidkey-earn-module@122cde19, fluidkey/sara@e6e4fcd9, fluidkey/fluidkey-hydrator@af349109.
- npm: @fluidkey/stealth-account-kit 1.1.1 (repo package.json says 0.0.0, semantic-release; no gitHead), so no `package` evidence.
- Docs: docs.fluidkey.com pages (server-rendered; quotes checked with the validator's normalisation), www.fluidkey.com/terms and /privacy (policy last updated 1 July 2026).

## Unit of assessment

- **Primary chain: Base (8453).** Docs say Near Intents deposits from other chains land as USDC on Base; SARA's earliest auto-earn profile configures Base USDC. Fluidkey runs on 7 EVM chains per its FAQ.
- Fluidkey has no settlement contract of its own. Payments are transfers into counterfactual Safe 1.3.0 proxies (singleton 0xd9Db…9552, factory 0xa6B7…6AB2) owned by stealth EOAs; FluidkeyEarnModule 0x3BDb…f2f9 is optional. Sample account: 0xaAa5…8e70 from an AutoEarnExecuted log (block 52372274).
- Eligibility: the MIT stealth-account-kit is used by the app and is needed to derive and recover accounts; the contracts are public Safe contracts. So `type: transfer` holds, but the app and backend are closed and listed as required components.

## What we searched

- `gh repo list fluidkey`: 11 repos (kit, earn module, SARA, hydrator, hackathon repos). No app, backend, resolver, relayer or indexer code.
- Kit: README (parameters, audit), generateStealthAddresses, predictStealthSafeAddress; LICENSE history (MIT → Apache-2.0 → MIT on 2024-01-12, then copyright edits).
- Earn module: source (authorized relayers, setConfig keyed by config hash, autoEarn wrap/approve/deposit only). Sourcify exact match on Base; deployed source equals the repo file apart from a trailing newline. owner() = Safe 0x9E3e…e7CD, Safe 1.4.1, threshold 2 of 3, no modules, guard 0. Relayer events could not be enumerated with public RPCs; the sample autoEarn tx came from 0xeC39…d5FE via 0x8090…58a0 (signature path).
- Sample stealth Safe: VERSION 1.3.0, threshold 1, owner an address with no code, masterCopy 0xd9Db…9552, guard 0, earn module enabled.
- Docs read: Technical Walkthrough (viewing-key node shared with Fluidkey; ENS offchain resolver), FAQ (7 chains; Dedaub audit), Receiving and Sending Funds (multi-account sends; Near Intents), Recovery (SARA as last resort), Account Set-up (Privy embedded wallet), Earn (profiles, vault list, Ackee audit).
- Terms: sanctions clause names regimes (Switzerland, UN, EU, UK, US/OFAC) but no countries, so no `availability` block. Privacy policy: data categories incl. sanctions/PEP screening indicators and biometric data for the Bank feature.
- Audit PDFs: our small extractor could not read either PDF's text in reasonable time, so no audited commits were recorded.
- Legal context: no court, regulator or government source found for Fluid Privacy SA; `context` omitted.

## What we did not find or do

- No app, backend, resolver or relayer code; P1, P5 and S5 are unknown.
- No country list from a first-party source.
- No transactions, app runs, traces or self-host attempts.

## Judgment calls

- **C1 = 3**: no onchain role can block a transfer into a 1-of-1 Safe; the earn module only deposits into configured vaults.
- **C2 = 2**: settlement is a plain transfer and recovery is possible with public code, but address issuance is Fluidkey's and the direct path is documented only as recovery.
- **C3 = 0**: address issuance (ENS resolver, payment pages) is closed and single-vendor.
- **C4 = 1**: screening disclosed only in the privacy policy and terms.
- **C5 = 0**: open token set, freeze and sequencer assumptions not stated (as Railgun).
- **O3 = 0**: no self-hostable payment deployment; SARA recovers but does not receive.
- **F2 = 0**: kit licence flip in January 2024 (as Privacy Pools).
- **F3 = 1**: production needs the hosted backend; the kit is an open alternative only for derivation and recovery.
- **P3 = 2**: fresh addresses, but the app's spend logic can merge stealth accounts and earn-module Safes are recognisable.
- **S1 = 3**: direct transfer into payee-owned Safes; auto-earn moves funds into vaults without per-transaction signatures and is noted.
- **S4 = 2**: funds recoverable with kit and SARA; new address issuance stops without Fluidkey.
