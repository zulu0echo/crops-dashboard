# Privacy Pools (0xbow): research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/privacy-pools.yaml`. This log records evidence only. It contains no usage instructions.

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com at block 26153374 (roles, proxy slots, Safe, pool state); USDC/USDT blacklist reads at 26153426.
- Event history (RoleGranted, RoleRevoked, Upgraded, PoolRegistered, RootUpdated) via https://rpc.mevblocker.io, the only public RPC we found that served full-range `eth_getLogs` (publicnode needs a token for archive reads; drpc, cloudflare and blastapi cap the range).
- Repos: 0xbow-io/privacy-pools-core@d494b63e79f33bb2b0c8ece6cdacdca465c3b884 (main, 2026-09-23), 0xbow-io/privacy-pools-website@7df411128f7a18a61a77f7a0371bf0b857969e2a (main).
- npm: @0xbow/privacy-pools-core-sdk 1.5.0 is the latest (Apache-2.0); the website pins 1.4.0. Not used as `package` evidence (see judgment calls).

## Unit of assessment

- **Primary chain: Ethereum (1).** docs/docs/deployments.md lists only Ethereum mainnet; the website's chainData.ts lists mainnet first with 14 pools. Onchain the ETH pool has nonce 6071, USDC 881, USDT 503; other pools have 1-76.
- In scope: Entrypoint proxy 0x6818…6b46 (implementation 0x15e3…1a2c), ETH pool 0xF241…C9fB, USDC pool 0xb419…ce86, USDT pool 0xe859…4572, verifiers 0x0228…7D6d and 0xa45A…eC6.
- Excluded: the other 11 mainnet pools (same code and Entrypoint), the OP/BSC/Arbitrum Entrypoint 0x4419…d15E (with a Brevis ASP on BSC), the Starknet deployment, Sepolia/OP-Sepolia.

## What we searched

- `gh repo list 0xbow-io`: 8 repos. GitHub's licence detector shows none, but privacy-pools-core has an Apache-2.0 LICENSE at root and in packages/contracts. The website's LICENSE.md is CC BY-NC 4.0 while its package.json says MIT. No ASP service repo exists.
- Contracts: read Entrypoint.sol, PrivacyPool.sol, State.sol at d494b63e. Sourcify v2 returns `match` (partial) for all seven contracts in scope. We diffed Sourcify sources against the repo: Entrypoint, PrivacyPool, State, PrivacyPoolSimple/Complex are identical apart from a trailing newline, both at d494b63e and at the audited commits (238e3594 for the Entrypoint upgrade, 532eaa8e for the pools). foundry.toml sets `bytecode_hash = "none"` and `cbor_metadata = false`, which explains the partial match. The Etherscan page loaded but its verification text was ambiguous, so we did not rely on it.
- Roles: RoleGranted logs show OWNER_ROLE and ASP_POSTMAN granted at block 22153713 to EOA 0x1f4F…E187 and Safe 0xAd7f…7159; the EOA's OWNER_ROLE was revoked at 22169228. At block 26153374: Safe has OWNER_ROLE and ASP_POSTMAN; the EOA has ASP_POSTMAN only. The EOA sent the latest updateRoot (tx 0x6298b96d…ec83).
- Safe 0xAd7f…7159: VERSION 1.4.1, threshold 2, 4 owners (one is an EIP-7702-delegated account, 23 bytes of code), getModulesPaginated empty, guard slot 0. No timelock. We found no signer disclosure.
- Upgrades: Upgraded events at 22153713 (0xdd8a…d4c1, the implementation the docs still list) and 22540812 (0x15e3…1a2c).
- Pools: all 14 have ENTRYPOINT = 0x6818…6b46, dead = false, implementation slot zero, and share the same two verifiers. No PoolRemoved events; PoolWindDown query failed on mevblocker ("service temporarily unavailable"), but dead() is false on every pool.
- ASP data: the latest RootUpdated carries CID bafybeibshlh73ftdmigkfag7iaohkiwjbxuqwvn54op2gr2zkrerp4fb3a; gateway.pinata.cloud and ipfs.filebase.io served it as JSON arrays of tree nodes. So proof data does not require the 0xbow API; the approval itself does.
- Website: grepped for analytics (GoogleAnalytics with hardcoded fallback ID, Sentry with sanitised config, @vercel/analytics in package.json), geo or sanctions checks (none found in client code), endpoints (Alchemy, Envio HyperSync via server proxy, ASP API via env, relayers fastrelay.xyz and api.clkd.xyz, Alchemy prices API, MailerLite and Turnstile for the newsletter), approvals (exact amount), custom RPC modal.
- Terms (docs/docs/toc.md) and privacy policy (docs/docs/privacy-policy.md) read at the pinned commit; terms name restricted jurisdictions and describe the ASP due diligence.
- Audits: audit/ folder holds Oxorio contracts, circuits and Entrypoint-upgrade reports and an Auditware report. SECURITY.md has an email and a conditional bounty, no programme scope.
- Legal context: we found no court, regulator or government source about Privacy Pools or 0xbow, so `context` is omitted.

