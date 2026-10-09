# Houdini Swap: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/houdini-swap.yaml`. This log records evidence only. It contains no usage instructions.

## Pins

- houdiniswap-agent @ `b29c75d9c3b2afeaa04e534a4a374f08292cb88f` (main, MIT).
- houdini-api-examples @ `a536b91111f7a4d13145e03791a8b5ffe28b8028` (main, no LICENSE file).
- Docs read on 2026-10-09 at docs.houdiniswap.com, a Mintlify site whose pages are server-rendered, so the quotes check against the live HTML.
- Terms of Service PDF ("Last updated: July 14, 2026", 19 pages), linked from docs.houdiniswap.com/products/swap-transfer/terms-of-service, which redirects to the PDF. We extracted the text with macOS PDFKit and saved it to `data/archive/houdini-swap-terms-of-service.txt`, because a PDF cannot be quote-checked.
- OpenAPI spec: https://api-partner.houdiniswap.com/v2/openapi.json (OpenAPI 3.0.0, version 2.1.2, 32 paths, including /exchanges and /exchanges/private-send).

## Type decision: incumbent

- PSE's Private Transfers Analysis was used only to find the product. Its own site, docs and GitHub org were then read directly.
- Private and standard swaps run through Houdini's hosted Partner API and routing engine to third-party instant exchanges: 12 CEX partners named on the coverage page. Private swaps add a second exchange and an unnamed "privacy-centric Layer 1" intermediary token. The payer sends a plain transfer to a one-time partner deposit address, and the payout comes from a partner wallet.
- No Houdini contract sits in that path. The DEX/bridge route calls third-party aggregators and bridges (Uniswap, Jupiter, deBridge and others); it is not the privacy product and is excluded.
- `gh repo list HoudiniSwap`: two repos, both clients of the hosted API. No server, engine or frontend code. `gh search repos houdiniswap` found only unofficial third-party wrappers (meyersierra1010/houdini-frontend-v2, actuallyrizzn/houdiniswap-sdk, MarcAnthonyCasale/houdiniswap-proxy), which are not the provider's.
- No public contract or repository needed to run the product exists, so the product is `type: incumbent` (no `primary_chain`).

## What we searched

- houdiniswap.com, www and app subdomains: HTTP 403 with `cf-mitigated: challenge` (Cloudflare). We did not bypass it, so the web app source and its analytics are uninspected. `website` points at the docs domain.
- Docs pages read as Markdown (`.md`) and checked as HTML:
  - what-is-houdini, core-swap-concepts, privacy-and-compliance, private-swaps, no-wallet-connect, on-chain-swaps, chain-tokens-partners, monetization-and-fees, FAQs, privacy-notice (last updated 2024-01-25), developer-hub what-you-can-build, architecture, authentication.
  - llms.txt was used as the index.
- Agent repo:
  - `packages/shared/src/client.ts`: default base URL is the hosted API; the override exists, but no alternative server does.
  - `swap-flow.ts`: CEX orders return a deposit address, with "Send exactly N" instructions and no approvals. `dex.ts` has approve/permit for DEX only.
  - `resources/openapi.ts`: the spec is fetched at runtime and not committed.
- api-examples repo:
  - The server-side helper keeps the key and secret out of the browser.
  - It forwards x-user-ip, x-user-agent and x-user-timezone headers, with placeholder values. These headers do not appear in the v2 OpenAPI spec.
- Audits and bounty: the docs mention audits only for third-party DEX contracts. We found no Houdini audit, bounty programme or SECURITY file. S6 is unknown.
- Legal context: no court or regulator primary source located. `context` omitted. The ToS names Houdini Swap LLC, with Cayman Islands governing law and arbitration.

## Judgment calls

