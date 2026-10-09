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

## Availability 2026-10-09

- Sources (both server-rendered, fetched with curl, quotes checked live): Help Centre "Where do I need to live to hold money with Wise?" (`/help/articles/2813542`), a table of 80 countries and territories with per-country restrictions; and "Where can I use Wise?" (`/help/articles/2978049`), which says "You can hold money if you live in a country where you can open a Wise account" and lists the places Wise does not serve at all.
- Model `allowlist`: the 80 entries as `EEA` (all 30 EEA states are in the table) plus 50 ISO codes. French overseas departments and collectivities in the table (GF, GP, MQ, RE, YT, BL, MF, PM) are listed by their own codes.
- Judgment calls: "where accounts can be opened" is read as the hold-money list, because Wise's own page equates the two. Registering and sending is wider ("from most countries"), so the no-service list (21 countries plus five Ukrainian regions) goes in `note` rather than turning this into a blocklist. Per-country limits (Nevada excluded; HK business-only; BH, IL, MY personal-only; BR BRL residents only; IN only while travelling; TH issuance paused) are kept in `note`, and those countries stay listed because Wise's table lists them. The card list (help article 2968915) is narrower and not used. I read only the UK (`/gb/`) help pages; regional sites may differ.

## Operational 2026-10-09

File: `data/operational/wise.yaml`. The repo-facts bot entries (B2.1, B2.3, B8.2, B9.x) were left untouched.

- **Sources read** (curl, UA `crops-dashboard-validator`, all 200):
  - wise.com/gb/pricing/, /gb/pricing/send-money and /gb/pricing/card-fees
  - wise.com/security and /.well-known/security.txt
  - wise.com/gb/about/our-story
  - UK personal terms and UK personal privacy notice
  - docs.wise.com developer.md, auth-and-security.md and client-credentials-token.md
  - status.wise.com and its /api/v2/incidents.json
  - the Evolve Bank help article
  - Companies House 07209813
- **FCA Register** (register.fca.org.uk) is a client-rendered Salesforce app, and its JSON API needs a key. I found the firm page (id 001b000001EjC6SAAV) by searching FRN 900507 in the browser pane, read the rendered text and archived an excerpt to `data/archive/wise-ops-fca-register.txt`.
- **ISO 27001.** wise.com/security links a certificate PDF (`/gateway/v1/iso-certificate`) that expired on 2026-08-03. The certifier's public directory (Coalfire Certification, client-directory.html, which loads `/data/data.json`) lists Wise Payments Ltd, certificate 2020-080301, latest 06/30/2026, expiring 8/3/2029. I fetched the renewed certificate PDF from the certifier and archived its text to `data/archive/wise-ops-iso27001-certificate.txt`. I recorded B1.1 and B1.2 as evidenced from the certifier directory, not from Wise's statement.
- **Judgment calls**
  - `first_deployment`: Wise's own page gives only the year ("launched in 2011"). The date is recorded as 2011-01-01 and flagged as a placeholder in `what`; January 2011 appears only in secondary sources.
  - Incidents: the Evolve Bank breach (Wise notice, dated by "resolved in July 2024"), plus the two broadest outages in the status API's 50 most recent incidents. Funds lost is "no" for Evolve, because Wise says its systems were not affected, and unknown for the outages.
  - B2.2: evidenced as "timely, no timelines" rather than unknown, because the privacy notice states a position.
  - B3.1: unknown, because the only notification clock found (one business day) is in the Hong Kong acquiring terms.
  - B5.3: tokens last 12 hours, above the partner's cap; recorded as found.
  - Fees and cash-out are UK personal prices. ALL in cash-out refers to the availability list.
- **Validator:** `--offline` 0 errors; online 0 errors.
