# Hinkal: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/hinkal.yaml`. PSE's Private Transfers Analysis was used only to find the product's own links.

## Deployed?

Yes. Hinkal.sol `0x7cb6…Cfa4` is live on Ethereum, holding 12,397 USDC and 469.6 USDT at block 26153552. It is also deployed at the same address on other EVM chains (the docs' Supported Chains page lists them as Live).

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com at block 26153565: `owner()`, `hinkalHelper()`, `hasRole` for the timelock, EIP-1967 slots, timelock `getMinDelay()` (21600) and role membership, Safe threshold, owners, modules and guard, helper `owner()` and `getRelayStore()`, and `verifierMap` entries.
- Role history: Blockscout logs API (`eth.blockscout.com/api?module=logs`). publicnode refuses archive `eth_getLogs`, and drpc's free tier rejected the ranges.
  - On Hinkal: the factory `0x0c61…923c` and the deployer `0x0a0e…445c` got `DEFAULT_ADMIN_ROLE` at deploy. `0xBdc7…1942` and Safe `0x4d28…D7fB` came later. The timelock `0xF043…b7D0` got admin and `HINKAL_HELPER_MANAGER`. Every earlier holder except the factory was revoked.
  - On the timelock: `MinDelayChange` from 180 to 21600 s.
- Repo: `Hinkal-Protocol/Hinkal-Contracts-Circuits@61b6839a` (main, pushed 2026-08-31).
- npm: `@hinkal/common@0.3.16` (integrity `sha512-CvPX…e/cw==`). The tarball was read, not run.

## Unit of assessment

- **Primary chain: Ethereum (1).** It is listed first on Supported Chains. Its Hinkal deployment is the only Sourcify exact match. `deploy-data-ethMainnet` in the SDK names the same Hinkal, helper and timelock.
- The same Hinkal address on Base, Arbitrum and Polygon points to different helpers (read at their latest blocks). We did not assess those, nor Solana or TRON.
- **Source match.** We fetched the Sourcify source of the deployed Hinkal and diffed it against the repo. Hinkal.sol, HinkalBase, Merkle, VerifierFacade and the types are identical apart from a trailing newline.
- **Deployed helper.** `0x5f91…7C1b` is fully verified on Blockscout. Its HinkalHelper, CircomDataBuilder and RelayStore are identical to the repo. It is not the helper `0x62Af…03F5` that the docs page and the constructor name, so the helper has been swapped once.

## What we searched

- `gh repo list Hinkal-Protocol`: 20 repos. Contracts and circuits are BUSL-1.1 by SPDX header, with no LICENSE file. There are SDK wrappers (Go and iOS unlicensed, WDK Apache-2.0), demo apps, and Hinkal-API-Enclave, which is published enclave source (unlicensed) plus attestations.
- No repository holds the main TypeScript SDK source, the relayer, the snapshot, data or compliance servers, or the proving keys.
- Docs: GitBook markdown, fetched by appending `.md`. Pages read: smart contract addresses, supported chains, compliance (both pages), access tokens, security audits, risks, supported tokens and the TypeScript SDK.
- Terms (`hinkal.io/tos`) and privacy policy (`hinkal.io/privacy-policy`) are server-rendered, so their quotes are checked live.
- SDK (npm build):
  - Backend URLs are hardcoded per build mode (`server.constants.mjs` L105).
  - Circuit wasm and zkey files come from `wallet-prodv12.hinkal.io/verifiers-v4/` (`constant.mjs` L4). A HEAD request returned 200 for one zkey (36 MB); we did not download it.
  - Approvals are exact-amount (`approveToken.mjs` L15-L21).
  - Each deposit is reported to the data server (`hinkalDeposit.mjs` L56).
  - `generateProofRemotely` defaults to true. Withdraw has an `isRelayerOff` flag.
- Contracts:
  - No pause, freeze or blacklist.
  - `setHinkalHelper` (helper manager), `registerVerifiers` (owner) and the relayer allowlist (helper owner) are the admin powers.
  - `prooflessDeposit` carries a plaintext `orderId` in calldata.
- Factory `0x0c61…923c` still holds `DEFAULT_ADMIN_ROLE`. It is unverified. `cast selectors` shows only factory functions (appendBytecodeChunk, deployHinkal, ownership), with no generic call. We treat it as inert.

## What we did not find or do

- No transactions, UI runs, traces or self-host attempts.
- No zkey download.
- No reading of the audit PDFs (Google Drive links).
- No check of whether a self-submitted proof is refused by any off-chain compliance step. The docs describe proofs against live Chainalysis state, but the deployed contracts show no such input.
- No disclosure of the Safe signers found.
- S5 left unknown: partner API keys come as publishable and secret pairs per the docs, and the SDK has an optional `x-hinkal-service-key` header. We did not trace the key scopes.
- No primary legal source (court or regulator), so no `context`.

## Judgment calls

- **C1 = 1**: no explicit pause, but swapping the helper or verifiers can stop settlement. That power sits behind a 6-hour timelock run by a 2-of-3 Safe with undisclosed signers.
- **C2 = 2**: the direct contract path is real (relay = 0), but proving keys are hosted only by Hinkal.
- **C3 = 1**: relayer, enclave and snapshot server are optional, but the proving-key host is required and closed.
- **C4 = 1**: screening is disclosed in docs and terms only, and its enforcement point cannot be shown from code.
- **C5 = 1**: issuer blacklist risk is disclosed, but the token list is only a hosted API response.
- **O1 = 2**: all checked settlement contracts are verified (Sourcify or Blockscout), with no build script.
- **O3 = 0**: the README states there are no deployment scripts.
- **F1 = 0, F3 = 0**: BUSL contracts, plus closed proving keys required.
- **P1 = 1**: policy-disclosed, consent-gated analytics. The SDK's deposit report is not described in the policy.
- **P3 = 2**: shielded transfers are private, but `orderId` and plaintext onchain UTXOs add linkage.
- **P5 = 0**: indexer and snapshot endpoints are hardcoded.
- **S1 = 1, S2 = 2**: a non-upgradeable pool whose helper and verifiers can be swapped through the timelock.
- **S3 = 1**: exact-amount in substance, but capped by documented-tier (npm build) evidence.
- **S4 = 0**: withdrawals depend on Hinkal-hosted zkeys.

## Availability 2026-10-09

- Model `blocklist` from the Terms of Service, section 3, Restricted Territory: CU, IR, KP, SY. Crimea and the DNR and LNR regions of Ukraine are in the note. "Any other country to which the United States embargoes goods" is not enumerated, so it is not expanded.
- The terms govern the Interface (site, apps, SDK and API). The contracts have no country gate.


## Operational 2026-10-09

File: `data/operational/hinkal.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) left as filled. Group B covers Hinkal's hosted services (zkey host, backend, relayers, enclave API, apps), since the proving-key host is a required closed component.

- **Docs read** (GitBook, `.md` variants; quotes checked against the HTML): Hinkal Pay, Prime and Wallet fee pages; partner fees, API keys, settings and security, errors and limits; API authentication and get-fee; security audits; compliance pages; Compliance Gateway screening outcomes; WaaS secure enclave; protocol core concepts. Terms (`hinkal.io/tos`) and privacy policy (effective 21 July 2026). status.hinkal.io does not resolve; no security.txt.
- **Registers.** FinCEN MSB registrant search (read-only POST) for "Novelty Today" and "Hinkal": no match; archived as `data/archive/hinkal-ops-fincen-msb-search.txt`. Delaware's entity search needs a CAPTCHA, so it was not used.
- **Onchain** (Blockscout API; publicnode timed out on receipts): Hinkal created by factory tx 0x85f1ad3b…3284 in block 25543753, 2026-07-16 07:32:11 UTC, matching Sourcify. Timelock logs: delay 0 to 180 s (2026-08-25), ownership of Hinkal accepted (2026-08-25), delay 180 to 21600 s (2026-09-10), relayer allowlist changed (2026-09-24). Pool event counts since deployment: no NewTransaction or NewUtxo logs.

Judgment calls:
- **Custody `self_custody`**, with the timelock and hosted-zkey caveats in the note (S1 = 1, S4 = 0).
- **Licences `absent`** with the FinCEN search; state MTL registers not searched (stated).
- **Fees** list three regimes: no fee on the self-submitted path, 25 to 35 bps in the apps, and 10 bps plus a partner fee plus a flat relay fee on the API.
- **Volume `not_observable`**: amount-carrying events are declared but never emitted. Public amounts appear only as token Transfer logs.
- **Incidents evidenced as `[]`** from the empty GitHub advisories list, as for request-network.
- **B3.1 and B3.4 `unknown`**: no notification commitment and no status page. Custodial-only controls (B3.2, B3.3, B4.1, B4.5) are left unset because custody is self-custody.

Validator: offline 0 errors; online 0 errors.
