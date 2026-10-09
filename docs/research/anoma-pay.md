# AnomaPay: research log

Assessed 2026-10-09 by the AI research agent (seed). Scores are in `data/providers/anoma-pay.yaml`. Evidence only.

## Deployed decision

AnomaPay is deployed. The public beta on BNB Chain was announced on 2026-04-02 (Anoma blog and press release). On BSC, the protocol adapter `0xFC44…2B68` is live and not stopped, and the ERC20 forwarder `0xDe6A…840e` held about 1,477 USDC, 5,458 USDT and 0.0059 WETH at our block.

## Pins

- BSC reads via https://bsc-rpc.publicnode.com. That RPC serves only recent state (archive reads return 403), so recheck at the latest block.
  - Block 126599704:
    - Adapter `owner()` is `0xE908…Da10`.
    - `isEmergencyStopped()` = false.
    - The forwarder getter `getEmergencyCaller()` returns zero.
  - Block 126599882:
    - Both Safes (adapter owner `0xE908…Da10` and emergency committee `0xc703…d6C4`): threshold 3, the same five owners, no modules, zero guard slot.
    - The RISC Zero router `0x7C1B…39C7` routes selector `0x73c457ba` to verifier `0xBbcD…dC72`, whose `owner()` is the Anoma Safe and which reads `paused()` = false.
    - Forwarder token balances.
- The emergency committee was taken from the forwarder's constructor arguments on Sourcify.
- Repos:
  - anoma/pa-evm at tag contracts/v1.1.0 (`e368e273`). Its ProtocolAdapter.sol is identical to the Sourcify source of the adapter, and `getVersion()` returns 1.1.0.
  - anoma/anomapay-erc20-forwarder@916cc7ed (HEAD). Its ERC20Forwarder.sol is identical to the Sourcify source, and `getVersion()` returns 1.0.1.
  - anoma/anoma-app-sdk@7dc89bef.
  - anoma/arm-risc0@d04142a6.
  - anoma/anomapay-erc20-resource@1990b03d.

## Unit of assessment

- **Primary chain: BNB Smart Chain (56).** Basis: the launch post and press release, and the BinanceSmartChain entries in the pa-evm and forwarder `addresses.rs` deployment maps.
- Excluded:
  - The adapter and forwarder deployments on Ethereum, Base (private beta), Optimism, Arbitrum, Monad, Stable, MegaETH and Aurora.
  - The Solana adapter.
  - The "AnomaPay Card" advertised on the landing page.

## What we searched

- PSE private-transfers bundle, used only for links.
- Websites:
  - anomapay.app, landing page and the T&C page (server-rendered, so quotes resolve live).
  - docs.anoma.net: architecture, trust model, privacy guarantees, protocol adapter, api-clients, transfers.
  - Anoma blog and press release.
  - The anoma.net/anoma-pay-* URLs cited by PSE now return 404; the same pages live at docs.anoma.net.
- GitHub:
  - The anoma org repo list.
  - anoma/pay-interface-app, the audited frontend named in the SDK README, returns 404.
  - No transaction service, prover service or indexer repo exists.
- Sourcify: all four contracts are `match` (partial), adapter and forwarder sources diffed against the tags. bscscan returns 403 to curl and was not used.
- Source read at the pins:
  - Adapter: `execute` (no caller check), `emergencyStop` (onlyOwner, permanent), and `isEmergencyStopped`, which also follows the RISC Zero verifier's pause.
  - Forwarder: `_wrap` (Permit2 witness transfer of the exact amount), `_unwrap`, and the emergency-migration base.
- Audits: listed in the READMEs.
  - Adapter: Informal Systems on `fc69013e` and Nethermind on `fee4f470` (both 2025).
  - Forwarder: Informal Systems on `03e60b64`.
  - The deployed adapter tag is later (2026-01-27).

## What we did not find or do

- No public code for the hosted Transaction and Proving Service (backend.anoma.money), the Indexer or the web app.
- No signer disclosure for the Safes, no timelock, no bug bounty.
- We did not trace payload encryption end to end.
- We did not inspect the app bundle beyond the landing page.
- No transactions, traces or self-host attempts.

## Judgment calls

