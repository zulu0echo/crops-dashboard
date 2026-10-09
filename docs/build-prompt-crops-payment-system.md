# Build prompt: a CROPS-aligned payment rail

You are building an open, non-custodial payment system for merchants, institutions and individuals that meets the Ethereum Foundation's CROPS properties: Censorship Resistance, Open Source and Free (as in Freedom), Privacy, Security. It must be usable by a bank treasury or an NGO paying suppliers, not only by crypto-native users.

The requirements come from assessing 32 payment rails against a 23-criterion rubric (the Payment Rails CROPS Dashboard, `data/criteria.yaml` in that repository). The failure patterns cited below are what the assessment found repeatedly; those seed ratings are pending human review, so treat the counts as indicative. The system you build is done when its own provider file passes that dashboard's validator with every criterion at 3, or at the highest score the rubric allows before an external audit exists (section 9).

Read this whole document before writing anything. "Must" is an acceptance test. Where a decision is left to you, pick the simplest option that satisfies the constraints and record it in `docs/decisions.md`. A suggested architecture is given in section 4, explained with diagrams in `crops-payment-system-architecture.md` alongside this prompt; you may depart from it if you record why.

---

## 1. Non-negotiable constraints

1. **No required operator.** A payment completes with nothing but the public contracts, a wallet, and any RPC endpoint. Relayers, indexers, notification services and frontends may exist, but each is optional, open source, self-hostable, and replaceable by a direct path the SDK uses automatically.
2. **No admin keys in the payment path.** Settlement contracts have no owner, pauser, allowlist, blocklist, upgrade admin, fee setter or sweep function. Anything that must be configured is fixed at deployment.
3. **No custody in flight.** Funds move from payer to payee in one transaction. Where escrow is needed, only the payer and payee can move escrowed funds, with a refund path that needs no one else.
4. **Exact, expiring authorisations only.** The SDK and every reference client must never request an unbounded allowance.
5. **Nothing leaves the user's device except to endpoints the user configured.** No analytics, telemetry, error reporting, fingerprinting, third-party fonts or scripts, and no bundled third-party API keys.
6. **OSI licence on everything, no CLA, no relicensing path.** MIT or Apache-2.0 on every repository and every source file header. Contributions use a DCO, not a CLA.
7. **Reproducible from a clean checkout.** A stranger can build, deploy to a local or test chain, and complete a payment from the README, and CI proves it on every commit.
8. **The settlement layer is neutral; compliance happens at the edge.** Contracts never filter addresses or regions. Merchants who must screen do so in an optional, disclosed, merchant-side module that the direct path bypasses.

## 2. What the assessment found, and the requirement each finding sets

Each row lists a criterion ID from the dashboard's rubric, the pattern the seed assessment found across the 17 onchain rails, and what this system must do instead.

