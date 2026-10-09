# Umbra Cash: research log

Assessed 2026-10-09 by the AI research agent (seed). The scores are in `data/providers/umbra.yaml`. This log records evidence only. It contains no usage instructions.

## Pins

- Ethereum reads via https://ethereum-rpc.publicnode.com at block 26153546.
- Repos: ScopeLift/umbra-protocol@07a64aeef305399a86afe72e502156d72babcc17 (main, 2026-10-08); ScopeLift/umbra-subgraph (listed, not read in depth).
- npm: @umbracash/umbra-js latest is 0.2.2; the repo's umbra-js is 0.3.0 and unpublished, so no `package` evidence.

## Unit of assessment

- **Primary chain: Ethereum (1).** umbra-js uses one address on all chains and lists mainnet first with the earliest start block (12343914); the frontend lists Mainnet first. "Umbra Cash" is ScopeLift's Umbra (app.umbra.cash), not the unrelated Solana project of a similar name.
- In scope: Umbra 0xFb2d…5401 and StealthKeyRegistry 0x31fe…38f3. Excluded: L2 deployments, UmbraBatchSend 0xDbD0…91EB and the Uniswap withdraw hook (optional periphery), testnets.

## What we searched

- `gh repo list ScopeLift`: umbra-protocol (MIT), umbra-subgraph (no licence), umbra-v2-experimental, umbra-collectible. No repo for the Umbra API (relayer, token list) or the Ponder indexer.
- Contracts read at 07a64aee: Umbra.sol (owner sets toll, toll collector and receiver; sends, withdrawals, signature checks), StealthKeyRegistry.sol (no owner). No delegatecall or selfdestruct.
- Sourcify v2: Umbra, StealthKeyRegistry and UmbraBatchSend `exact_match`. Sourcify sources equal the repo files apart from a trailing newline; hardhat.config.ts compiler settings match (0.7.6 and 0.8.7, runs 999999). Etherscan's page showed "Exact Match" text for Umbra, not relied on.
- Onchain: owner() = 0x5777…7232 (no code; also the `admin` in deploy-history/mainnet-latest.json), toll() = 0, tollCollector EOA 0x12aE…2615, tollReceiver 0xb443…17F9 (23 bytes of EIP-7702 code, VERSION() "1.3.0"), implementation and admin slots zero on both contracts, contract ETH balance 0.
- umbra-js: compliance code (hardcoded banned lists, Chainalysis oracle 0x40C5…C8fb for single recipients), subgraph-then-RPC-logs scanning, Etherscan-family TxHistoryProvider with env keys, chain configs.
- Frontend: Umbra API client (hardcoded mainnet.api.umbra.cash; token list and relayer), Netlify ponder.mjs proxy (upstream URL and token from env), approval code (MaxUint256), dependencies (no analytics; bnc-notify without dappId), privacy policy and terms (no country list), FAQ audit links.
- Audits: FAQ links ConsenSys Diligence (2021-03, contracts) and Least Authority (umbra-js). The ConsenSys page returned 403 to curl; we did not bypass it. The Least Authority PDF downloaded, but its text uses glyph encoding our extractor could not read, so no audited commit was recorded.
- Legal context: no court, regulator or government source found; `context` omitted.

## What we did not find or do

- No audited commit for either report; no SECURITY file or bounty.
- No code for the Umbra API or the Ponder indexer.
- No transactions, UI runs, traces or self-host attempts (O3 capped at 1).

## Judgment calls

- **C1 = 0**: the owner EOA can raise the unbounded toll and stop new sends; withdrawals are unaffected.
- **C3 = 3**: the relayer and indexer are optional; self-withdrawal needs gas from elsewhere (privacy cost).
- **C4 = 2**: substance fits 3, but no npm package matches the repo SDK and no trace.
- **C5 = 0**: the token list lives only in the hosted API response.
- **O1 = 2**: full Sourcify matches, but no rebuild and the repo files differ by a trailing newline.
- **O2 = 2**: closed API and indexer, their types committed in the frontend.
- **P2 = 2**: only IP logging on optional hosted services, disclosed in a versioned policy.
- **P3 = 3**: stealth addresses; withdrawal hygiene is behavioural.
- **S3 = 0**: unlimited approval with no wording found.
- **S5 = 2**: explorer and RPC keys bundled client-side.
- **S6 = 1**: audit reports linked, audited commits not read.
- **Availability = global**: no country gate in contracts, SDK or app; screening is by address.

## Operational 2026-10-09

Facts are in `data/operational/umbra.yaml`; the bot's B2.1, B2.3, B8.2 and B9.x facts were kept as they were.

- **Fees.**
  - The Ethereum `toll()` reads 0 at block 26153752. `setToll` is onlyOwner, unbounded and emits no event, so past toll values cannot be listed.
  - The relayer fee is a per-token estimate from the closed Umbra API (umbra-api.ts L89-L93) and is not published.
  - ETH withdrawals pay no relayer fee.
- **Deployment.** Sourcify creation data and the receipt put the contract at block 12343914 (2021-04-30), matching deploy-history. The StealthKeyRegistry followed at 13098125 (2021-08-26).
- **Changes.** We list the deploy-history entries per network. The mainnet contract was never replaced, and ownership has not moved since the constructor.
- **Entity.** ScopeLift, a Pennsylvania LLC according to the Terms of Service. The PA Department of State register was not read (it is an interactive app), so there is no register URL.
- **Licences.** `absent`: the terms, privacy policy and FAQ cite none.
- **Incidents.** None found. There are no GitHub advisories, and issue searches for exploit, incident, vulnerability, hack and security found no incident report.
- **Volume spec.** The Announcement event (topic0 0x2987…2219), counting events only. Judgment call: the token is indexed in topic 2, which scripts/volumes.mjs cannot read, so `amount_word` is left out to avoid summing ETH and tokens together. A per-token sum needs a topic-based token option in the script.
- **Group B facts recorded.** Umbra has no required closed component, but ScopeLift runs the app, relayer and indexer, so their positions are recorded:
  - B1.4 refs S6.
  - B6.3: IP logs kept up to 90 days, and up to 5 years for registered users.
  - B10.1: FAQ, logical view only.
  - B11.1: ScopeLift.
  - B11.2 is unknown: the toll is 0, and maintenance funding is undocumented.
  - B11.3: the terms allow termination at will; funds are unaffected.
  - B12.1 is absent: screening is a hardcoded list plus the Chainalysis oracle.
