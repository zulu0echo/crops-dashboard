# Tongo: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/tongo.yaml`. This log records evidence only.

## Deployed?

Yes, on Starknet mainnet.
- docs.tongo.cash/protocol/contracts.html lists the v2 Vaults and ledgers, and the legacy v1 instances.
- tongo.cash says "live on starknet mainnet".
- Onchain, the v2 ledgers' class hash is 0x072c…471e and the Vaults' is 0x044d…121f, both matching the docs.

## Pins

- Starknet reads via https://starknet-rpc.publicnode.com at block **16117583**, using `starknet_call` and `starknet_getClassHashAt`. Selectors are starknet_keccak values computed with `cast keccak` masked to 250 bits.
- `get_tongo_config` on the USDC, STRK and ETH v2 ledgers returned:
  - tag "Tongo";
  - owner 0x3bb48fd6ba551be8d8d123b85130964a8a368efe949498ea305cadf807ca4e7 (class 0x79a9…2314; type not identified);
  - the matching Vault;
  - bit_size 32;
  - auditor_key Option::None (serialised `0x1`).
- `get_vault_config` returned the Tongo class hash, the ERC-20 and the rate.
- Vault balances: v2 USDC 7.78 USDC, the other v2 Vaults 0. Legacy v1 instances: STRK about 295.6 STRK, plus small USDC, USDC.e, USDT, ETH and WBTC balances.
- Repos: fatlabsxyz/tongo@7dac05e8 (master; contracts identical to tag v2.0.0 47ea644b) and fatlabsxyz/she.
- npm: @fatsolutions/tongo-sdk 2.0.0 (Apache-2.0). It was not downloaded or inspected; master's package.json says 1.3.2.

## Unit of assessment

- **Primary chain: Starknet mainnet (`starknet:SN_MAIN`).**
- Unit: the v2 canonical ledgers and Vaults.
- Starknet addresses are 32-byte felts, which do not fit the schema's address pattern. Following the brief, `contracts: []`, and onchain facts are stated in findings and here, not as `kind: onchain` evidence. Scripts were not edited. This is why C1, C2, S1 and S2 are capped at 2.

## What we searched

- PSE analysis bundle: used only to find docs.tongo.cash and github.com/fatlabsxyz/tongo.
- Docs pages: introduction, contracts, vault, relayer, auditor.
- Contracts at 7dac05e8:
  - Tongo.cairo: the owner can only `change_auditor_key` (auditor instances only) and `approveTongo`/`revokeTongo` for external transfers.
  - No `replace_class` in Tongo, Vault or Relayer.
  - The Vault has no owner and releases funds only to ledgers it deployed.
  - Events (events.cairo): TransferEvent keys are the sender and receiver pubkeys; Fund and Withdraw events carry plaintext amounts and Starknet addresses.
- SDK at 7dac05e8:
  - No hardcoded URLs.
  - The RPC is a constructor argument.
  - Exact-amount approve in fund.
  - No analytics dependencies.
  - A committed `.env` with devnet-only keys.
- Licences:
  - tongo and she are Apache-2.0. cairo-abi-codec has no LICENSE on GitHub (its npm package says ISC).
  - The LICENSE history has two commits, both Apache-2.0.
  - No CLA or CONTRIBUTING file.
- Verification: Voyager returned 403 (not bypassed), Starkscan renders client-side, and Starknet has no Sourcify.
- Audit: the zkSecurity report (October 13th, 2025) is online and in audits/. Its text names no audited commit, and it predates the v2 Vault and Relayer.
- tongo.cash: links to demo.tongo.cash, docs, GitHub and npm. No terms page.

## What we did not find or do

- No class-to-source verification.
- No public frontend source.
- No bounty.
- No transactions, builds or traces.
- tongo-evm (EVM port) has no mainnet deployment listed in the docs, so it is out of scope.

## Judgment calls

- **C1, C2, S1, S2 = 2**: the substance is 3, but the schema cannot hold Starknet addresses for onchain evidence.
- **C3 = 3**: the Relayer and AVNU paymaster are optional.
- **C5 = 1**: tokens are enumerated in docs only, and USDC freeze and sequencer assumptions are not stated.
- **O1 unknown.**
- **O2 = 1**: no public frontend.
- **F1 = 3**: Apache-2.0 on both required repos.
- **P2 = 3**: there is no auditor on the canonical instances.
- **P3 = 1**: payer and payee pubkeys are public in every transfer; only amounts are hidden.
- **P4 = 2, P5 = 2, P1 = 2, S3 = 2, C4 = 2**: code-only.
- **S4 = 2**: derived.
- **S5 = 2**: devnet keys in the repo.
- **S6 = 1**: one audit, which predates v2.
- The docs say the owner has "full control of the contract", but the code shows narrower powers. Noted in C1.

## Availability 2026-10-09

- Model `global`, from code (contracts and SDK).
- No first-party country list.
- The demo frontend is closed and was not inspected.

## Operational 2026-10-09

Facts are in `data/operational/tongo.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.**
  - The Starknet v3 fee is paid in STRK by the submitting account and goes to the sequencer (docs.starknet.io quote).
  - Sample: transfer 0x1c86…3949 on the v2 USDC ledger (Starknet block 12,474,497, 2026-07-29) paid 1.456 STRK. Other transfers paid 1.33 to 1.46 STRK and withdrawals 0.70 to 1.04 STRK, from receipts of all 19 transactions on that ledger.
  - The optional Relayer path adds a user-set `fee_to_sender`, paid from the encrypted balance to the caller (Tongo.cairo L236-L255).
- **Deployment.**
  - A binary search with `starknet_getClassHashAt` on publicnode puts the v2 USDC ledger at Starknet block 11,811,046 (2026-07-13).
  - Its Vault is at 11,810,608 and the Relayer at 11,811,680.
  - The first v1 instance is at 3,587,879 (2025-11-14).
  - Voyager returned 403 and Starkscan renders client-side, so the RPC was used instead.
- **Incidents.** Empty list: no security advisories in tongo or she, and no disclosure page.
- **Entity.** `absent`. Only the trade name "Fat Solutions" appears (fatsolutions.xyz footer, zkSecurity report). There is no legal form or jurisdiction, and the GitHub organisation profile is empty.
- **Licences.** `absent`. Judgment call: absent rather than not_applicable, because Fat Solutions holds the ledger owner key and the Relayer owner role, although it never holds funds. No register could be searched without a legal name.
- **Cashout.** `not_applicable`.
- **Volume.** `not_observable`. Fund, Withdraw and Ragequit events carry plaintext amounts, but they are Starknet events, and the script reads EVM logs only.
- **Group B facts recorded.**
  - B10.1: docs.tongo.cash protocol and SHE sections.
  - B12.1 is absent (refs C4).
- **Not set.**
  - B2.2: there is no security policy.
  - B11.2: no primary source on funding.
  - The operator controls: Fat Solutions runs only the closed demo frontend, and the AVNU paymaster is a third party.