| Criterion | Pattern found | Requirement |
| --- | --- | --- |
| C1 admin pause or freeze | 16 of 17 rails scored 0: EOA owners, pausers, relayer allowlists, an owner able to repoint a delegatecall target, a Safe module that bypassed its multisig threshold | No privileged role in any contract the payment path touches. CI asserts the deployed bytecode has no owner-gated or role-gated function. |
| C2 settle without the provider | 15 of 17 at 0: settlement required the provider's relayer, a provider-signed price, or a card issuer | `pay` is permissionless. The payer, the payee or any third party can submit it. The SDK submits directly when no relayer answers. |
| C3 hosted dependence | 15 of 17 at 0: closed APIs, signers and indexers with no fallback | Every hosted component is optional, public, and self-hostable, and the client ships with at least two independent defaults plus direct mode. |
| C4 neutral settlement | Filtering was usually disclosed only in terms, ran in a closed backend, and could not be bypassed | Neutral contracts. Optional merchant-side screening module with a named list source, disclosed on the invoice, bypassable by C2. |
| C5 inherited freeze exposure | Most rails listed tokens in code but never told payees about issuer blacklists, forced transfers or sequencer control | A token registry in the repo stating each supported token's issuer powers (blacklist, pause, forced transfer, permanent delegate) and each chain's sequencer and forced-inclusion assumptions, shown to the payee when they choose what to accept. |
| O1 verified contracts | Partial Sourcify matches, implementations missing from repos, a build config that did not reproduce the deployed bytecode | Deterministic build. CI deploys with CREATE2 from the pinned commit, compares bytecode to the live deployment, and submits for a Sourcify full match. |
| O2 full stack public | Usually contracts and an SDK only; one rail published its whole stack | Every component is public: contracts, SDK, reference checkout, merchant console, optional relayer, optional indexer, deploy scripts, and an API schema. |
| O3 self-host | No rail had a recorded self-host run | A one-command local stack (for example `docker compose up` or a single binary) and a CI job that brings it up from a clean checkout and completes a test payment. That run is the recorded reproduction. |
| O4 interfaces and export | API references lived only on hosted docs; no payee export | ABIs, event schemas, the relayer and indexer API schema (OpenAPI), and payee export as CSV, JSON and ISO 20022 camt.053, all versioned in the repo. |
| F1 licences | Inspect-only licences, BUSL, UNLICENSED headers, missing LICENSE files, closed required components | MIT or Apache-2.0 at the root, in every package, and in every SPDX header; CI fails on a mismatch. No closed required component exists, so F1 cannot be capped. |
| F2 relicensing | A CLA permitting relicensing; one rail removed its MIT licence | No CLA; DCO sign-off; a written licence-stability commitment in the repo. |
| F3 open-core | Production needed a proprietary backend or partner credentials | No feature, including the merchant console and notifications, depends on a service that only the authors run. |
| P1 telemetry | Analytics SDKs on by default in widgets, error reporting before consent, tag managers loading with no ID set | Zero telemetry. CI checks the lockfile against a denylist of analytics and error-reporting packages, and a headless network trace in CI asserts that a full payment contacts only the configured RPC. |
| P2 data beyond settlement | Device, IP, location and biometric collection beyond any legal need | The protocol needs only addresses, amount, token, chain and deadline. Optional fields (memo, customer reference) are encrypted to the payee and clearly optional in code. |
| P3 onchain linkability | Plaintext invoices stored publicly and indexed, card ids in events, phone-derived identifiers attested onchain | Events carry no invoice content and no stable payee identifier. Payee receives at a fresh stealth address per invoice (ERC-5564 or equivalent). The payment reference is a salted commitment. A shielded mode is a later milestone (section 8). |
| P4 third parties | Indexers, RPC vendors, risk vendors and analytics hardcoded and unswappable | Only the user-configured RPC is in the critical path. Every optional service is named in code and set by configuration. |
| P5 endpoints | Hardcoded RPC providers and APIs | RPC, indexer and relayer URLs are settable in the UI and SDK, persisted locally, with no default third-party API key. |
| S1 custody in flight | Relayers that kept surplus, oracle keys that could debit any wallet, settlement dispatchers an admin could drain, issuer tokens movable without a signature | Atomic payer-to-payee transfer. Optional escrow is per invoice, immutable, releasable only by the payee or the payer, with a payer refund after the deadline. |
| S2 upgrade authority | EOA proxy admins, multisigs without timelocks, undisclosed signers | Non-upgradeable contracts. New versions are new deployments; clients choose which version to use. |
| S3 approval scope | Unlimited approvals by default in several SDKs, confirmed onchain | EIP-3009 `transferWithAuthorization` where the token supports it, otherwise Permit2 signature transfers for the exact amount with a deadline. CI fails if any client code path calls `approve` with more than the payment amount. |
| S4 walkaway | Funds or access depended on the provider staying alive | If the authors disappear, payers and payees keep paying through the contracts, a static frontend pinned to IPFS, and any RPC. A CI test runs a payment with every optional service disabled. |
| S5 secrets and webhooks | Unsigned callbacks, client secrets in browser bundles, API keys shipped to the browser | No secret ever reaches a client bundle (CI scans the build). Payees verify payments from chain events directly. The optional notification service signs webhooks, and the repo ships verification code with constant-time comparison. |
| S6 audits and bounty | No audits, or audits of code no longer deployed | Audit-ready by release: specification, invariants, fuzz and formal properties in the repo. The audited commit must equal the deployed bytecode, each finding links its fix commit, and a bounty with scope lives in the repo (section 9). |

## 3. Users and flows the system must support

Design for an institution's day-to-day work, because CROPS properties are only useful if the system is adopted.

