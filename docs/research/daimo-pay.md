# Daimo Pay: research log

Checked: 2026-10-07. Repo pin: `daimo-eth/sdk@ac0a71453ac249aa991d71059c621e2424322d61` (master HEAD, resolved with `gh api repos/daimo-eth/sdk/commits/master --jq .sha`). Onchain pin: Base block `52280426` (`cast block-number --rpc-url https://mainnet.base.org`).

## Scope and primary chain

- `https://pay.daimo.com` redirects to `https://daimo.com/`, so `website` is `https://daimo.com`.
- `gh repo list daimo-eth --limit 100`: the live product repo is `daimo-eth/sdk` (SDK and contracts). `native-demo`, `real-world-payment`, and `p256-verifier` are live but not part of the payment rail. The rest are archived (`daimo`, `paykit`, `daimo-pay-demo`, `daimo-store`, `pretix-eth-payment-plugin`, and others). No backend, relayer, indexer, or hosted-frontend repo exists.
- The repo holds two generations of contracts: DaimoPay/PayIntent orders, and the newer DepositAddress* system. `@daimo/sdk` 1.8.x pays into deposit addresses: `useWalletFlow.ts` does a plain transfer to `destAddr`, and the waiting page is `WaitingDepositAddressPage`. Only the DepositAddress system is scored.
- Primary chain is Base (8453). The docs' API examples use Base USDC, and `broadcast/DeployDepositAddressManager.s.sol/8453/run-latest.json` exists. Broadcasts also exist for 15 other chains; none were assessed.

## Address resolution

The contracts are deployed through CREATE3, and the broadcast JSON records only the factory call. Each address was resolved as follows:

```
cast call 0x37922885311bc9d18e136e4fe6654409d3f45ffd "getDeployed(address,bytes32)(address)" \
  0x723a63fb50da50a26997fb99a2eb151e4f8c5227 $(cast keccak "DepositAddressManager-2026-06-22") \
  --rpc-url https://mainnet.base.org --block 52280426
```

Salts come from `script/DeploySalts.sol`. Results:

- Manager: `0xfca14E46…009b6`
- Factory: `0xE91788B6…a36A`
- Executor: `0xc9b29db5…a2b6`
- `DaimoPayPricer-prod2`: `0x216A238a…792C`

The newest bridger salt (`-prod-2026-10-05`) has no code on Base. The pricer and bridger used in production came from a live session's DAParams instead. Tx `0x8d3d409f…bd00` (block 52280330) is a `SameChainFinish` whose params reference pricer `0xA8DCDF1f…936a` and bridger `0x59dc13C4…1264`.

## Onchain reads (block 52280426)

| Read | Result |
| --- | --- |
| `owner()` on manager | `0xd4cFb1c3…b131`, codesize 0 (EOA); Safe calls revert |
| EIP-1967 impl and admin slots on manager | zero |
| Impl slot on sample deposit address `0x392d3A24…b846` | `0x23EE5dD3…6673`; admin slot zero |
| `relayerAuthorized` | true for EOA `0xA9C38348…4E2f` and wrapper `0xc88fd3c0…eE04`; false for owner and pricer |
| Wrapper `hasRole(0x00, ·)` | true for `0xA9C3…` and for owner `0xd4cF…` |
| Pricer `trustedSigner()` | `0xE1432f86…AA25` (codesize 0, nonce 0) |
| Pricer `maxPriceAge()` | 300 |
| Bridger `owner()` | reverts |
| Executor `escrow()` | manager |

We did not get the full relayer set. `eth_getLogs` for `RelayerAuthorized` failed on every public endpoint we tried:

- mainnet.base.org: 500-block limit.
- base.drpc.org: refused even 1,000-block ranges on its free plan.
- publicnode: archive token required.
- Etherscan v2 free tier: Base not supported.
- Blockscout: Cloudflare challenge.

The two relayers listed were confirmed with direct reads.

## Verification

Sourcify (`/server/v2/contract/8453/<addr>`):

| Contract | Sourcify result |
| --- | --- |
| Manager | `match` (partial) |
| Factory, impl, pricer `0xA8DC`, bridger | `exact_match` |
| Executor | 404 |
| Relayer wrapper | not found |

Basescan `#code`:

| Contract | Basescan result |
| --- | --- |
| Manager, executor, factory, impl, `0x216A` pricer | Source Code Verified (Exact Match) |
| Bridger, pricer `0xA8DC` | "Similar Match" only |
| Relayer wrapper | unverified ("Are you the contract creator") |

