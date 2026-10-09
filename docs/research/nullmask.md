# Nullmask: research log

Assessed 2026-10-09 by the AI research agent (seed). Scores are in `data/providers/nullmask.yaml`. Evidence only.

## Deployed decision and type

- **Deployed.** The Ethereum mainnet pool proxy `0x88888888Eb71E1D68aD0C471C6893EdEEa00B026` has code (implementation `0x4E50…0e91`) and held about 0.26 ETH at block 26153477. app.nullmask.io is live. The terms are effective 2026-10-01 and say the Pool is "on Ethereum mainnet".
- **Type: `incumbent`.** The brief's eligibility rule applies: we found no verified contract and no public repository needed to run the product.
  - The proxy, the implementation and the AdminUpgradeController `0x6073…cFa1` have no Sourcify record and show as unverified on Etherscan and Blockscout.
  - github.com/nullmask-io has one public repo, `nullmask-website`, a SvelteKit landing page with no licence.
  - The docs describe a private `web/` Turborepo containing the app, rpc-proxy, relayer, guard, circuits and contracts.
  - Two repos under `rocket0xdev1025` (created 2026-10-07, containing built site copies) are not first-party and were ignored.
- Re-assess as `transfer` if the contracts are verified or the monorepo is published.

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com.
  - Block 26153596:
    - `guard()` is `0x3AAf…9239`, an EOA (nonce 95).
    - `upgradeController()` is `0x6073…cFa1`.
    - The controller's `admin()` is `0xFf29…9CCd`, an EOA (nonce 81).
    - The EIP-1967 implementation slot reads `0x4E50…0e91`.
  - Block 26153477: the balance, and the empty EIP-1967 admin slot.
- The controller's selectors were recovered from bytecode with `cast selectors`: `execute(address,bytes)`, `transferAdmin(address)`, `admin()`, and one view `(address,address)`. There is no delay function.
- `guard()` and `upgradeController()` were called by the names in the docs' `State.sol` description. They are public getters on the unverified contract.

## What we searched

- PSE private-transfers bundle, used only for links to docs.nullmask.io and github.com/nullmask-io.
- docs.nullmask.io (GitBook, `.md` variants):
  - supported networks, contract reference, events and token whitelist;
  - deposit screening, guard service and revocation keys;
  - threat model, access tokens, on-chain guarantees;
  - user guide (withdrawing, wallet-only mode) and developer monorepo structure.
- app.nullmask.io/terms. The page is client-rendered, so curl returns an empty shell. We read it in the browser pane and committed the excerpts to `data/archive/nullmask-terms.txt`.
- Sourcify, Etherscan and Blockscout for the proxy, implementation and controller.
- GitHub search for "nullmask".

## Key provider admissions (terms, effective 2026-10-01)

- The operator controls the contracts. It can upgrade them, pause them and change fees without notice. "An upgrade can change any rule of the Pool, including the rules that decide who can move assets."
- Transfers, swaps and withdrawals need the operator's servers and relayer, and no alternative tooling is provided.
- Its servers keep users' viewing keys and can link deposits to transfers and withdrawals.
- Deposits are screened using public sanctions lists, blockchain data and an unnamed third-party analytics provider. Withdrawal recipients are screened too.
- The contracts are unaudited.
- The operator is not named: "the company that operates the Services".

## Judgment calls

- **Type incumbent rather than transfer.** This follows the brief's eligibility rule, although the product is a privacy transfer rail.
- **C1, S1, S2 = 0.** Both roles are held by EOAs (the guard and the controller admin), and the terms confirm unilateral upgrade and pause.
- **C2, C3, F3, O3, S4 = 0.** These rest on the operator's statement that operations need its servers. A provider admission may hold a score down.
- **C4 = 1, not 0.** The filtering sits in the settlement path but is disclosed.
- **P4 = 0, not 1.** The analytics vendor is unnamed.
- **O1 = 0.** The contracts are unverified, although the docs' threat model calls the contract "open-source, auditable".
- **Unknown:** P3 (no verified code; the docs alone cap at 1, and no anchor 1 fits), P1, P5, S3, S5, F2.

## Schema notes

An incumbent has no `primary_chain`, so onchain evidence carries `chain_id: 1` explicitly. `contracts: []` follows the phantom-cash precedent; the addresses are in `notes`.

## Availability 2026-10-09

- Model: `blocklist`. The countries are CU, IR, KP and SY plus AE, from section 2.3 of the terms.
- Crimea, Donetsk and Luhansk are named as regions. Ukraine itself is not, so they go in the note.
- "Any other country under comprehensive sanctions" is not expanded, as the brief requires.

## Operational 2026-10-09

File: `data/operational/nullmask.yaml` (new; no bot facts existed). Incumbent-typed, so every operator and custodial control applies.

- **Read:** the Terms of Use and Privacy Policy, both effective 2026-10-01.
  - Both are client-rendered, so they were read in the browser pane.
  - The new excerpts are archived in `data/archive/nullmask-ops-terms.txt` and `nullmask-ops-privacy.txt`. Privacy table rows are flattened to "item: value".
  - Docs pages read as `.md`: fees, architecture, components, backend services, access tokens, RPC overview, roadmap, events, threat model, code quality.
- **Onchain** (Blockscout API and publicnode):
  - The proxy was created on 2026-02-03 in block 24378139, tx `0x867dcf77…e7ed`, through CreateX and sent by the current controller admin `0xFf29…9CCd`.
  - It has 12 Upgraded logs between 2026-02-03 and 2026-02-23. The last one set `0x4E50…0e91`, which the proxy still uses.
  - 30 ShieldedWithdrawal logs exist, matching the docs' event signature. Fee sample: tx `0x789715bd…fd02` charged 0.00197 ETH against about 0.00130 ETH of gas.
- **Registers.** A Companies House name search for "nullmask" returned no results. The operator is unnamed and "established outside the EEA and the UK", so no other register was searched.
- **Other checks.**
  - TLS: app.nullmask.io refuses TLS 1.1 and accepts 1.2.
  - status.nullmask.io does not resolve, and there is no security.txt.

Judgment calls:
- **Custody `provider_custodial`.** It agrees with S1 = 0: the EOA-controlled upgrade can change who moves funds, and every exit needs the operator's servers. The terms do say only the wallet can authorise spending.
- **Entity `attested`, B11.1 `attested`.** The terms offer the operator's legal details on written request. No name is public.
- **Licences `absent`.** The terms disclaim being a payment institution and name no licence.
- **Incidents `unknown`.** There is no advisory or status channel to show absence.
- **Volume `not_verifiable`.** The pool is unverified and not in the contracts list. A spec over its documented ShieldedWithdrawal event is described in the note.
- **B1.4 `absent`.** It points at S6, where the operator states the contracts are unaudited.

Validator: offline 0 errors; online 0 errors.
