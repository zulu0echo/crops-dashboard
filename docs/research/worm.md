# WORM (BETH proof-of-burn): research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/worm.yaml`. This log records evidence only.

## Deployed?

Yes. The contracts README (worm@b34b507d) lists Ethereum mainnet addresses. BETH 0x5624…9Cf8 has code, and Sourcify records its deployment at block 24436025 by 0x8DC7…C0Bb. Its `totalSupply()` was about 78.03 BETH at our read.

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com at block **26153606**:
  - BETH `initializer()` = 0x0, `rewardPool()` = Staking 0x03d4…60B7.
  - `proofOfBurnVerifier()` = 0x7c15…434f, `spendVerifier()` = 0x5745…02e6, `MINT_CAP()` = 10 ETH.
  - EIP-1967 implementation slots are zero on BETH, both verifiers, Staking and BETHToETH.
- Repos:
  - worm@eab0f53b (2026-02-11): the commit whose src/BETH.sol equals the Sourcify source of the deployed BETH. We walked the file's history; main (b34b507d) adds an undeployed configurable pool share.
  - worm@b34b507d: README with deployments and audit links.
  - worm-miner@fd23cd80; worm-privacy.github.io@5c309e25; proof-of-burn@92a7ecd1.

## Unit of assessment

- **Primary chain: Ethereum (1).** It is the only chain in the README, and the CLI's mainnet mapping.
- Unit: BETH, its two verifiers, the Staking contract that `mintCoin` pays the 0.5% pool fee into, and the BETHToETH hook used by the send flow.
- Excluded: the WORM mining token, distributors, ICO contracts and Sepolia.

## What we searched

- PSE analysis bundle: used only to find github.com/worm-privacy.
- `gh repo list worm-privacy`. GitHub licence API per repo: worm and proof-of-burn are MIT; the rest have none.
- Contracts:
  - BETH.sol, Staking.sol and the hooks at the deployed commit: no owner, pause or blacklist; the initializer self-clears.
  - The burn address commits to receiver, fees and hook.
  - SPDX headers: BETH, Staking and the hooks are UNLICENSED, against an MIT repo LICENSE; the verifiers are GPL-3.0.
- Sourcify v2: exact_match for BETH, both verifiers, Staking, BETHToETH, BETHToERC20 and WORM. Etherscan was not used (blocked for automation).
- Frontend (fetched file by file via the GitHub contents API; not built or run):
  - The send flow (src/app/wormhole) posts the burn key, receiver and account proof to the hardcoded DEFAULT_ENDPOINT https://prover-2.worm.cx, and relays through it.
  - The separate mint tool offers a "Local machine" endpoint.
  - Twelve hardcoded mainnet RPCs (two with embedded keys).
  - No analytics package and no country gate.
  - The ERC-20 path approves Permit2 for the maximum, then signs a bounded 30-minute PermitSingle.
  - worm.cx is served by GitHub Pages (`server: GitHub.com`, CNAME worm.cx in the repo).
- worm-miner:
  - The CLI does local burn, prove and mint; the server is a prover/broadcaster.
  - Parameters come from trusted-setup GitHub releases.
  - The mainnet RPC is hardcoded to eth.drpc.org (network.rs L49-L56).
  - No LICENSE file.
- Audits: the README links Hashlock and yAudit. The yAudit page (2025-11-15, tags zk/circom) embeds a PDF. Our PDF text extraction found no commit hash. The Hashlock page resolves but was not read in detail.

## What we did not find or do

- No terms page or country list.
- No bug bounty or SECURITY file.
- No audited commit tied to eab0f53b.
- No transactions, traces, builds or self-host attempts.
- We did not check whether prover-2.worm.cx runs a public build.

## Judgment calls

- **C1 = 3, S1 = 3, S2 = 3, C2 = 3**: immutable contracts with onchain evidence.
- **C3 = 3**: the prover and broadcaster are optional (CLI path), even though the official send flow defaults to the WORM prover.
- **C4 = 2, P1 = 2, S3 = 2**: code-only evidence, no package or trace.
- **O1 = 2**: exact Sourcify matches, but foundry.toml pins no compiler, and the explorer was not checked.
- **O2 = 2**: the live prover build cannot be tied to the source.
- **F1 = 0**: worm-miner, the only proof client, has no licence. The UNLICENSED SPDX headers conflict with the MIT LICENSE.
- **P2 = 1**: the send flow hands the burn key to the WORM prover with no in-flow alternative. The code shows it, and no policy discloses it.
- **P3 = 2**: amounts are plaintext.
- **P4 = 1, P5 = 0**: RPCs and the prover are hardcoded in both official clients.
- **S4 = 2**: derived from S1, C2, C3 and O3.
- **S6 = 1**: audit links only, with no commit tie.
- Settlement asset: the payee gets BETH, not ETH. The burned ETH is destroyed, and BETH's ETH value depends on AMM liquidity. This is noted in C2, C5 and S1, not scored separately.

## Availability 2026-10-09

- Model `global`, from code. `mintCoin` has no caller restriction, and the frontend source has no country or IP gate.
- No first-party terms list countries.
- The hosted prover's behaviour is unknown, and the CLI avoids it.

## Operational 2026-10-09

File: `data/operational/worm.yaml`. Bot facts were left as filled. The rail has no required closed component, so operator controls are recorded only for the WORM-run hosted prover (prover-2.worm.cx).

- **Source** at the deployed commit:
  - BETH.sol `POOL_SHARE_INV = 200`: a 0.5% pool fee on mint and spend, minted to Staking. Prover and broadcaster fees are bound in the burn commitment.
  - The frontend's `proof-post.ts` sends the burn key to the prover with only a Content-Type header.
- **Onchain** (rpc.mevblocker.io and eth.drpc.org serve historical calls; publicnode does not):
  - BETH was deployed on 2026-02-11 (block 24436025, from Sourcify).
  - `initRewardPool` ran on 2026-02-23 (block 24518725, found by bisecting `rewardPool()`), tx `0x3c0d39e1…f7dc`. Before it, no pool fee applied.
  - Mint sample, tx `0x2d9afb3d…c433` (2026-10-08): 393,690 gas, with 0.0006 BETH of pool fee on 0.12 BETH.
  - 32 mint transactions appeared in the last 200,000 blocks.
- **Entity search:**
  - The GitHub org API has no company field.
  - worm.cx/terms returns 404.
  - The frontend contains no terms text.
- **Advisories:** worm and worm-miner have no GitHub security advisories.

Judgment calls:
- **Custody `self_custody`.** It agrees with S1 = 3.
- **Entity and licences `absent`.** No entity is disclosed. Licences are recorded as absent rather than not_applicable because a team does run a hosted service.
- **Volume `not_observable`:**
  - The burn is a plain ETH transfer with no log.
  - Mints show up only as ERC-20 Transfer logs from the zero address. The spec cannot filter the indexed sender, so mints cannot be separated from other BETH transfers.
- **B12.1 `absent`** from code (C4 evidence); B12.2 `not_applicable`.

Validator: offline 0 errors; online 0 errors.
