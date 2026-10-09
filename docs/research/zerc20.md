# zERC20: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/zerc20.yaml`. This log records evidence only.

## Deployed?

Yes. The docs' Contract Addresses page lists mainnet deployments on Ethereum, Arbitrum, Base, BNB Chain, Polygon and Kaia. Onchain, the tokens have code and nonzero `index()` counters.

## Pins

- BNB Chain reads via https://bsc-rpc.publicnode.com at block **126599703**. Publicnode serves only a few hundred recent BSC blocks (older reads return 403 "Archive requests require a personal token"), so every read was batched at one block.
- Cross-chain activity comparison (latest block, 2026-10-09). `index()` = indexed transfers.
  - zBNB: BSC 17356; Ethereum 2.
  - zETH: Ethereum 451, Base 250, Arbitrum 111.
  - zUSDC: Ethereum 193, Base 419, Arbitrum 394.
- Repo snapshot: kbizikav/zERC20@b890773c (2026-04-20). Org profile: zerc20io/.github@3c46f938.
- SDK: `@zerc20/client-sdk@0.7.5` (MIT; integrity in the YAML). We fetched the tarball and read it; we did not install it. App bundle: https://app.zerc20.io/assets/index-qR7fWkny.js (fetched and grepped).

## Unit of assessment

- **Primary chain: BNB Chain (56).** zBNB has by far the most indexed transfers.
- Unit: the token proxy 0x4388…5c54 (implementation 0x857a…c748), the Verifier proxy 0xb059…774A (implementation 0x6b4a…E1c8), the shared Blocklist 0x847b…4Df9, the Hub 0x35eE…1c7A and the LiquidityManager 0x39Cc…FD9.
- Excluded: zETH and zUSDC (Base hubs), zJPYC (Polygon and Kaia local mode), and the testnets.

## What we searched

- PSE Private Transfers Analysis bundle: used only to find docs.redact.money, zerc20.gitbook.io and github.com/zerc20io/zERC20.
- Docs: zerc20.gitbook.io `llms-full.txt` (all pages), the architecture, FAQ, contract spec, addresses, CLI and indexer API pages.
- zerc20.io, its terms-and-conditions page, and app.zerc20.io (HTML and JS bundle).
- GitHub:
  - `gh api repos/zerc20io/zERC20` returns 404. The org has one public repo (`.github`).
  - `gh search repos zerc20` found kbizikav/zERC20, a full monorepo snapshot under BUSL-1.1 with Licensor "zERC20", committed by "Akira Taniguchi". The org does not link it.
  - Diffs against the Sourcify sources: zERC20.sol and Blocklist.sol are identical apart from a trailing newline. Verifier.sol is an older version, without the redeem fee, but has the same prover allowlist.
- Sourcify v2 on chains 56 and 8453 for every proxy and implementation.
  - The Verifier implementation has no Sourcify record on 56.
  - Its runtime code hash (`cast keccak $(cast code ...)`) is identical on 56 and 8453, and 8453 has an exact match.
  - BscScan returned 403, and we did not bypass it.
- Onchain:
  - Owners: the token, Blocklist and LiquidityManager (`hasRole(DEFAULT_ADMIN_ROLE)`) are owned by Safe 0x4301…B1fa; the Verifier and Hub by Safe 0xb6d8…DafCa.
  - Both Safes are v1.4.1, threshold 3, with the same four EOA owners. `getModulesPaginated` returns empty, and the guard slot is zero.
  - Verifier: `paused()` false, `latestProvedIndex()` = 17356 = token `index()`, `redeemFeeBps` 35.
  - LiquidityManager: `underlyingToken()` is native BNB (0xEeee…EEeE).
- SDK dist: no analytics; no hardcoded service URLs (only explorer links); exact-amount approvals in wrap and unwrap.
- App bundle:
  - Hardcoded `v1.mainnet.api.zerc20.io` indexer and relayer, Alchemy RPC URLs with one embedded key, thirdweb RPC, ICP hosts, WalletConnect/Reown.
  - Reown `features.analytics:false`.
  - No geolocation or country gate.
  - The archive redacts the key.

## What we did not find or do

