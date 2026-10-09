# Zcash: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/zcash.yaml`. This log records evidence only. It contains no usage instructions.

## Deployed?

Yes. Zcash mainnet is a live proof-of-work chain. Zebra v6.4.2 (2026-09-25) follows it, and the activation heights for NU6.2 (3,364,600) and NU6.3 Ironwood (3,428,143) are compiled into `zebra-chain/src/parameters/constants.rs`.

## Pins

- ZcashFoundation/zebra@e3eef2f3 (tag v6.4.2)
- zcash/zips@3af03aa3
- zcash/lightwalletd@d16d4812
- zcash/orchard@616a669d, zcash/librustzcash@9181ef85
- zcash/zallet@522b486d (beta line)
- zodl-inc/zodl-android@4248d469, zodl-inc/zodl-ios@6a7dc6b3, zodl-inc/zodl-android-wallet-sdk@afe08faf, zodl-inc/zodl-project@675b50ff
- zcash/zcash@558f6865 (archived 2026)

## Unit of assessment

- **Primary chain: Zcash mainnet, `zcash:main`.** ChainAgnostic/namespaces has no Zcash namespace, so we used the identifier the brief gives and say so in `basis`. We excluded `bip122:<genesis>` because it is not registered for Zcash either.
- **Scope.** The unit is shielded transfers: Ironwood since NU6.3, with Orchard spend-only per ZIP 258 L85-L100. The transparent pool is covered in P3.
- **Components.** The required path is the consensus network, a full node (Zebra; zcashd is archived) and the protocol libraries every wallet uses. Wallets (Zodl, Zallet), light-wallet servers and Zaino are optional, because a user can choose among them.

## What we searched

- **Repos.** `gh api` metadata, licence files and CONTRIBUTING files for zebra, librustzcash, orchard, sapling-crypto, halo2, lightwalletd, zaino, zallet, zips, zcash/zcash and the zodl-inc repos. We found the "Zashi" wallet by searching for "zodl" after `gh search repos zashi` returned only unrelated repos.
- **2026 governance events, from primary sources.**
  - ZIP 257: the Orchard emergency soft fork (Mainnet heights 3363426 to 3364600; zcashd v6.12.5 and zebra v4.5.3; a failed first attempt 60 blocks earlier).
  - ZIP 258: NU6.3 Ironwood.
  - Zebra CHANGELOG entries for 4.5.3, 5.0.0 and 6.0.0.
- **End-of-support halt.** `end_of_support.rs` makes each Zebra release panic on Mainnet 84 days after its estimated release height.
- **Zodl Android code.**
  - Crash reporting by flavour: foss has a local reporter only; the store build adds Firebase Crashlytics. The store preference is nullable and is enabled only from the opt-in screen.
  - Default lightwalletd endpoints (zec.rocks regional hosts and zec.stardust.rest), automatic selection, a custom server, and multi-endpoint submission.
  - CoinMarketCap exchange rates are fetched over Tor only, with an API key sent from the client.
  - NEAR swap and Flexa integrations.
- **Licensing.**
  - The Zodl Android SDK moved from MIT to AGPL-3.0-only in commit 9ff67a5e (2026-08-24). Its CONTRIBUTING L290-L302 requires a CLA that assigns or broadly licenses contributions to Znewco.
  - orchard moved from the Bootstrap Open Source License to MIT or Apache-2.0 in ac4b5218 (2023-12-19).
- **Code search on 2026-10-09** for country, geoip, geolocation, geoblock and restricted. We searched zebra, zallet, lightwalletd, zodl-android and zodl-ios. The only country hits were the zodl-ios language-based layout tweak and a support-info field in zodl-android.
- **Audits and bounty.** Zebra SECURITY.md L107 says there is no bug bounty. The repo trees of zcash/zcash, orchard, librustzcash and zodl-project contain no audit reports.

## What we did not find or do

- `zodl.com` returned HTTP 403 to every automated request, so we did not read Zodl's terms or privacy policy. We did not bypass the block.
- No audit report pinned to a commit, so S6 is unknown.
- No reproducible-build check of Zebra or Zallet binaries, so O1 is unknown and treated as not applicable as worded.
- We did not inspect the iOS app in the same depth as Android.
- **No `context`.** EUR-Lex returned an HTTP 202 challenge with an empty body for the AML Regulation (EU) 2024/1624. We did not bypass it, and no other primary legal source was cited.
- No transactions, node runs, builds, traces or self-host attempts.

## Judgment calls

