# Request Network: research log

Assessed 2026-10-07 by the AI research agent (seed). The scores are in `data/providers/request-network.yaml`.

## Pins

- Base reads: block 52285354 (https://mainnet.base.org). Gnosis reads, used only in the notes: block 48631765 (https://rpc.gnosischain.com).
- RequestNetwork/requestNetwork@749b13070bcb88be4a10b8d59fcf3705339d43e0 (master, 2026-09-28)
- mintlify-docs@1845bc53, web-components@0ebac5e1, invoicing-template@6f4872a6, easy-invoice@42ad4d0e, payments-subgraph@c176246e, storage-subgraph@0e970cf4, request-token-list@5af600b0, request-helm-charts@5d833266, docker-images@32563718
- npm: @requestnetwork/payment-processor 0.63.0, request-client.js 0.65.0, utils 0.60.0, payment-detection 0.60.0, smart-contracts 0.54.0. Each version matches the package.json at the pinned commit and is the current latest on npm.

## Unit of assessment

- **Primary chain: Base (8453).** No vendor source names a most-used chain. In the docs repo, `"USDC-base"` is the most frequent mainnet currency ID (15 occurrences, against 8 for `USDC-mainnet`): `grep -rho '"USDC-base"' mintlify-docs | wc -l`. Base appears in the supported-chains table (L19). Excluded: the other 6 EVM chains and Tron in the API list, about 20 legacy chains in the SDK artifacts, and NEAR.
- **Gnosis Chain** holds request storage (RequestHashStorage and RequestOpenHashSubmitter). The validator requires onchain evidence on the primary chain, so the Gnosis findings are in `notes` and the C1 and C3 findings as prose, not as evidence items.
- **Open protocol path versus hosted API.** Request's docs (mintlify-docs) now describe only the hosted Request Network API. The SDK pages redirect to API pages, and faq.mdx L78 says the API is "the recommended way". The API, the Secure Payment page (pay.request.network), and the Dashboard are closed. Judgment call: we score the open protocol path, because a payment completes without the API: the payer calls ERC20FeeProxy directly, and requests are stored through a self-hostable Request Node. The API is listed as a component with `required: false`. This choice drives C3, C4, F1, O2, and F3, and each of those findings says what the API path would score.
- **Settlement contracts in scope:** ERC20FeeProxy 0x1892…b814, EthereumFeeProxy 0xd9C3…96f2, Erc20ConversionProxy 0x8296…e6Ad, and ChainlinkConversionPath 0x3dF8…2ca. All come from `packages/smart-contracts/src/lib/artifacts/*/index.ts` (`base:` entries). Out of scope: batch, swap, recurring (which has `pause()`), escrow and commerce-escrow, SingleRequestProxy, EthConversionProxy, and cross-chain routes.

## What we searched

- `gh repo list RequestNetwork` returns 66 repos. For the live ones we resolved each default-branch SHA and licence through the GitHub API. docker-images, web-components, rn-checkout, mintlify-docs, and request-scan have no LICENSE file.
- Contracts: read source at the pinned commit. Onchain reads with `cast`: owner(), paymentProxy(), chainlinkConversionPath(), isWhitelistAdmin(), EIP-1967 slots, Safe getThreshold/getOwners/getModulesPaginated, and the guard slot.
- Sourcify v2: all four contracts return `exact_match` for both creation and runtime. Basescan shows "Source Code Verified" and "Exact Match" for all four. We diffed the Sourcify sources against the repo files: only a trailing newline differs. Sourcify metadata shows the optimizer disabled, while the repo's hardhat.config.ts enables it. That was added in 77006576 (2025-11-26), after the Base deployment at block 10827274.
- Role enumeration on ChainlinkConversionPath: we tried WhitelistAdminAdded logs. mainnet.base.org caps eth_getLogs at 500 blocks, drpc at 10k, 1rpc at 50, and publicnode needs a token. Blockscout sits behind a Cloudflare challenge, which we did not bypass, and Routescan does not serve chain 8453. So we read only the construction receipt: the admin was added for the deployer 0x4E64…9b93 (an EIP-7702-delegated EOA). Today the deployer is not an admin and the Safe is. Other admins in between cannot be ruled out; the C1 evidence says so.
- Admin Safe 0xf735…5628 (Base): Safe 1.4.1, 3-of-7, no modules, guard 0. The Gnosis Safe 0x8a4D…8037 has the same 7 owners and threshold 3, no modules, guard 0. A search of the repo and docs for the owner addresses and for multisig, timelock, and signers found no signer disclosure.
- SDK: grepped for approve, MAX_ALLOWANCE, endpoints (gateway.request.network, thegraph, infura), sanctions, OFAC, chainalysis, blocklist, geoblock, and the analytics packages (Sentry, PostHog, Segment, Mixpanel, Amplitude, Datadog, GTM).
- Frontends: invoicing-template and easy-invoice mount `GoogleTagManager`. We read @next/third-parties 15.1.0 (`npm pack`): it always builds `gtm.js?id=${gtmId}`, with no guard for a missing ID.
- Live payment sample: Base tx 0x2580e807…3d4e (block 52282170). An Across fill calls a receiver contract, which calls ERC20FeeProxy. The event shows payee 0x737f…c815, 3.0 USDC, and fee address 0x…dead.
- Privacy policy https://request.network/privacy-policy/ (last update 2025-03-19). The quotes were checked against the validator's normalisation.
- Audits: searched the monorepo, the docs repo, the legacy docs repo (docs.request.network), the homepage, and `gh search code audit --owner RequestNetwork`, and checked security.txt (404). We found no report. The only "audited" mention is payer-facing copy in secure-payment-pages.mdx L18.

## What we did not find or do

- No audit report, audited commit, or bounty programme.
- No disclosed Safe signers, timelock, or upgrade notice channel.
- No payee export feature, and no repo-versioned OpenAPI for the hosted API.
- We did not test whether the open storage subgraph is still served at a public endpoint: the guessed Studio URLs returned 404. P3 rests on the schema and the committed swarm key, not on a live query.
- No browser or network traces, and no self-host attempt (O3 capped at 1).

## Judgment calls

- **C1 = 1, not 0 or 3.** The fee proxies have no admin. The conversion owner can repoint the delegatecall target, a code swap that could be written to block chosen addresses. We read anchor 0's "target individual addresses" as a native blacklist function, and the role sits with a disclosed 3-of-7 Safe that lacks a timelock and signer disclosure, which is anchor 1.
- **C3 = 2.** The node's self-host code is public, but the SDK default is localhost with no fallback. The template's hosted-gateway default does not count toward the SDK.
- **C4 = 3.** Neutral contracts, no filtering in any public component, and KYT on the hosted page that is disclosed in the versioned docs repo, names its providers, and can be bypassed through C2. The closed API could screen without saying so, but it is not required.
- **C5 = 0.** Tokens are enumerated in code, but the docs say freezing and seizure risks "don't apply" while settlement uses USDC and USDT. We read that as "misstated".
- **O1 = 2.** Full verification, but the current build config does not reproduce the deployed bytecode.
- **O2 = 2.** The open stack is fully public, but the backend of the recommended API is closed.
- **O4 = 2.** We treat the Request Node README API spec as an OpenAPI equivalent. No export function exists.
- **F1 = 2** although two non-critical repos (docker-images, web-components) lack LICENSE files. Neither is needed to pay, and the web-components npm packages declare MIT.
- **F3 = 2, not 3.** The code shows no hosted dependency, but without an O3 run we take the lower anchor.
- **P1 = 1.** The template loads GTM whether or not it is configured. We take the lower of 2 and 1.
- **P2 = 1.** The bare SDK would score 2. The default invoicing flow and the hosted services collect beyond settlement needs, disclosed only in the policy.
- **P3 = 0.** Invoice contents are unencrypted by default in a swarm with a public key, anchored on Gnosis and indexed in plaintext, and linkable to Base payments through the recomputable paymentReference.
- **S1 = 1 and S2 = 1.** Both turn on the conversion proxy's owner-settable delegatecall target, which we treat as disclosed upgradeability held by a Safe with no timelock. The fee proxies alone would score 3.
- **S3 = 0.** MAX_ALLOWANCE by default in the SDK and the widget. The JSDoc note is aimed at developers, not payers.
- **S4 = 2.** Derived from S1, C2, C3, and O3. With no custody there is nothing to withdraw, and settlement can continue directly, but no recorded self-hosted frontend run supports 3.
- **S5 = 2.** The bundled Infura ID is a shared RPC key and authorises no merchant actions. The webhook comparison is not constant-time.

## Recheck RPC

Base (8453) is in the `scripts/recheck.mjs` RPC map, so no new RPC entry is needed.

## Availability 2026-10-09

- Model `global`. Source: the protocol code at the existing pin: `ERC20FeeProxy.sol` L34-L58, plus the SDK search for sanction, OFAC, chainalysis, blocklist, denylist and geoblock, which finds only test mocks.
- Searched for a first-party country list and found none:
  - `request.network/api-terms-and-conditions/`: Swiss law, KYB "may" apply to API access, no countries.
  - `request.network/legal-notice/` and `request.network/privacy-policy/`.
  - GitHub code search of org:RequestNetwork for "sanctioned", "jurisdictions", "countries" and "OFAC".
- The docs' KYT pages (`use-cases/compliance-gated-payments.mdx` and `use-cases/hypernative-standard-screening-policy.mdx`) screen wallet addresses and are opt-in per destination. They are not a country list.
- easy-invoice `src/lib/constants/compliance.ts` (@42ad4d0e) lists 40 countries for the template's crypto-to-fiat compliance form. It is recorded in `note` as an optional off-ramp variant.
- Judgment call: we keep the unit used for scoring, the open protocol path, so the model is `global`. The closed API is optional and has no published country list.

## Operational 2026-10-09

Facts are in `data/operational/request-network.yaml`. The B2.1, B2.3, B8.2 and B9.x facts come from the repo-facts bot and were left as they were.

- **Fees.** There are two regimes. The pricing page (request.network/pricing/) gives the hosted API path: 0.9% capped at $500, gas included on EVM chains, $3.99 per payment on Tron. On the open path ERC20FeeProxy takes no fee: feeAmount and feeAddress are call parameters. Network sample: tx 0x2580…3d4e on Base (217,904 gas at 0.0116 gwei). That call also ran an Across fill, so a direct proxy call costs less. The Gnosis storage fee, read live, is `getFeesAmount(1000)` = 0.0999 xDAI at block 48666105.
- **Custody.** `self_custody`, consistent with S1 (refs S1 0-2).
- **Licences.** Recorded as `absent`. Sources read: legal notice, API terms, privacy policy, the UID register, and a finma.ch site search (no authorisation found). Not checked: FINMA's authorised-institutions application, SRO member lists, and the Request Tech off-ramp's licences.
- **Cash-out.** `not_applicable` (burden on the institution). The hosted Request Tech off-ramp is noted, but no first-party fee, limit or country terms were found for it.
- **First deployment.** ERC20FeeProxy at Base block 10827274, 2024-02-20. Source: Sourcify creation data plus the block timestamp.
- **Entity.** Request Network Stiftung, CHE-422.666.391. The UID register entry is archived at `data/archive/request-network-ops-uid-register.txt`. The register address (Gartenstrasse 5, c/o Coin Finance AG) differs from the one on the legal notice (Baarerstrasse 82).
- **Incidents.** None found. The monorepo's GitHub security advisories list is empty.
- **Changes.** API terms updated 2025-12-22. Orchestrator fee layer and Merkle Science KYT added on 2026-07-01 (docs commit 9152cc23).
- **Volume spec.** TransferWithReferenceAndFee (topic0 0x9f16…a2b6) on ERC20FeeProxy and Erc20ConversionProxy (which delegatecalls the fee proxy), token word 0, amount word 2, 30 days. Checked against the log of tx 0x2580…3d4e.
- **Group B recorded:** B2.2 (not_applicable, see below), B3.4, B5.1, B5.2, B6.1, B6.3, B6.4, B10.1, B11.1, B11.2, B11.3, B12.1, B12.2.
- **Judgment calls:**
  - The rail is operator-free, so the validator does not allow `absent` on operator controls. B2.2 is therefore `not_applicable` (burden on the institution), with the docs' "6 months of security fixes for the previous API version" quoted.
  - B12.1 records the optional Hypernative/Merkle Science wallet screening as automated screening. The docs describe it as rules and thresholds, not a learned model.