- No public official source repository. No build script tied to the deployed bytecode.
- No audit or bounty named in the docs or on the website. The snapshot holds `audit/zksecurity-audit.pdf`, but no local PDF text tool was available, so its scope and commit are unread (S6 unknown).
- The prover allowlist was not enumerated: it is a mapping, and BSC logs need an archive RPC.
- No transactions, no traces, no self-host attempt.

## Judgment calls

- **C1 = 0**: the Blocklist can single out addresses at once, inside the token's `_update`.
- **C2 = 0, C3 = 0**: we score the private flow. A redeem needs a root posted by an allowlisted prover.
- **C4 = 1**: the filtering is in the settlement layer, but it is disclosed.
- **O1 = 1**: the Verifier implementation is unverified on BSC.
- **O2 = 1**: we do not count the personal-account snapshot as the provider's published stack.
- **O3 = 0**: the documented clone URL returns 404.
- **F1 = 0**: closed required services, and BUSL-1.1 on the core contracts.
- **P1, P5, S3, S5 = 1**: the substance is better, but the evidence is documented-tier reads of build artefacts (npm and bundle), not public source.
- **P3 = 2**: amounts are plaintext and arbitrary.
- **S6 unknown**: see above.
- The terms say the screening parameters run "without human intervention or discretion by the Operator". The owner-only `blockAddress` contradicts this; noted in C4.

## Availability 2026-10-09

- Model `blocklist`: KP, IR, SY, from the terms ("Restricted Countries ... e.g., North Korea, Iran, Syria"). Only the named countries are listed.
- The app bundle has no country gate.
- Protocol-level access is limited by the address Blocklist, not by country.

## Operational 2026-10-09

File: `data/operational/zerc20.yaml`. Bot facts were left as filled. The allowlisted root prover and the hosted indexer are required and closed, so operator controls apply. Custody is self-custody.

- **Read:**
  - Docs `llms-full.txt`, Fees and Rewards (redeem fee 35 bps default, cap 100), Indexer API, Architecture.
  - zerc20.io terms (last updated 2026-02-05). They name only an "Operator".
  - zerc20.io privacy policy (2026-02-18). It names Ryodan Systems AG, Gartenstrasse 6, Zug, as operator and controller.
- **Register.** Zefix lists Ryodan Systems AG, CHE-291.471.162, Zug, status existing, a software company. A Zefix search for "zERC20" returned no result.
- **Onchain:**
  - Verifier `redeemFeeBps()` is 35, and `feeRecipient()` is the Verifier owner Safe `0xb6d8…DafCa`.
  - The Verifier source (Sourcify, Base exact match) has a RedeemFeeAccrued event on both redeem paths, used for the volume spec.
  - First deployment: the app bundle's token config gives `deployed_block_number` 79259750. `eth_getBlockReceipts` on bsc-dataseed shows the proxy's first Upgraded, OwnershipTransferred and Initialized logs in tx `0xc1880e18…7909` (2026-02-04, initial implementation `0xda2f…acb8`).
  - Sourcify dates the Blocklist (2026-04-14) and the current implementation `0x857a…c748` (2026-04-15).
  - The upgrade transaction itself was not located (no archive BSC RPC).

Judgment calls:
- **Entity `evidenced`** as Ryodan Systems AG, from the privacy policy plus Zefix. The terms leave the "Operator" unnamed.
- **Licences `absent`.** FINMA and SRO lists were not searched.
- **Incidents `unknown`.** There is no public repository or advisory channel, and Verifier emergency logs could not be scanned.
- **Volume `unknown`.** The spec is RedeemFeeAccrued `grossAmount` over the zBNB Verifier, with the token fixed to zBNB. It misses redeems made while the fee was 0.
- **B1.4 `unknown`.** The audit PDF in the personal-account snapshot was not read; this matches S6.
- **B12.1 `evidenced`.** The only screening is an owner-maintained OFAC Blocklist, with no AI described. B12.2 is `not_applicable`.

Validator: offline 0 errors; online 0 errors (the Fees and Rewards quote is checked against the HTML page, because the validator's tag stripping breaks the `.md` variant).
