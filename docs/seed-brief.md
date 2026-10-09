# Seed research brief (for whoever evidences a seed provider)

Project root: ~/Claude/Projects/crops-dashboard. Read first:
- data/criteria.yaml (23 criteria, anchors 0-3, what evidence counts)
- schema/provider.schema.json (exact shape; additionalProperties false)
- CONTRIBUTING.md (evidence tiers, caps, CI rules, `check` format)

Output:
1. data/providers/<slug>.yaml matching the schema exactly. Every criterion ID C1-C5, O1-O4, F1-F3, P1-P5, S1-S6 present under `scores`, either scored (score + evidence + finding + provider_response: null) or `unknown: true`.
2. docs/research/<slug>.md: a short search log. What you searched (queries, orgs, explorers, Sourcify), what you found, what you did not find, and every judgment call between anchors.

Hard rules (CI enforces most; the rest are the product):
- No score without an artifact. score>0 needs verified or documented; score>1 needs verified. Vendor blogs/marketing/support = claimed = cap 0. Never infer from reputation. Can't find it => unknown: true.
- Low scores are scores too: if the artifact shows the property is ABSENT (e.g. a hardcoded endpoint, an EOA owner, no LICENSE file at a pinned commit), score 0 with that verified evidence. "Absent and proven absent" = 0; "nobody looked/can't see" = unknown.
- kind: repo => tier verified, `commit` = full 40-hex SHA you actually resolved (gh api repos/OWNER/REPO/commits/BRANCH --jq .sha), `path`, and url of the form https://github.com/OWNER/REPO/blob/<sha>/<path>#Lx-Ly (or /tree/<sha>/<dir> for directories). Read the file at that SHA (gh api repos/O/R/contents/PATH?ref=SHA) before citing it. Line ranges must be real.
- kind: onchain => tier verified, `address` (EIP-55 checksummed: `cast to-check-sum-address`), `block_number` (the block you read at: `cast block-number --rpc-url ...`), url to the explorer page for the address (or Sourcify repo page). Read state with `cast call`/`cast storage` against a public RPC (Base: https://mainnet.base.org, Gnosis: https://rpc.gnosischain.com, Ethereum: https://ethereum-rpc.publicnode.com, Optimism: https://mainnet.optimism.io, Arbitrum: https://arb1.arbitrum.io/rpc). Pin reads to the block with `--block N`.
- For any onchain item recording a role/parameter (owner, pauser, proxy admin via EIP-1967 slot 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, implementation slot 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, Safe getThreshold() 0xe75235b8, timelock delay), add `check: {call: "0x<calldata>", expect: "0x<64 hex word>"}` or `check: {slot: "0x..", expect: ...}`. expect = raw 32-byte return word (use `cast call ... ` raw output via `cast rpc eth_call` or `cast storage`). Lowercase hex.
- Sourcify: https://sourcify.dev/server/v2/contract/<chainId>/<address> (or legacy https://sourcify.dev/server/check-all-by-addresses?addresses=..&chainIds=..). Record match type in detail. Explorer: basescan.org / gnosisscan.io / etherscan.io pages.
- kind: document => tier documented (or claimed for blogs/marketing), url + checked_at. kind: trace => tier documented; only use if you actually ran the reproduction and wrote the steps in `detail`. You will not run browser traces; so P1/C4/P4 can only reach 3 if the anchor's "confirmed by trace" is met — otherwise cap at what code shows and say so in finding (judgment call: code-only evidence with no trace => at most 2 for P1, note it).
- O3 requires a recorded self-host attempt for 2-3. Don't attempt it; cap O3 at 1 (README presence as verified evidence) and say "reproduction not attempted" in finding.
- S4 is derived: state the chain of reasoning from S1, C2, C3, O3 in finding; it cannot exceed what those support.
- Every URL you cite must resolve right now (curl -sIL -o /dev/null -w '%{http_code}' URL => 200). Prefer github.com and explorer/Sourcify URLs.
- checked_at: 2026-10-07 (today).
- `detail`: one concrete sentence a reviewer can re-check ("PAUSER_ROLE members: 0xAbc... (Safe, 3-of-5) read at block N").
- `finding`: plain statement of what holds and what doesn't; flag judgment calls ("Judgment call: ...").
- Escape nothing; just write plain YAML. Quote addresses and hex strings. Keep `notes` short.
- Don't touch other files. Don't push anything anywhere. Don't post anything to any service. Read-only use of gh/cast/curl.
- If you can't decide between anchors, take the lower one and say why.

## Rules added after the methodology red team (docs/methodology-red-team.md). These override anything above.

Schema additions (see schema/provider.schema.json):
- `primary_chain.basis` (non-incumbents): why this chain/deployment is the unit, with evidence (e.g. "default chain in SDK config at <commit> path#L"), and what you excluded.
- `components` (required, non-empty, incl. incumbents): EVERY component in the payment path, public or closed: {name, role, public, license, operator, required, repo?}. Roles: contracts, sdk, frontend, backend, api, relayer, signer, indexer, paymaster, bundler, oracle, kyc, card-issuer, card-network, ledger, wallet, other. Closed hosted services are components with public: false, license: proprietary.
- `context` (optional): protections outside CROPS (regulation, safeguarding, licences, legal recourse), cited plainly. Never scored.
- Every cell: `assessed_by: "AI research agent (seed), 2026-10-07"` and `review: {status: pending}`. Never set status reviewed.
- Evidence: `tier: claimed` needs `by: provider | third_party`. `kind: document` needs `quote`: a short exact phrase (8-300 chars) that appears in the page's HTML as fetched by curl (CI checks this). If the page is client-rendered or blocks curl, save the text you read to `data/archive/<slug>-<short-name>.txt` and set `archive: data/archive/<that file>`; the quote must appear in the archive file.
- Evidence on onchain addresses that are EOAs (not contracts): add `eoa: true` (CI checks other addresses have code).
- `package: {name, version, integrity}` names a distributed npm artifact (integrity from `npm view <pkg>@<ver> dist.integrity`).
- `recheck`: a single command or click path a reviewer runs to reproduce the fact.

Validator rules (run `node scripts/validate.mjs --offline <file>` then online with `GITHUB_TOKEN=$(gh auth token) node scripts/validate.mjs <file>`; both must be 0 errors):
- A cell's evidence cannot be only third-party claims (a provider's own admission may hold a score down; third-party claims go in finding, optionally `disputed: true`).
- Score 2 or 3: at least one evidence item has `recheck`; every repo blob URL (other than LICENSE files) has a #Lx-Ly line range that exists at that commit.
- Score 3 on C1, C2, S1, S2 needs onchain evidence about the deployed contract (not only source). Score 3 on C4, P1, P4, S3, S5 needs an item with `package` (or a trace).
- C4, P1, P4, S5 at 3 claim an absence: not allowed if any required component is closed (unless a trace). F1 must be 0 if any required component is closed; at most 1 if any is source-available.
- Updated anchors for C1, S2 (read Safe modules via getModulesPaginated(0x1,10) and guard slot 0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8; signer disclosure; timelock vs user exit), C4 (neutral settlement + disclosed, bypassable edge filtering), P2 (legally required and disclosed with basis can be 2 if shown in code/repo doc; documented cap 1 still applies), S3 (bounded allowance = 2), S4 (2 needs a verified user withdrawal path), O3. Re-read data/criteria.yaml before scoring.

