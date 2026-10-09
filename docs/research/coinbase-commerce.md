# Coinbase Commerce (Onchain Payment Protocol): search log

Assessed 2026-10-07 by AI research agent (seed). All cells `review: pending`.

## Pins

- Base reads: block 52285285 (https://mainnet.base.org).
- coinbase/commerce-onchain-payment-protocol @ d891289bd1f41bb95f749af537f2b6a36b17f889 (master, last push 2024-08-20).
- coinbase/onchainkit @ 3ecbd8fd28bf65002a4ad97092bfd0b157310e22 (archived; differs from npm @coinbase/onchainkit 1.1.3 only in README.md and create-onchain/package.json).
- coinbase/coinbase-commerce-php @ c258b69d5bb6d4dd45fdc68fee3b60c4a75247d2 (2021).
- coinbase/.github @ a9f35b0168a1bf0e1ebf4835e3484fd96fe1a722 (org SECURITY.md).

## What I searched

- GitHub: the protocol repo (README, Transfers.sol, Sweepable.sol, ITransfers.sol); `gh search repos commerce --owner coinbase` (php, ruby, node, python, react and plugin repos, most archived or marked DEPRECATED); onchainkit checkout module; `gh search code` for the Base address (found DefiLlama `fees/coinbase-commerce.ts`, which lists 6 Base, 5 Ethereum and 6 Polygon Transfers addresses); searches for an audit (none) and for a CLA (none; PR #17 shows only the cb-heimdall review bot).
- Onchain (cast, Base): owner(), paused(), sweeper(), permit2(), storage slots 0-5, EIP-1967 slots on 0x0305…b7a8 and 0xeADE…4971. I also checked the owner's code, nonce and Safe calls (it is an EOA, nonce 22), the operator 0x8fcC…73db (EOA, nonce 0), and USDC/WETH/ETH balances of both contracts.
- Logs: `eth_getLogs` for `Transferred(address,bytes16,address,address,uint256,address)` (topic 0xb7ee4faf…6e86). mainnet.base.org caps queries at 500 blocks, so I sampled 500-block windows. The last 15k blocks were empty for all six Base addresses. In 40 windows spaced 400k blocks apart, events appear only up to block ~44.1M, almost all on 0x0305…b7a8. A 10k-block-step scan then put the last event at block 44134913 (2026-04-01 15:59 UTC, tx 0xb20c6700…e2fb). A query with no address filter found no Transferred event anywhere on Base in 5 sampled windows after April. Ethereum and Polygon contracts were also empty in the windows the public RPCs allowed.
- Sourcify v2: both Base contracts are exact_match. I diffed the Sourcify sources against the repo. 0xeADE matches the repo byte for byte. 0x0305 (deployed at block 21073248 by the owner EOA) adds a permit nonce check and a `PermitCallFailed` error that exist in no public commit.
- Basescan and Blockscout block curl (Cloudflare challenge), so explorer verification is not recorded.
- Web: www.coinbase.com/commerce, /legal/* and help.coinbase.com return 403 to curl. web.archive.org shows /commerce now redirects to /business. commerce.coinbase.com returned 502, api.commerce.coinbase.com returned 503, and commerce.coinbase.com/pay/* serves a static SPA (last-modified 2025-03-28, `x-cache: Error from cloudfront`). beta.commerce.coinbase.com returns 200 and is used as `website`. In the CDP docs, the old Commerce paths 404; only "Migrate from Commerce" pages remain, and they recommend the Business Checkouts API (USDC on Base).
- Terms (2025-10-29) and Privacy Policy (2024-12-03) were read from Wayback snapshots and archived in data/archive/coinbase-commerce-terms.txt and -privacy.txt.
- Hosted checkout: I curled the two JS bundles referenced by /pay/test and grepped them for trackers and endpoints. They contain Amplitude (API key a576ff6d…), the Sprig SDK with session-replay code, Bugsnag, as.coinbase.com, reCAPTCHA Enterprise, Permit2 SDK, mainnet.base.org and api.commerce.coinbase.com. No sanctions or geoblock strings: the 317 "ofac" hits are the substring in "TwoFactor". This is a static grep and does not stand in for a network trace.
- npm: `npm view @coinbase/onchainkit@1.1.3 dist.integrity` (the package is marked deprecated).

## Unit of assessment

Base. OnchainKit Checkout hard-switches to base.id and USDC on Base. The new Checkouts API is USDC on Base only. In the sampled windows, Base 0x0305…b7a8 carried essentially all Transferred events. The README documents a different Base address (0xeADE…4971), so both are listed; they share the same owner EOA. Excluded: Ethereum, Polygon, the four other Base addresses DefiLlama tracks, and testnets.

## What I did not find

- Any public code for the Charge API, the operator signing service, the hosted checkout, the merchant dashboard, or an indexer.
- An audit report, deploy/build scripts, tests, an ABI JSON, an OpenAPI file, or a payee export.
- The repo source for the live 0x0305 contract (it is on Sourcify only).
- Sprig, Amplitude or Bugsnag named in the privacy policy (it says only "third party analytics providers").
- Any statement to payees about USDC freeze powers or the Base sequencer.

## Judgment calls

- C2 = 3: anyone can register as operator, so a payee can sign its own intents and the payer calls the documented contract. I counted that as a direct path, because the signature then comes from a party to the payment and not from Coinbase. Pause (C1) still applies.
- C3 = 1, not 0: the required API and signer are closed, but anchor 0's "single-vendor" is contradicted by the documented permissionless operator role. No operator code exists, so not 2.
- C4 = 2: the contract is neutral; the operator-signature gate is disclosed in the README; the Terms name the sanctions lists; the gate is bypassable via C2. It misses 3 because the repo disclosure names no list source and the filtering components are closed.
- C5 = 2, not 1: the SDK path's token and chain are in code, but the hosted checkout's token list is API-only.
- F3 = 1, not 0: the contract core runs with any operator; the Commerce product needs the hosted API with no open alternative.
- P1 = 1, not 0: telemetry is on by default in both frontends, and the policy discloses it only by category (same reading as Daimo).
- P4 = 1, not 0: hosted-checkout vendors are visible in shipped code and covered by the policy's category disclosure, but they are not named and cannot be swapped.
- S1 = 3: payments are atomic payer-to-merchant transfers. About 6,250 USDC of stray balances sit in the two contracts and can be swept by an owner-appointed sweeper. They are not payment funds, so I did not lower the score; the finding states this.
- S4 = 2: funds are already with payees and the contract stays usable by self-operators, but there is no public frontend or operator, so not 3.
- O3 = 1: README only; reproduction not attempted.
- F1 = 0 by rule (closed required components). The SPDX `UNLICENSED` headers that conflict with the Apache-2.0 LICENSE.md are also noted.

## Validator

- `node scripts/validate.mjs --offline data/providers/coinbase-commerce.yaml`: 0 errors.
- `GITHUB_TOKEN=$(gh auth token) node scripts/validate.mjs data/providers/coinbase-commerce.yaml`: 0 errors.

## Availability 2026-10-09

- Model `blocklist`: CU, IR, KP, SD, SY.
- Source: the Commerce Terms of Service (last updated 2025-10-29), already archived at `data/archive/coinbase-commerce-terms.txt` from Wayback snapshot 20260930113606. The live page still returns 403 to curl.
- The Terms also exclude "any other country subject to United States embargo or HM Treasury's financial sanctions regime" but name no other countries. Per the brief, only the five named countries are listed, and `note` says so.
- Searched for an allowlist of supported merchant countries. help.coinbase.com returns 403, and the Wayback availability API has no snapshot for the guessed help-centre paths. None was found.
- Judgment calls:
  - "Sudan" is mapped to SD only; South Sudan is not named.
  - The Terms bind merchants, but their supply clause also covers serving customers in those countries, so the blocklist applies to the product as a whole.
  - The protocol-level access (permissionless contract, self-operator path) is explained in `note`, not modelled, because the official product restricts these countries.