## Code read at the pin

- Contracts: `DepositAddressManager.sol` (entrypoints, modifiers, events, refund paths, `setRelayer`), `DepositAddress.sol`, `DepositAddressFactory.sol`, `DaimoPayExecutor.sol`, `DaimoPayPricer.sol`, `SwapMath.sol`, `DepositAddressBridger.sol` (no owner), and `relayer/DaimoPayRelayer.sol` (AccessControl, admin-only entrypoints).
- Searched `src/` for pause, blacklist, freeze, and upgrade. The only hits were `Initializable` imports.
- SDK:
  - Searched for hardcoded URLs. Found `api.daimo.com` and `daimo.com`, both overridable by prop.
  - Searched for telemetry packages in `package.json`. Found none, but the lockfile is stale (1.0.0-rc.1).
  - Found first-party nav-event logging in `navEvent.ts`.
  - Found approvals and transfers in `useWalletFlow.ts`: transfer only, no approve or permit.
  - Searched for sanctions and geo terms. Found none.
  - Location comes from the server nav tree.
  - Found Privy, Coinbase, and Stripe integrations, and the fiat KYC form schemas.
- License: root `LICENSE` is a symlink to `packages/connectkit/LICENSE`, a path that never existed in history. `license.txt` is BSD-2-Clause. `git log -- license.txt` shows the 2025-05-27 add and a 2026-02-28 copyright-line change. All 32 contract sources are GPL-3.0-or-later. No CONTRIBUTING, CLA, or SECURITY file.
- Audit: `packages/contract/audit/NM-0585-Daimo-final-report.pdf`, text extracted with pypdf.
  - Scope is the UniversalAddress* files at commits `ef97c77f`→`80312d47` (July 2025).
  - Those commits and the fix commits return 422 from the GitHub API for daimo-eth/sdk.
  - The UA code was deleted in `99c3f248` (2026-01-08). DA code arrived in `c990a190` (2025-12-17).

## Documents

- docs.daimo.com:
  - Read `/llms.txt`, `supported-chains`, `guides/payment-methods`, `guides/webhooks`, `guides/fiat`, `api-reference/overview`, and `guides/sessions`.
  - `/openapi.json` (OpenAPI 3.1.0, 10 paths) is hosted only.
  - No mention of freeze, blacklist, or sequencer.
  - No bounty or audit page.
- `https://daimo.com/privacy` (updated 2026-02-28) discloses:
  - IP, device, location, and usage collection for internal analytics.
  - Log aggregation by third parties.
  - KYC through a third-party partner for fiat only.
- `https://daimo.com/.well-known/security.txt` returns 404.
- The initial HTML of `daimo.com/` and `daimo.com/webview` contains no analytics-vendor strings. JS bundles were not inspected. This is not a trace and was not used as evidence.

## Judgment calls

| Cell | Score | Why |
| --- | --- | --- |
| C1 | 0 | No literal pause exists. The relayer allowlist is EOA-owned and has no timelock, and removing relayers halts settlement. Relayers can decline or early-refund single deposits. We treat this as an EOA-held pause. |
| C4 | unknown | Any screening would happen in the closed API. A code search finding nothing does not justify a 3. |
| O1 | 2 | We class the unverified relayer wrapper as operator tooling. If counted as a settlement contract, the score would be 1. |
| O2 | 1 | The hosted frontend and indexer are closed as well as the backend, so not 2. Public contracts and deploy scripts mean not 0. |
| O3 | 0 | The brief caps O3 at 1, but no README path reaches a deployment that settles, because the relayer, signer, and API are private. |
| O4 | 1 | The merchant API schema exists only on the hosted docs. |
| P3 | 1 | The payer–payee linkage is visible in verified event definitions, and the policy says payments are onchain. No user-facing document describes the linkage. |
| P4 | 1 | Visible third parties are named, but none is swappable by config. Backend vendors are unseen. |
| S1 | 0 | Each deposit address is immutable and escrow-bound, but the payee's minimum comes from prices signed by Daimo's key. The relayer runs arbitrary calls and keeps any surplus. |
| S3 | 3 | The flow has no approval at all, which is stricter than exact-amount approval. |
| S5 | 2 | Webhook verification reference code is only in the docs, and rotation is not shown. |
| S6 | 0 | The only audit covers the earlier contracts, not the deployed ones. |

## Not found or not done