## Chains and card batch notes (added 2026-10-07)

- Public RPCs by chain id: 1 https://ethereum-rpc.publicnode.com, 10 https://mainnet.optimism.io, 56 https://bsc-rpc.publicnode.com, 100 https://rpc.gnosischain.com, 122 https://rpc.fuse.io, 137 https://polygon-bor-rpc.publicnode.com, 999 https://rpc.hyperliquid.xyz/evm, 8453 https://mainnet.base.org, 9745 https://rpc.plasma.to, 42161 https://arb1.arbitrum.io/rpc, 42220 https://forno.celo.org, 43114 https://api.avax.network/ext/bc/C/rpc, 59144 https://rpc.linea.build, 534352 https://rpc.scroll.io.
- Non-EVM chains (e.g. Solana): use `primary_chain: {name, caip2, basis}` (Solana mainnet caip2: `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`), and `caip2` instead of `chain_id` on contracts/evidence. Addresses are base58. Read Solana state with `curl -s https://api.mainnet-beta.solana.com -X POST -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["<addr>",{"encoding":"jsonParsed"}]}'` (program upgrade authority via the programData account). Note `block_number` = the slot you read at. There is no Sourcify for Solana; verified builds can be shown via the program's on-chain verification (e.g. OtterSec verify registry) — cite as onchain if you can read it, else say so.
- Card products: the card issuer, card network, KYC vendor and the provider's backend/app are components (usually public: false). Card-side facts (freezing cards, KYC, data sharing) come from terms/privacy policy = documented (cap 1, can lower). Card Map (cardmap.org) is a third-party listing: it may help you find the product but is never evidence for a score (it would be `claimed`, `by: third_party`).
- Eligibility: if you cannot find at least one verified contract or one public repository NEEDED TO RUN THE PRODUCT, the provider is `type: incumbent` with notes listing what you searched. "Self-custody" marketing is a claim, not evidence.