- **C1, C2, S1, S2 capped at 2.** Zcash has no contract addresses, and score 3 on these cells needs onchain evidence about a deployed contract. This is a schema gap. C1 also records the no-notice Orchard halt of June 2026.
- **C3 = 3.** Several default servers come from independent operators, with automatic fallback and a custom option. The server code is public, and full-node users need no server at all.
- **C4, P1, S3, S5 = 2.** Each is absent or near-absent in code, but there is no package or trace record. Zcash clients are not npm packages, so `package` does not apply.
- **C5 = 2.** There is a single native asset and no sequencer. The pool-level risks are not stated to payees.
- **O2 = 3.** The whole stack is public. The third-party server operators are treated as replaceable.
- **O4 = 2.** The gRPC schema and RPC are in the repos. We found no payee export.
- **F2 = 0.** This is the literal anchor ("a prior relicense event"). It applies to the 2026 Zodl SDK relicense under a CLA and the permissive orchard relicense of 2023. The required node and libraries have no CLA. A reviewer may prefer 2 if relicensing towards more permissive terms, or relicensing of optional components, should not count.
- **P2 = 3.** The default send flow needs no account. Optional swap and merchant flows are out of scope.
- **P3 = 3.** This is what the protocol reveals for a shielded transfer. Transparent use and pool crossings are covered in the finding.
- **P4 = 2.** The light-wallet server sees the IP (unless Tor is used) and the transactions submitted and fetched.
- **S4 = 2.** Derived from S1, C2, C3 and O3=1.

## Schema gaps hit

- The chain has no contract addresses. Zcash shielded addresses do not fit the address patterns, and transparent addresses would be meaningless as evidence. That is why `contracts: []` and the caps above.
- `zcash:main` is not a registered CAIP-2 namespace.

## Recheck

All rechecks use `gh api` at the pinned commits, or `gh search code` on default branches. `gh search code` is rate-limited to 10 requests per minute.

## Operational 2026-10-09

Facts are in `data/operational/zcash.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.** Under ZIP 317 (zips@3af03aa3 L126-L196), the fee is 5000 zatoshis per logical action with a minimum of 2 actions. From NU6.3, Revision 1 counts Ironwood actions. There is no provider or relayer fee.
- **Deployment.** Genesis is 2016-10-28. Block dates were decoded from raw headers served by api.blockchair.com:

  | Event | Height | Date |
  | --- | --- | --- |
  | Sapling | 419200 | 2018-10-29 |
  | NU5 | 1687104 | 2022-05-31 |
  | NU6 | 2726400 | 2024-11-23 |
  | NU6.1 | 3146400 | 2025-11-24 |
  | Failed first attempt at the soft fork | 3363366 | 2026-06-02 |
  | Soft fork disabling Orchard | 3363426 | 2026-06-02 |
  | NU6.2 | 3364600 | 2026-06-03 |
  | NU6.3 | 3428143 | 2026-07-28 |

  Heights come from Zebra's constants.rs L75-L99. Judgment call: genesis is recorded as the first deployment, and the Ironwood activation is listed under changes.
- **Incidents.**
  - CVE-2019-7167, the Sprout counterfeiting flaw, cited through NVD. ECC's 2019 blog post returned HTTP 403 and we did not bypass it.
  - The 2026 Orchard circuit soundness flaw: ZIP 257, zcash/zcash GHSA-ghc3-g8w4-whf9 and Zebra GHSA-ww9q-8r59-xv46. The advisory says it cannot be ruled out that the flaw was exploited, so funds_lost is unknown.
  - The other 2026 node advisories (DoS, block poisoning) are noted, not listed.
- **Entity.** Zcash Foundation, a 501(c)(3) (zfnd.org quote), US. Judgment call: maintenance is split with ZODL (Znewco, Inc.). Zebra's SECURITY.md L115-L125 names ZODL as maintainer of zcash/zcash, librustzcash and zallet. No IRS register URL was recorded because no EIN was found.
- **Licences and cashout.** Both `not_applicable`.
- **Volume.** `not_observable`: shielded amounts and parties are hidden, and only pool-level turnstile flows are visible.
- **Group B facts recorded.**
  - B10.1: Zebra book overview.
  - B11.2: consensus funding streams from NU6.1 to height 4,406,400, with 12% to the lockbox and 8% to Major Grants (FPF), per Zebra mainnet.rs L228-L242.
  - B12.1 is absent.
- **B2.2 not set.** Zebra's SECURITY.md promises an "appropriate timeline" but states no patch timelines, and the rail is operator-free.
- **B1.4 not set.** The seed research found no audit report pinned to a commit (S6 unknown).
