# Holyheld Card: research log

Checked: 2026-10-07. Ethereum reads pinned to block `26139997` (backendSignatureCheck read at `26140011`), via https://ethereum-rpc.publicnode.com.

## Type decision: card

A public repo needed for the top-up flow exists (`holyheld/hh-v1-sdk`, BUSL-1.1, pinned `c3b91ee`), and the top-up proxy on Ethereum is a Sourcify exact match. The logic implementation is unverified.

## Searches

- GitHub org `holyheld`: hh-v1-sdk (the SDK, npm `@holyheld/sdk` 4.1.5), plus erc1271, erc6492, gaelogrus, gointernals, BRRR, a web3-modal wrapper and a yearn-exporter fork. None holds contracts, backend or app code.
- The SDK builds against `@holyheld/web-app-shared` 4.3.21, which is not on npm (`npm view` 404). The published bundle (`npm pack @holyheld/sdk@4.1.5`, integrity `sha512-cGXK…`) embeds the top-up ABI (CardTopup*, setPaused, pauseOperation, emergencyTransfer, setCardSettleAddress, TRUSTED_PAUSER_ROLE, backendSignatureCheck) and third-party swap clients (Paraswap, Jupiter, Raydium). No Sentry DSN or analytics endpoint; the Sentry breadcrumbs go to the integrator's logger.
- Contract addresses come from the API at init (`/v4/external/client/references`, needs an API key; not called). I found the proxy by searching the `CardTopup(address,address,uint256,uint256,bytes32)` topic `0x9ceec115…` with the eth.blockscout.com logs API. The only emitter is `0x6fC79dDD…`, with events from block 16.8M up to 26074697 (28 Sep 2026); there were 73 events since block 25.5M.
- Same address on Base: a different, unverified, non-proxy contract with the same event; no events in the last 5,000 blocks read (mainnet.base.org caps getLogs at 500 blocks). Arbitrum, Optimism, Polygon, Gnosis, BSC, Avalanche, Linea and Plasma have no code there. base.blockscout.com and arbitrum.blockscout.com are behind a Cloudflare challenge and were not used.
- Onchain: proxy admin slot → ProxyAdmin `0xaf3d7e4c…` (Sourcify exact), owner EOA `0xa1391419…` (also the deployer). RoleGranted events: DEFAULT_ADMIN_ROLE → that EOA; TRUSTED_EXETUTOR_ROLE → EOA `0x4C18D1aF…`. No revocations, 7 Upgraded events. hasRole reads confirm both. backendSignatureCheck() = true; paused() = false. The implementation `0x1Fd0FB3F…` is not on Sourcify, Etherscan offers "Verify and Publish", and Blockscout reports is_verified false.
- Sample top-up tx `0x34972db6…` (CardTopupPermitSigned): USDC moved from the payer straight to EOA `0x6D2d1659…`, with an EIP-2612 permit for about 105% of the amount and an expiry, plus a receiver code `0x5bd0f55e…`.
- Website: Terms, privacy policy and AML policy at holyheld.com/legal (server-rendered; quotes verified). The README's docs link (holyheld.com/documentation) is 404. No audit was found (web search).

## Judgment calls

- O2 = 0, not 1: the SDK cannot be built from the repo (private core library) and only drives closed hosted services.
- O4 = 0: an ABI inside a minified npm bundle is not a documented interface.
- P3 = 0: the per-account receiver code in calldata and events is a payee tag. I found no user-facing disclosure, so I took the lower anchor.
- S1 = 0: the top-up is a disclosed sale to Holyheld, which alone fits 1, but a single admin EOA can redirect the settle address and call emergencyTransfer.
- S3 = 2: the observed default is a bounded permit with expiry, slightly above the amount. The approve fallback's amount is set in the private library.
- S5 = 0: the browser example ships a partner API key (VITE_ env). What the key authorises is undocumented, so I took the lower anchor.
- C5 = 0: the token list lives only in a hosted API response.
- S6 unknown: no audit found.

## Availability 2026-10-09

- Source: holyheld.com/legal/terms-and-conditions (last updated 01.07.2026, server-rendered, quotes match the live page). Its scope clause covers users "residents of, or located in the Switzerland"; s9.2 excludes jurisdictions where use would be unlawful without naming any.
- Also read: /legal (lists only Terms, Privacy and AML Policy), /legal/aml-policy (EDD for FATF high-risk countries and sanctions screening, no country list), /faq and /individual (marketing "global payments", invitation-only membership, no country list).
- Judgment call: recorded as allowlist [CH]. The site markets global payments, but the only published customer terms are scoped to Switzerland and no other country is listed, so the more restrictive reading is used and the tension is stated in `note`.
