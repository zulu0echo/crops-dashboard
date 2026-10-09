# Wise: search log (2026-10-07)

Result: **incumbent**, as briefed. Wise is a closed, custodial e-money ledger. Its public repos are integration samples and signing helpers; none runs the transfer rail.

## GitHub

- `github.com/transferwise` is the Wise org: GitHub-verified, blog `https://wise.com`, 223 public repos. I listed the non-fork, non-archived repos and kept the ones that touch the transfer API. Each was pinned at its default-branch HEAD and the LICENSE read at that commit:

  | repo | commit | license | role |
  | --- | --- | --- | --- |
  | digital-signatures-examples | c29c3625cbf2afe571b045cea2fd1a5d99764f6b | MIT | webhook verification and SCA signing examples |
  | digital-signatures | 7d37774454c57013f1183bf127d2889250b27ba2 | MIT | Java signing library and CLI |
  | public-api-postman-collection | 032ec3a052c0f42acfa061eb5f198aac1ee4cb46 (2024-07-24) | MIT | Postman collection |
  | banks-reference-android | 0ee72b0bf0ba15e9f14eadf6ff2fe32c5d79bcd6 (2021) | Apache-2.0 (LICENSE text; GitHub reports NOASSERTION) | reference bank integration |
  | wise-platform-samples | a7d09f2695b13adbe21fe0b0cb8ae603b983f0a8 | none (no LICENSE file) | OAuth and SCA samples |

- Excluded: data and infra tooling (pipelinewise*, wise-pizza, cicada, envoy-*, crypto helpers and similar), legal-terms (2021), and test or event repos.
- The docs link back to `transferwise/digital-signatures-examples`, which supports the attribution.

## Documents (curl, UA `crops-dashboard-validator`)

- `https://wise.com/gb/legal/terms-of-use-personal` (200, server-rendered). Clauses used:
  - 3.3: FCA EMI, FRN 900507.
  - 8.4-8.6: suspension, restriction, and closure without notice.
  - 9.2: withdrawal for 6 years after closure via support.
  - 12.2 and 12.4: Wise holds the funds; safeguarding; no FSCS cover.
  - 26.1: Wise claims exclusive property over "sample source code, and code libraries". This conflicts with the MIT and Apache licences in the repos; I recorded the repo licences as found and flagged the conflict in notes.
- `https://wise.com/gb/legal/privacy-notice-personal-en` (200). Sections 2-4 cover data collected and recipients, and 6.2 covers automated decisions. I picked the UK personal notices because the UK entity is the primary FCA-regulated one; other jurisdictions were not read.
- `https://wise.com/gb/legal/acceptable-use-policy` (200): sanctioned persons and countries are unsupported. No list source is named.
- `docs.wise.com` HTML pages are client-rendered: about 6 KB of visible text out of 1 MB of HTML. The site publishes Markdown copies (`llms.txt` and `.md` URLs), and those are cited: `guides/developer.md`, `guides/developer/webhooks/event-handling.md`, and `api-reference/balance-statement/tag.md`. `docs.wise.com/openapi.json` returns 404. A per-area OpenAPI exists only as hosted Markdown, not in a repo.

## Judgment calls

- **C1 = 0.** Unilateral, per-account suspension or closure. Notice can come after the fact, or not at all.
- **C2 = 0, C3 = 0, S4 = 0.** Everything goes through Wise's authenticated API and ledger. Safeguarding is recorded in `context` and not scored.
- **C4 = 0 vs 1.** The privacy notice admits fraud controls are not fully disclosed, and those controls can reject transactions. I took the lower anchor.
- **O2 = 1.** Only SDK-level samples and libraries are public. Scored the same way as M-Pesa.
- **O4 = 1.** The Postman collection in the repo is stale (2024) compared with the hosted 2026q3 reference. The statement export in open formats is documented only.
- **F1 = 0.** Closed required components, and wise-platform-samples has no licence.
- **P1 = 1, P4 = 1.** Disclosed by category in the privacy notice. SDKs and endpoints were not checked.
- **P2 = 0 vs 1.** Device, location and advertising data go beyond the legal requirement. Everything is disclosed, so 1 also fits; I took the lower.
- **S5 = 2.** Webhook signatures are verified in reference code at a pinned commit (verify-signature.js L17-L32). Credentials are scoped and rotatable per the docs. A 3 is barred: the components are closed and no trace was run, and client-bundle secrets were not inspected.
- **Left unknown:** C5, O1, O3, F2, F3, P3, P5, S2, S3, S6. Bug-bounty and audit artifacts were not searched in depth, and nothing was found in the repos.