- **C1 = 0**: the ToS lets Houdini disable any wallet or identifier at its discretion, and partners can hold a swap for KYC. Both are unilateral and target individuals.
- **C4 = 0 rather than 1**: the filtering happens at the partners that hold the deposit, which is the settlement path. Its criteria are left to the partners' discretion, and the sanctioned countries are unnamed.
- **C5 = 1**: chains are listed in docs. Tokens are listed via the hosted API. Freeze powers are not stated.
- **O2 = 1**: SDK-level code only, consistent with other incumbents.
- **O3, O1, S2, F2, P5, S6 unknown**:
  - O1, S2: there are no contracts.
  - O3: there is nothing to self-host.
  - P5: the only data layer is Houdini's API, and the SDK baseUrl override has no alternative target. We did not pick between "hardcoded" and "configurable in code".
  - F2: we found no CLA and no history to assess.
  - S6: we found no audit or bounty.
- **P3 = 1**: on the docs' account, the onchain substance is minimal linkage (anchor 2), with links held off-chain by the partners and by Houdini for 72 h. We examined no sample transactions, so the documented cap of 1 applies.
- **S1 = 1**: funds in flight are held by partners that Houdini selects. This is disclosed. Redirect ability cannot be inspected.
- **S3 = 2**: a plain exact-amount transfer, with no allowance. Not 3, because the web app is closed and no package or trace was recorded.
- **S5 = 2**: the reference code keeps secrets server-side, and there are no webhooks. Rotation only by contacting support, plus the plaintext x402 key note, are the documented minor issues.

## Availability 2026-10-09

- Model `blocklist`, countries `[US]`.
- ToS preamble (archived): the Services are not offered to persons in the US, including its territories and possessions, or to PEPs. "Restricted Jurisdictions" (countries under US, UK, Canadian, EU or other sanctions or embargoes) are excluded too, but none is named, so only US is listed.
- The docs' Privacy and Compliance page adds website geo-blocking for US- and EU-sanctioned countries (unnamed) and Tor blocking.
- More restrictive reading: comprehensively sanctioned countries are also excluded, but they are not listed because no first-party document names them.
- Exchange partners apply their own terms on top.

## What we did not do

- No swaps, no API calls beyond fetching the public OpenAPI spec and docs, no web-app inspection (Cloudflare challenge), no traces, no sample-transaction analysis.

## Operational 2026-10-09

File: `data/operational/houdini-swap.yaml`. Assessed by the AI research agent (operational); every fact pending review. The repo-facts bot entries (B2.1, B2.3, B8.2, B9.1-B9.8) were left untouched.

- Sources read: docs.houdiniswap.com (llms.txt index; Fees & Pricing, About Houdini, Privacy and Compliance, Private Swap, partner FAQs, Analytics & Settlement, API Keys & Authentication, Rate Limits & Tiers, x402 Payments, Get system health, release notes from 9 February to 29 September 2026, Privacy Notice of 25 January 2024, FAQs), the v2 OpenAPI spec, and the archived Terms of Service (14 July 2026, `data/archive/houdini-swap-terms-of-service.txt`). status.houdiniswap.com did not respond.
- Group A: fees evidenced as stated, with no figure (all-in quote including gas and protocol fees; Houdini's commission from the exchange partner; private swaps about double No Wallet Connect; optional integrator markup; x402 per-call API prices); custody `provider_custodial` (refs S1 0 and 1); licences unknown; cash-out evidenced as the crypto payout leg via exchange partners to any address, with fiat cash-out not applicable (in `note`); first deployment unknown (no dated launch source); entity unknown (Houdini Swap LLC named, jurisdiction of formation not stated); incidents unknown; changes evidenced (Privacy Notice, ToS, Blockaid screening on 18 August 2026); volume not_verifiable.
- Group B recorded: B1.3 absent (SOC 2 with Deloitte "in the process"), B1.4 absent (partner FAQ concedes no audit), B4.1 not_applicable (no swapper accounts), B3.4, B5.1-B5.4, B6.3, B10.1, B11.1-B11.3, B12.1 evidenced; the rest unknown.
- Judgment calls: custody is `provider_custodial` because funds sit with Houdini-selected partners for the whole swap, even though Houdini itself holds nothing. The swap fee has no published rate, so the fee rows record the mechanism, not a percentage. Cash-out uses method `exchange` for the payout leg because the schema has one status per fact; the fiat not-applicable reading is stated in the note. Entity left unknown rather than inferring Cayman from governing law.