## What we did not find or do

- No transactions, UI runs, traces or self-host attempts (O3 capped at 1).
- No published ASP code, screening criteria or named screening vendor.
- No signer disclosure for the owner Safe.
- We did not inspect the build served at privacypools.com for an IP geoblock.

## Judgment calls

- **C1 = 0**: the ASP postman, an EOA, controls which deposits can be withdrawn privately.
- **C2 = 1**: deposit and ragequit are direct; the private payout is a direct call that needs prior ASP approval, which we treat like a provider signature.
- **C3 = 0**: the ASP is a required, closed, single-vendor service. Relayers are optional and public.
- **C4 = 1**: filtering is in the settlement contracts by design and disclosed in versioned terms, so 1 rather than 0.
- **O2 = 2**: the ASP API has no schema document, but its endpoints and types are committed in the frontend client.
- **F1 = 0**: closed required ASP. The website's CC BY-NC licence is non-OSI but the website is not required.
- **F2 = 0**: MIT to Apache-2.0 relicense in Feb 2025; harmless in effect, but the anchor names any prior relicense.
- **P3 = 3**: scored on what the chain reveals; arbitrary amounts make amount matching possible and are noted in the finding.
- **S1 = 1**: immutable pools, but release to anyone except the depositor depends on an untimelocked EOA role, and relayed withdrawals pass through the upgradeable Entrypoint.
- **S3 = 2**: exact-amount approvals in code; no package or trace for the frontend.
- **S4 = 2**: ragequit from the immutable pool needs no 0xbow service; private settlement stops.
- **Availability**: blocklist CU, KP, IR, SY from the versioned terms; the Crimea, Donetsk and Luhansk regions are in the note.

## Operational 2026-10-09

Facts are in `data/operational/privacy-pools.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.** Entrypoint `assetConfig` was read at block 26153723:

  | Pool | Vetting fee | Max relay fee | Minimum deposit |
  | --- | --- | --- | --- |
  | ETH | 50 bps | 1000 bps | 0.01 ETH |
  | USDC | 50 bps | 1000 bps | 25 USDC |
  | USDT | 0 bps | 1000 bps | 25 USDT |

  The terms (toc.md section 5) state a 0.5% vetting fee that 0xbow may change at its discretion; the 0 on USDT contradicts it. The relayer `fee_bps` is set in each relayer's config.
- **Changes.** From the PoolConfigurationUpdated and Upgraded logs (via mevblocker):
  - the Entrypoint upgrade of 2025-05-22;
  - the fee and minimum changes of 2025-05-24, 2025-07-14 and 2025-11-23 (ten pools; ETH vetting fee set to 500 bps);
  - the ETH vetting fee set back to 50 bps on 2025-11-27;
  - the USDC vetting fee set to 50 bps on 2025-12-15.

  None of these went through a timelock, and we found no notice of them.
- **Deployment.** Sourcify creation data puts the ETH pool at block 22153714 (2025-03-29) and the Entrypoint one block earlier.
- **Entity.** The terms name "0xbow Limited" with Delaware governing law, but no place of incorporation or company number. `maturity.entity` is therefore `unknown`, and B11.1 records the named counterparty.
- **Licences.** `absent`: none is cited in the terms, the privacy policy or 0xbow.io. We searched no register, because the jurisdiction is unknown.
- **Incidents.** None found. There are no GitHub advisories and no PoolRemoved events, and `dead()` is false.
- **Volume spec.** Withdrawn on the ETH pool (topic0 0x75e1…6a21), with the amount in word 0 and the token fixed to native ETH. Judgment call: a single fixed-token spec cannot sum the other pools.
- **Group B facts recorded** (the ASP is a required closed component, so operator controls apply):
  - B1.4 refs S6.
  - B2.2 is absent: SECURITY.md commits to no timelines.
  - B3.1 is absent: we found no incident-notice commitment.
  - B6.3: retention "for legitimate business purposes".
  - B6.4: the privacy policy calls 0xbow a processor in general and the controller for EU residents, which is inconsistent.
  - B10.1: docs layers.
  - B11.1: 0xbow Limited.
  - B11.2: the vetting fee is withdrawable by OWNER_ROLE.
  - B11.3: the terms allow termination at will, and ragequit remains available.
  - B12.1 is unknown: the ASP is closed. 0xbow.io describes "Real-Time Transaction Monitoring" without saying how it works.
- **Judgment call on custody.** `custody_model` is self_custody even though S1 = 1, because no role can move pool funds. The ASP gates release; it does not hold the funds.