## Country availability (added 2026-10-09)

Add an `availability` block to a provider file (schema: `properties.availability`). It is displayed on the Countries pages and never scored, but it follows the same evidence rules.
- `model: global` for protocols usable from anywhere (contracts with no geographic restriction and official clients with no country gate); evidence is the contract or client code (verified). If the official app or frontend restricts countries while the protocol does not, use the app's model and explain the protocol-level access in `note`.
- `model: allowlist` when the provider lists where it is offered; `model: blocklist` when it lists where it is not offered (prohibited/restricted/sanctioned jurisdictions). Use ISO 3166-1 alpha-2 codes (XK for Kosovo) or the region names in data/regions.yaml (EU, EEA). Expand phrases like "comprehensively sanctioned countries" only if the document names them; otherwise list what is named and say so in `note`.
- Sub-national limits (US states, Canadian provinces), product variants (different card programmes per region), and contradictions between documents go in `note`. If documents disagree, use the more restrictive reading and say so.
- `evidence`: the provider's own terms, docs, help pages or code. Documents need `quote` (or a committed archive under data/archive/). Third-party listings (Card Map, review sites, press) are never sufficient.
- `checked_at`: today. If no first-party source lists countries, omit the `availability` block entirely (the site shows "no evidence") and record what you searched in the research log.
- macOS has no `timeout` command: use `curl --max-time 30`, and keep individual commands short.

## Privacy transfer protocols (added 2026-10-09)

- Type: `transfer`. Group label on the site: "Transfers and privacy". Assess each as a payment rail: can a payer send value to a payee through it, and how does that flow score on the 23 criteria. See data/providers/tornado-cash.yaml for a complete, validated example of this type.
- PSE's Private Transfers Analysis (private-transfers.pse.dev) is a third-party analysis: use it only to find the product and its links. It is never evidence (it would be `claimed`, `by: third_party`).
- Own-chain protocols (Zcash, Monero, Aleo, Aztec, Miden, Intmax): `primary_chain` with `caip2` (e.g. `zcash:main`, `monero:mainnet`, `aztec:mainnet`), `basis` stating why that chain, and `contracts: []` if the chain has no contract addresses; eligibility then rests on the public repos needed to run the protocol (node, wallet). Where the address format does not fit the schema, cite repo and document evidence and say so in the research log instead of editing scripts.
- Deployed means usable on a mainnet today. If a protocol is testnet-only, not yet launched, or shut down with no live contracts, do not create a provider file; report it in your final reply with the evidence.
- Relayers, provers, sequencers and hosted RPC/indexer services are components; mark `required` honestly (can a user withdraw or transfer without them?).
- P3 (onchain linkability) is scored from what the chain and code reveal (amounts, timing, fixed denominations, encrypted vs plaintext state). Anonymity-set size and behavioural heuristics belong in the finding, not the score.
- Legal or regulatory context goes in `context` only where a primary source (court, regulator, government) exists; it is neutral, dated and never scored. Do not infer legal status from press.
- `availability`: privacy protocols with no country gate in contracts or official clients are `model: global` with the code as evidence; if the official frontend geoblocks, use `blocklist`/`allowlist` from its code or terms and explain protocol-level access in `note`.