- **C2 = 2.** The adapter `execute()` is permissionless, but the documented client flow sends everything to the hosted prover. The direct path is reconstructable from public code (arm-risc0, the resource logic), not documented as a procedure.
- **C3 = 1.** The services are required and closed. The docs claim self-hosting is possible, but no code is published.
- **C4 = 1.** The docs say the proving service operator runs KYC/AML checks, while the terms say the Foundation does not monitor transactions. Both are recorded.
- **S1 = 0.** After an adapter stop, the 3-of-5 committee can appoint an emergency caller. That caller can unwrap any forwarder balance to any address with no proof. The docs' statement that funds "can only be moved with a valid proof" is contradicted by the code.
- **S2 = 1, not 3.** No code is upgradeable, but stop-and-migrate works as an upgrade controlled by a multisig with no timelock.
- **O3 = 0.** The missing pieces are unpublished code, not documentation.
- **P3 = 2.** Entry and exit are plaintext, internal transfers are not, and we did not trace the encryption.
- **S3 = 2.** Deposits use a Permit2 exact-amount transfer with expiry. The base approval to Permit2 is set by the closed app and was not seen.
- **S4 = 1.** Derived from S1=0, C2=2, C3=1, O3=0.
- **P1 and S5 unknown.** The client is closed.

## Schema notes

None. BSC fits.

## Availability 2026-10-09

- Model: `blocklist`, from section 2 of the T&C, "Prohibited Jurisdictions": SECO-embargoed countries "including, but not limited to" a named list.
- "Congo" is not specified, so CG and CD are both listed (the more restrictive reading).
- The clause literally says users "are using the Software from one of the countries embargoed". This is recorded as an apparent drafting error.
- The contracts have no country gate. We did not check whether the closed app geoblocks.

## Context

No primary legal source (court or regulator) concerning AnomaPay was found, so `context` is omitted.

## Operational 2026-10-09

File: `data/operational/anoma-pay.yaml`. Bot facts were left as filled. The required proving backend, indexer and Envio endpoint are closed, so every operator control applies. Custody is hybrid, so custodial controls apply too.

- **Read:**
  - The anomapay.app terms (v1.0, server-rendered).
  - docs.anoma.net: architecture, transfers (fee estimation), api-clients, trust model.
  - Anoma blog: BNB public beta (2026-04-02), V1 (2026-06-02), Base (2026-08-26).
  - pa-evm README (security contact, audits) and the pa-evm releases API.
- **Register.** Zefix (read-only search and firm JSON) lists Anoma Stiftung, CHE-264.379.335, Zug, foundation under federal supervision.
  - Its seat address moved to Dammstrasse 16 in May 2026; the terms still give Gotthardstrasse 26.
  - Register publications naming individuals were not copied.
- **Onchain:**
  - Sourcify creation data: adapter 2026-03-05 (block 84845927), forwarder 2026-03-06 (block 85055504). Dates come from bsc-dataseed block headers.
  - `isEmergencyStopped()` is false and `getEmergencyCaller()` is zero.
  - No fee or gas sample: public BSC RPCs refuse historical logs (publicnode needs a token, dRPC's free plan rejects ranges, dataseed returns "limit exceeded"). A fee quote would need a built transaction posted to the backend.

Judgment calls:
- **Custody `hybrid`, not provider_custodial.** The emergency caller that can move forwarder funds exists only after a public, permanent adapter stop. A reviewer may prefer provider_custodial for consistency with Payy.
- **Fees.** The terms say transactions carry no fees apart from gas. The launch post says small fees for transfers and withdrawals, and the docs show a backend fee with a percentage part. All three are recorded; no amounts are published.
- **Volume `unknown`.**
  - The spec counts Unwrapped events on the forwarder.
  - The token is an indexed topic, which the volume script cannot read, so amounts are not summed.
- **B1.2 `attested`.** The docs say the Vast.ai datacenters hold ISO certifications, with no certificate or scope.
- **B11.3 `absent`.** The terms have no termination clause.
- **B12.1 `unknown`.** The docs (operator runs KYC/AML checks) and the terms (no transaction monitoring) conflict.

Validator: offline 0 errors; online 0 errors.