1. **Invoice and pay.** A payee creates an invoice offline: an EIP-712 message signed by the payee, holding amount, token, chain, deadline, a stealth meta-address and an optional encrypted memo. It is shared as a link or QR code with no server involved. A payer opens it in any wallet or the static checkout, signs one exact authorisation, and the payment settles.
2. **Batch payouts.** A treasury pays many payees in one transaction from a CSV file, with per-line results and an export of what settled.
3. **Refunds.** The payee can refund any payment, fully or partly, referencing the original commitment. No third party is involved.
4. **Escrowed payment (optional).** For delivery-versus-payment cases: payer funds an immutable per-invoice escrow; the payer releases it to the payee, the payee can return it to the payer at any time, and the payer can reclaim it after the deadline. Seller protection needs a third party named in the invoice by both sides; whether to support one, and in which milestone, is a recorded decision.
5. **Reconciliation.** The payee's console scans the chain through its own RPC, matches payments to invoices locally, and exports CSV, JSON and camt.053 for accounting systems.
6. **Notification.** The merchant either watches the chain directly or runs the optional notification service, which posts signed webhooks to its own systems.
7. **Edge screening (optional).** A merchant who must screen enables the module, picks a list source, and the invoice states that screening applies and which list is used. The direct contract path is unaffected.
8. **Auditor access.** A payee can hand an auditor a view key or a signed export that reveals its own payments without revealing anyone else's.

Out of scope: card issuing and card-network acceptance. Card networks require a closed issuer and network, so no card product can meet C2, C3, F1 or F3. If an off-ramp or card adapter is added later, it is a separate, optional component marked `required: false`, and the core must work without it.

## 4. Suggested architecture

Departures are allowed; record each in `docs/decisions.md`.

- **Contracts (Solidity, immutable, no owner).**
  - `PaymentRouter`: `pay` takes an EIP-3009 or Permit2 authorisation for the exact amount, transfers payer to payee in one call, and emits `Paid(commitment, token, amount)`. It also provides `payBatch` and `refund`.
  - `InvoiceEscrow`: per invoice, deployed by CREATE2 from the invoice hash. It has release (payer, to payee), return (payee, to payer), reclaim after the deadline (payer), and no other function.
  - A stealth-address announcer, or the ERC-5564 singleton where one is deployed.
  - Identical addresses on every supported chain via CREATE2.
- **SDK (TypeScript, zero runtime dependencies beyond a minimal EVM library).** It builds and verifies invoices, produces authorisations, submits directly or through any configured relayer, scans for incoming payments, and generates exports.
- **Reference checkout and merchant console.** Static sites with no backend and no third-party requests, deployable to IPFS. All state stays in the browser or in files the user exports.
- **Optional relayer.** Open source and permissionless to run. It is paid by a fee inside the authorisation, cannot change any payment term, and the client falls back to direct submission. At least two independent operators are listed by default, each replaceable.
- **Optional indexer and notification service.** Open source and self-hostable, with an OpenAPI schema, signed webhooks, and no account system.
- **Chains.** Ethereum mainnet plus L2s with permissionless fault or validity proofs and a working forced-inclusion path, stated in the token registry with the L2BEAT stage at the time of release. No bridge or swap is in the settlement path. Cross-chain payments are separate payments the payer chooses to make.
- **Tokens.** Any ERC-20 the payee chooses, with the registry's freeze disclosure shown at selection. At least one supported asset should have no issuer freeze power, so payees have a choice.

## 5. Repository and automation

```
README.md                  build, run locally, deploy, self-host, pin to IPFS
LICENSE                    MIT or Apache-2.0
CONTRIBUTING.md            DCO, no CLA, review rules
docs/decisions.md          one paragraph per decision
docs/architecture.md       how it works, with diagrams as code (section 7)
docs/spec.md               protocol specification and invariants
docs/token-registry.md     per token and chain: issuer powers, sequencer, forced inclusion
docs/license-stability.md  written commitment not to relicense
docs/crops-self-review.md  the system's own CROPS review
contracts/                 sources, tests, fuzz and invariant suites, deploy scripts
sdk/
apps/checkout/             static
apps/console/              static
services/relayer/          optional
services/indexer/          optional, includes notifications
compose.yaml               one-command local stack
.github/workflows/         ci.yml as below
```

CI on every commit must:

1. build contracts deterministically and compare bytecode with the recorded deployments;
2. run unit, fuzz and invariant tests, including invariants that no function moves funds except as specified and that no stored role exists;
3. bring up the local stack from a clean checkout and complete a payment, a batch payout, a refund and an escrow release, once with every optional service running and once with all of them disabled;
4. run a headless network trace of the checkout and console during a payment and fail on any request to a host other than the configured RPC and the services under test;
5. scan the lockfiles against the telemetry denylist, scan built bundles for secrets, and fail on any `approve` call site that is not exact-amount;
6. check that every source file's SPDX header matches the repository licence, and that every diagram in `docs/` parses and renders;
7. publish the static apps as a self-contained build artifact with its IPFS CID.

## 6. Privacy defaults

