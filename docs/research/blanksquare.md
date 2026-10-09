# Blanksquare (Shielder): research log

Assessed 2026-10-09 by the AI research agent (seed). Scores are in `data/providers/blanksquare.yaml`. Evidence only; no usage instructions.

## Deployed decision

Deployed, but dormant. The Base Shielder proxy `0x064A67a5484DF6baf36be42F9554d45E7741dCFf` has code, is unpaused (`paused()` = false) and held about 0.078 ETH and 48.2 USDC at block 52371351. On 2026-10-09, though:
- blanksquare.io and app.blanksquare.io returned Vercel `DEPLOYMENT_NOT_FOUND`.
- The Base relayer host `base-shielder-relayer-v3.blanksquare.dev` did not resolve in DNS.
- The Merkle tree's `nextFreeLeafId` has been unchanged since a block between 44,000,000 and 46,000,000 (448 leaves in total).
- Development in blanksquare-monorepo stopped on 2025-11-13.

The contracts remain callable and the SDK has a direct-withdraw path, so the rail counts as usable on mainnet.

## Pins

- Base reads at block 52371351 via https://mainnet.base.org, which serves historical state:
  - Proxy: `owner()`, `pendingOwner()`, `paused()`, fee bps (both 0), `merkleTree()`, EIP-1967 slots (implementation `0xfFF4…8b53`, admin slot zero).
  - Owner Safe `0x9Dc4…2165`: `getThreshold()` = 2, five owners, `getModulesPaginated` empty, guard slot zero, version 1.4.1.
- Repos:
  - Cardinal-Cryptography/blanksquare-monorepo@5dad5a07 (HEAD of main). contracts/Shielder.sol is byte-identical to the Sourcify source of the implementation, apart from line endings.
  - shielding-dapp@f167cd97, shielder-quickstart@af2bb5f4.
  - zkOS-monorepo@22e2f52f is the audited commit (repo archived).

## Unit of assessment

- **Primary chain: Base (8453).** The Deployments doc lists Base as the only mainnet row with a mainnet relayer, and the Web App doc names Base as its only network.
- Excluded:
  - HyperEVM `0xA267…119b`, listed with a testnet relayer URL.
  - Base Sepolia and Arbitrum Sepolia.
  - The v2-era Shielder deployments on Aleph Zero EVM and Arbitrum (`0x5A0d…32c6`) that shielding-dapp still configures.

## What we searched

- private-transfers.pse.dev (bundle), only to find docs.blanksquare.io and the GitHub org.
- docs.blanksquare.io: llms.txt, deployments, webapp, relayers, anonymity revokers, shielder guard (a work-in-progress stub linking to X), version pages, fees.
  - Terms and Conditions of the Shielder Service (PDF, 4 Nov 2025) and Privacy Policy (PDF, 25 Jul 2025). Both are PDFs, so the excerpts we cite are committed in `data/archive/blanksquare-*.txt`.
- Sourcify v2 for the proxy (no record), the implementation and the four linked libraries (all `match`, i.e. partial). Library addresses were taken from the Sourcify compilation settings.
- Basescan pages:
  - The implementation and libraries are "Source Code Verified".
  - The proxy is an ERC1967Proxy "Similar Match".
- Monorepo source, downloaded as a codeload tarball and read but not built:
  - Contract roles.
  - SDK `withdrawManual`, factories config, RPC-based event sync, and dependencies.
  - Relayer crate: a grep for sanctions, blocklist and country terms finds nothing.
  - NOTICE and README licence section, and LICENSE history.
- shielding-dapp:
  - PostHog provider.
  - Chain configs: Base covers testnet only, and relayer URLs are hardcoded.
  - Exact-amount approve in useShield.
  - envVarsSchema.
- zkSecurity report page: audit of zkOS-monorepo@22e2f52 plus a private circuits repo, March 2025. Shielder.sol changed after that commit (2025-04-07, 2025-04-17, 2025-07-17).

## What we did not find or do

- No public source for the Base mainnet web app or the mobile app.
- No signer disclosure for the owner Safe, no timelock, no bug bounty or SECURITY file.
- No committed ABI JSON or relayer API schema.
- No transactions, app runs, traces or self-host attempt (O3 capped at 1).

## Judgment calls

