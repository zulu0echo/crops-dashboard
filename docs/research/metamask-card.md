# MetaMask Card: research log

Checked: 2026-10-07. Repo pin: `MetaMask/metamask-mobile@b513a4b65ab0a9f84ff0913108a19deb43003e98` (main HEAD via `gh api repos/MetaMask/metamask-mobile/commits/main --jq .sha`). Onchain pin: Linea block `32253699` (`cast block-number --rpc-url https://rpc.linea.build`).

## Type and scope

- Type `card`, not incumbent. The settlement contract (FoxConnect) is verified on Sourcify and Lineascan, and the card client is public in metamask-mobile, though under an inspect-only license. Both are needed to run the product.
- Operators named by MetaMask's own FAQ and support pages: Crypto Life (Baanx) is program manager and runs KYC, Monavate is issuer, and Mastercard is the network. The UK program is moving to Immersve on Base (support "UK card migration guide"). US cards run under Baanx US terms with Cross River Bank. Neither was assessed.
- Primary chain is Linea. In `app/selectors/featureFlagController/card/defaults.ts` (L37-L102), Linea has the only balance scanner and the most tokens. Crypto Life's MetaMask product page says spending is "on Linea". Base, Monad and Solana configs also exist and were excluded.

## Searches

- `gh api search/code q=foxConnect repo:MetaMask/metamask-mobile` found the card defaults (FoxConnect Global `0x9dd23A4a…`, US `0xA90b298d…`), `BaanxProvider.ts`, `baanx-config.ts` and `builds.yml` (`BAANX_API_URL: https://api.baanx.com`).
- Searched GitHub for "contract FoxConnect" and "baanx". No official Baanx org exists, and the only FoxConnect source is in third-party scrape repos. The source used here is from Sourcify v2 (`fields=sources,abi`), with SPDX `UNLICENSED`.
- Sourcify returned `match` (partial) for both FoxConnects and `null` for the balance scanner `0xED9f04F2…`. Lineascan shows "Source Code Verified Exact Match" for FoxConnect Global, with a Kleros nametag "MetaMask: FoxConnect (Global)".
- Legal documents: the metamask.io/card footer links only to the generic Consensys privacy notice and terms of use. Crypto Life's legal page (withcl.com/legal) links the CL Platform Terms (Monavate 2025) and the Monavate cardholder terms. Both are PDFs, extracted with pypdf and archived in `data/archive/metamask-card-*.txt`. The Baanx global privacy policy (`secure.baanx.co.uk`) timed out on TLS connect and is not cited.
- MetaMask support (support.metamask.io/trade/metamask-card/*) is server-rendered. I used the FAQ and security-privacy pages as provider claims only.
- I found no audit report for FoxConnect on withcl.com, metamask.io or GitHub (withcl.com links kudelskisecurity.com without a report). S6 is unknown.

## Onchain reads (block 32253699)

| Read | Result |
| --- | --- |
| FoxConnect Global `owner()` | Safe `0x1b7A8fF5…9c99`, v1.4.1, threshold 2 of 4, no modules, guard slot 0 |
| `getBeneficiary()` | Safe `0x8dFE562C…1D3e`, 2 of 13, no modules or guard |
| `getTreasuries()` | Safe `0x57637167…5cb6`, 2 of 10 |
| `getSignerAddress()` | EOA `0x11084c82…56CB` (shared with US) |
| `getWithdrawOperators()` | 33 addresses; sampled ones are EOAs with high nonces |
| `getMultiSendOperators()` | EOA `0x9089a6fc…EA9B` |
| EIP-1967 impl/admin slots | zero (not a proxy) |
| FoxConnect US `owner()` | EOA `0x0AB5e068…814A` (nonce 41); one withdraw operator |
| Sample pull tx `0xdd18b6ea…b7c7` (block 32250700) | operator `0x2AcFE192…` → `withdraw()` → mUSD from `0x0edC0eA6…` to beneficiary |
| Sample holder mUSD allowance to FoxConnect | 2199023255543896596 (BAANX_MAX_LIMIT 2199023255551 × 1e6 less spends) |
| USDC (Linea) | blacklister `0x349570f5…`, pauser `0xa537b946…` |
| mUSD proxy impl | `0x58a3a9c5…` (Sourcify exact, BUSL-1.1): freeze, forceTransfer, pause roles |

## Judgment calls

- C1 = 0. The withdraw operators are EOAs and settlement needs them, which matches the Gnosis Pay reading, where an EOA-held settlement role met anchor 0. Monavate's immediate-suspension clause also meets 0.
- S1 = 0, not 1. Unlike Gnosis Pay's receiver-locked, daily-bounded Roles allowance, `withdraw()` lets any operator pull up to the full allowance from any approving wallet without a user signature. The owner can also change the beneficiary. That is "can redirect funds".
- S2 = 3. FoxConnect is immutable. Owner-settable parameters are scored in C1 and S1.
- S3 = 1. The default is "Full access" (about 2.2T tokens) and a restricted amount is opt-in. I counted the UI label as disclosure.
- S4 = 2, following the Gnosis Pay reading: funds stay in the holder's EOA and settlement stops. The live unbounded allowance is noted as a risk.
- P1 = 1. Analytics are consent-gated, but `captureExceptionForced` reports before consent and the hosted Baanx flows were not inspected. I took the lower anchor.
- O2 = 1. The client and the verified contract are public, but there is no backend and no API schema.
- O4 = 1. ABIs exist only in verification metadata, and I found no export.
- S5 = 1. A key named as a secret ships in the app but acts as a PKCE public client id. What it authorises server-side is not visible.
- F1 = 0 and F2 = 0. The LICENSE is inspect-only and reserves licensing options, and the CLA permits relicensing.