- Full `RelayerAuthorized` history (RPC limits).
- Backend, relayer, signer, and indexer source: not public.
- Bug bounty.
- An audit of the DepositAddress contracts.
- Payee export format.
- Network traces, so P1, C4, and P4 cannot reach 3.
- A self-host attempt, so O3 has no trace.
- Bytecode reproduction from `foundry.toml`.

## Migration 2026-10-07

Migrated `data/providers/daimo-pay.yaml` to the rules added after the methodology red team (`docs/seed-brief.md`, final section). Repo and onchain pins are unchanged (`ac0a7145…`, Base block `52280426`). Both `node scripts/validate.mjs --offline` and the online run with `GITHUB_TOKEN` report 0 errors.

### Score changes

| Cell | Old -> new | Reason |
| --- | --- | --- |
| F1 | 3 -> 0 | The new `components` list has four required closed components (Daimo API, relayer service, price signer, indexer). A closed required component cannot be forked, so F1 is 0. The public repos alone would still score 3. |
| C4 | unknown -> 1 | The updated anchor 1 covers "neutrality of the settlement layer cannot be shown from code" and "edge filtering disclosed in docs only". Both hold: forwarding is relayer-only and the relayer is closed, the docs disclose country-based payment-method localization, and the terms reserve a blanket right to deny access, including by IP. We have no evidence of undisclosed filtering, so not 0. A trace or provider statement showing screening outside those documents would lower it to 0. |

### Cells re-assessed with no score change

- C1 stays 0. The owner `0xd4cFb1c3…b131` has empty code and nonce 173 at the pinned block, so it is an EOA (`eoa: true` item added). There is no Safe whose modules or guard could be read. Relayers can act on individual deposits with no notice.
- P2 stays 1. IP, device, and location collection on every flow goes beyond settlement needs, is not legally required, and is disclosed only in the policy. The policy says fiat KYC is required by applicable law, but neither the basis nor the limit is in code or a versioned repo document. Documented evidence caps at 1 anyway.
- S2 stays 3 under the non-upgradeable branch. A `recheck` was added (EIP-1967 slots on the manager and a sample deposit address).
- S3 stays 3. It now cites the published package: `@daimo/sdk@1.8.8`, integrity `sha512-KSB6kG…Rmsw==`. The pinned commit is `1.8.9-dev`, which is not published, so the latest release was read. The tarball was fetched read-only from the npm registry and not executed. `dist/web/hooks/useWalletFlow.js` L520-L525 encodes only `transfer`. No non-test file in `dist` calls approve or permit or uses maxUint256. The finding now records a limit. In the optional fiat/account flow, which is off unless the merchant enables fiat, the Privy wallet signs routing authorizations the server supplies, or sends a sponsored transaction the server supplies. Client code cannot show how much those authorizations allow.
- S4 stays 0. Anchor 2 needs a verified withdrawal path that works without the provider. Refunds of an expired deposit need DAParams that only the API holds. Bridged funds can be released only by an allowlisted relayer.
- O3 stays 0. The closed required relayer, signer, API, and indexer leave no path from the README to a deployment, and no deploy script completes a test payment. We did not attempt a reproduction.

### Evidence added

- `primary_chain.basis`. The SDK has no default chain. Base is chosen because of the docs' session example (chainId 8453, Base USDC), the Base broadcast at the pin, and the sampled live session. The 15 other chains and the DaimoPay/PayIntent contracts are excluded.
- `components`: 12 entries. Required and public: the contracts and the SDK. Required and closed: the API, relayer service, price signer, and indexer. Optional: the relayer wrapper contract, which has unverified bytecode; the hosted daimo.com flow; Privy; the Coinbase and Stripe onramps; the KYC partner; and third-party bridge and swap routes.
- `quote` on every `documented` document item. Each was checked against the page fetched with curl. The audit PDF is a GitHub-rendered PDF, so its quote is checked against `data/archive/daimo-pay-nm0585-audit.txt`. That file holds the audit-summary and scope pages, extracted with pypdf from the PDF at the pinned commit.
- New documents: `https://daimo.com/terms-of-use` (last updated 2025-04-01, linked from `AccountOtpPage.tsx` L61) and `https://registry.npmjs.org/@daimo/sdk/1.8.8`, which carries the `package` field.
- A `recheck` command on C5, O1, F2, P5, S2, S3, S5, and the new C1 EOA item. All line ranges were checked against the file length at the pin.
- No `claimed` items exist, so `by` was not needed.

### Cells scored 2-3 after migration

C5 2, O1 2, F2 2, P5 2, S5 2, S2 3, S3 3. Each has a `recheck`.