- Each invoice uses a fresh stealth address, so a payee's public revenue history cannot be read from a single address.
- Memos and customer references are encrypted to the payee's viewing key before they leave the payer's device.
- The checkout never asks for an email, name, IP-derived location or device data. A merchant that needs customer data collects it in its own systems, outside this protocol.
- View keys or signed exports give auditors and regulators access to a payee's own records.
- Payer privacy beyond stealth receiving is a later milestone (section 8). Do not claim it before it exists.

## 7. Documentation

### How it works, with architecture diagrams

Ship `docs/architecture.md`, explaining how the system works for an engineer who has never seen it. Start from `crops-payment-system-architecture.md`, which accompanies this prompt, and keep it true to the code as the system changes. It must include at least these diagrams:

- components, marking which are required for a payment and which are optional;
- who can move funds, including inherited powers held by token issuers and sequencers;
- the invoice-and-pay sequence, and the relayed sequence with its fallback to direct submission;
- what is public onchain and what stays with payer and payee;
- the escrow state machine;
- reconciliation, notification and auditor access;
- what still works with every optional service down;
- deployment and bytecode verification;
- the CI pipeline, and which dashboard criterion each job's output is evidence for.

Diagrams are text in the repository (Mermaid or an equivalent that renders on the code host), so they can be reviewed in diffs, and CI fails if one does not render (section 5, step 6). A pull request that changes a contract interface, a flow, or which components are required must update the affected diagram in the same pull request. Each diagram is followed by prose stating what it shows and any open question it raises. Each component also has a reference page: what it does, its inputs and outputs, what its operator can see and do, and how to run it.

### For institutions


Ship plain-language pages, written for a risk committee, that state:

- what the system guarantees and what it does not;
- the inherited risks a payee accepts by choosing each token and chain;
- what the operator of each optional service can and cannot see or do;
- how to run everything themselves;
- how to export records for accounting and audit.

State the regulatory boundary carefully: describe the design fact (no party other than the payer and payee can move funds), and do not make legal claims about licensing obligations, which depend on jurisdiction and on how each deployer uses the software.

## 8. Milestones

1. **Core.** Contracts, SDK, static checkout and console, direct submission, exports, the token registry, and full CI. Already at this stage the system must meet every requirement in sections 1 and 2 except S6.
2. **Optional services.** Relayer and indexer/notification service, two independent default operators, and IPFS pinning.
3. **Assurance.** Specification frozen, external audit of the exact deployment commit, fixes linked per finding, bounty live with scope in the repo.
4. **Payer privacy.** A shielded payment mode (for example via a privacy pool with association sets, so payers can prove they are not linked to sanctioned funds), designed so that auditors can still be given selective access.

## 9. Acceptance

The system is accepted when, at milestone 3:

1. A provider file for it in the CROPS dashboard repository passes `node scripts/validate.mjs` (offline and online) with every criterion scored 3 and every evidence item pointing at this repository at a pinned commit or at the deployed contracts. Before milestone 3, S6 may sit at 2 or below, with the reason stated.
2. Every `recheck` command in that file runs and reproduces the stated fact.
3. The CI run from section 5, step 3, is cited as the O3 trace, and the step 4 network trace is cited for P1 and P4.
4. A stranger follows the README from a clean machine to a completed test payment in under 30 minutes, and records the steps.
5. `docs/crops-self-review.md` is written against the CROPS review template and names every accepted compromise, with its bound and the user's way out. Expected entries include:
   - stablecoin issuer powers, which can only be disclosed, not removed;
   - L2 sequencer assumptions;
   - the hosting of the static frontend;
   - the funding and independence of the default relayer operators.

## 10. Coding style

Lazy senior dev mode: pick the simplest thing that works; the best code is code not written.

- Climb the ladder before writing anything:
  1. Does this need to exist?
  2. Does the standard library or platform do it?
  3. Does an already-installed dependency do it?
  4. Can it be one line?
  5. Only then write the minimum.
- Write no abstractions nobody asked for, add no new dependency if it can be avoided, use the fewest files possible, and prefer boring over clever.
- Don't be lazy about input validation at trust boundaries, error handling that prevents loss of funds or records, security, accessibility, or anything this prompt asks for.
- Every piece of non-trivial logic leaves one runnable check behind: the smallest test that fails if the logic breaks.
- Mark any deliberate shortcut with a known ceiling with a `ponytail:` comment naming the ceiling and the upgrade path.
- Question the spec where it is heavier than it needs to be, but do not drop any constraint in section 1 or any requirement in section 2.