- **Payment model.** This contract version has no shielded account-to-account transfer. A payment is a deposit by the payer followed by a withdrawal to the payee's address, and C2 and P3 are assessed on that flow.
- **C1 = 1, S2 = 1.** The owner is a 2-of-5 Safe with no modules or guard, but there is no timelock and no signer disclosure. A pause also blocks withdrawals.
- **C2 = 3, C3 = 3.** Withdraw has no caller check, the SDK ships `withdrawManual`, and the address is published. The relayer is optional, and its code is public.
- **C4 = 1.** The contract is neutral. Edge filtering (an Annex 3 country list, sanctions and PEPs, a reserved right to geo-block) is stated in the terms only. The apps that would enforce it are closed and offline.
- **C5 = 0.** The contract accepts any ERC20, and no Base mainnet token list is published.
- **O1 = 2.** All contracts are partial matches or explorer-verified, and the proxy is a standard similar match.
- **O2 = 2.** Everything is public except the live apps.
- **O4 = 1.** The ABI is generated at build time and not committed.
- **F1 = 3.** All listed repos and every required component carry OSI licences. The closed apps are not required.
- **F3 = 2.** As with Tornado Cash, there was no O3 reproduction.
- **P1 = 1.** PostHog is on by default in the apps and disclosed in the privacy policy. The SDK is clean.
- **P2 = 1.** The anonymity-revoker ciphertext and MACs go beyond what settlement needs, and the app collects IP and location.
- **P3 = 2.** Amounts are arbitrary and public. The anonymity-revoker key holder, whose key is set by the owner, can link all of an account's actions.
- **P5 = 2.** The SDK takes endpoint config, but the public UI hardcodes the relayer.
- **S1 = 1.** The escrow is upgradeable, without a timelock.
- **S3 = 2.** The public dapp approves exact amounts, but there is no package or trace.
- **S4 = 2.** Funds stay retrievable through `withdrawManual` while the provider's services are down, as they are now. They are not safe from provider action.
- **S6 = 1.** The audit predates the deployed contract changes.

## Schema notes

None. Base fits the schema.

## Availability 2026-10-09

- Model: `blocklist`. The 41 countries come from Annex 3 of the Shielder Service terms:
  - the EU high-risk third-country list;
  - the FATF black and grey lists;
  - Russia and Belarus.
- "Russian-occupied territories of Ukraine" goes in the note, and Ukraine is not listed.
- Section 6.2 says "Annex no. 1", while section 22.15 and the document itself put the list in Annex 3. This is recorded in the note.
- Protocol-level access is global: the contract has no gate.

## Operational 2026-10-09

File: `data/operational/blanksquare.yaml`. Bot facts (B2.1, B2.3, B8.2, B9.x) were left as filled. Operator controls are recorded for the services Common Labs ran (relayer, TEE prover, apps). All of them were offline or dormant.

- **Onchain** (mainnet.base.org state reads, dRPC for single-block logs and receipts; Base Blockscout is behind a Cloudflare challenge and was not used):
  - The proxy was created on 2025-07-23 in block 33246476, tx `0xf63c3126…8045`. That is the same block as the implementation, whose deploy data comes from Sourcify. The proxy was unpaused in tx `0x87a2b37d…53d7`.
  - The owner moved from the deployer EOA to the Safe on 2025-07-28 (block 33462649, found by bisecting `owner()`), tx `0x51ee17e5…63a9`.
  - The implementation slot and fee bps (0/0) are unchanged at four sampled blocks.
  - The Merkle tree last changed on 2026-04-02 (block 44167109), in a NewAccount tx that used 1,764,659 gas.
- **Source:** ProtocolFee.sol (cap 500 bps), the Shielder Withdraw event (L86-L100, emit L567), and the relayer README (15% default commission, no auth option).
- **Docs:** Understanding Fees (`.md`) and the llms.txt index. GitHub security advisories: none.
- **Not read:** the full privacy-policy and terms PDFs. Opening the GitBook PDF link in the browser pane triggered a file download prompt, so it was not retried. B6.3, B6.4 and B11.3 rest on the existing archived excerpts only.

Judgment calls:
- **Custody `self_custody`.** It agrees with S1 = 1.
- **Entity `evidenced`** from the terms (Common Labs Inc., Panama), with no register entry, as for Hinkal.
- **Licences `absent`.** The Panama registers were not searched.
- **Changes** come from state sampling because public Base RPCs refuse long log ranges. The 2026-04-02 entry records the last activity, not an announced change.
- **Volume `unknown`:**
  - Spec over Withdraw, with token in word 1 and amount in word 2.
  - A 30-day window is expected to be empty.
- **B12.1 `absent`** from the contract and relayer code (C4 evidence); B12.2 `not_applicable`.

Validator: offline 0 errors; online 0 errors.
