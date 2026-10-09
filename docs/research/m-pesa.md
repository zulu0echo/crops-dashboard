# M-Pesa: search log (2026-10-07)

Result: **incumbent**, as briefed. M-Pesa is a closed, custodial mobile-money ledger operated by Safaricom. The repos listed in the YAML are sample clients and callback listeners. They do not make the rail non-incumbent.

## Safaricom websites

- `https://www.safaricom.co.ke`, `safaricom.co.ke`, `/data-privacy-statement`, `/privacy`, `/dataprivacystatement`, the M-Pesa terms path, and `m-pesa.africa`: all return **HTTP 403** to curl (HEAD and GET). I made no attempt to get past it. As a result, Safaricom's data privacy statement and M-Pesa customer terms were **not read**, and anything that depends on them is unknown.
- **CI impact:** `website: https://www.safaricom.co.ke` was set as briefed. The online validator rejects it (403). The maintainer needs to decide whether to keep it or substitute `https://developer.safaricom.co.ke`.

## Daraja portal (developer.safaricom.co.ke)

- The site is a Next.js client-rendered app. `/`, `/apis`, `/faqs`, `/terms` and `/apis/<alias>` all return 200, but `/apis/<anything>` also returns 200 for nonsense aliases. The page body comes from `POST /api/graphql` with the query `populateApi(apiName: ...)`, which is the one the page's own bundle issues. I read docs that way for `CustomerToBusiness`, `MpesaExpressSimulate`, `BusinessToCustomer`, `AccountBalance` and `GettingStarted`. `getApis` lists 31 API aliases.
- Cited page URLs: `/apis/CustomerToBusiness` and `/apis/AccountBalance`. A reviewer re-checks them in a browser, or by replaying the GraphQL query.
- `https://developer.safaricom.co.ke/collections/Safaricom%20APIs.postman_collection.json` is a static file (200, Postman v2.1, `_postman_id 21f972ff-...`). Its path comes from the bundle's download helper. The docs say the collection needs a login, but the file is served publicly. It is the only fully fetchable interface artifact.
- The `/terms` and privacy links on the portal are also client-rendered. I did not read them.

## GitHub

- `github.com/safaricom` is an Organization with 15 public repos and blog `https://developer.safaricom.co.ke`. It is **not GitHub-verified**, and the Daraja portal does not link to it (I grepped the bundle and docs; no `github.com/safaricom`). Signs that it is official: commits from `safaricom.net` addresses in mpesa-php-sdk and mpesa-java-sdk, and the `composer.json` author `mnandwa@safaricom.co.ke`. Judgment call: I treated it as Safaricom's.
- Listed (non-fork, M-Pesa-related, pinned at default-branch HEAD):

  | repo | commit | license at commit |
  | --- | --- | --- |
  | mpesa-node-library | 678e3c33b20c1447c209eb88eded89f1bb751e11 | Apache-2.0 (LICENSE) |
  | LNMOnlineAndroidSample | 74eced63f0cd5fd2f9869f9fcaf9b14823dcadb8 | Apache-2.0 (LICENSE) |
  | mpesa_c2b_php_confirmation_validation | 96a55227d6191c0717edb0293bbd4c3bde1709c1 | GPL-3.0 (LICENSE) |
  | mpesa_listener | ccc202b610f5cda15d3efae90501f84bc11e1208 | no LICENSE; package.json says ISC (npm default) |
  | mpesa-php-sdk | 5effb808e79ba6b3d8631ef83c2b9b31fa450152 | no LICENSE; composer.json says "mit" |
  | mpesa-java-sdk | 0a3667515b2d8b4abff7a454e8d2934cdb3c1d18 | none |
  | mpesa-api-C-Sharp | 7f3d6e9e9c979c79e4c5bedd43de646623a4d6cd | none |

- Excluded: forks of third-party code (android-daraja-sdk from jumaallan, mpesa-py from Arlus, mpesa-api-go, Mpesa.Net), non-M-Pesa repos (kubernetes, kubespray, cisco-anyconnect), and the empty mpesa-perl-sample.
- Other names checked: `SafaricomPLC` (an org with 0 repos), `mpesa`, `m-pesa`, `daraja` (users with 0 repos); `Safaricom-Ltd`, `safaricom-developers`, `safaricomltd`, `safaricom-daraja` (404).

## Chains

None. M-Pesa does not claim onchain settlement, so I ran no explorer search.

## Scoring judgment calls

- **C2 = 0, C3 = 0.** Every operation in the Postman collection is a Bearer-authenticated POST to `api.safaricom.co.ke` / `sandbox.safaricom.co.ke`. Shortcodes, credentials and validation enablement are provisioned by Safaricom.
- **O2 = 1.** Only SDKs and samples are public (verified repo listing).
- **O4 = 1.** The API is documented through the hosted docs and the Postman collection, not versioned in a repo, and no payee export format is specified.
- **F1 = 0.** Java and C# SDK repos have no license at all. Listener and PHP declare a license only in a manifest, with no license text; I recorded them as `none` in `repos` because CONTRIBUTING treats a license without a LICENSE file as a claim. No repo can run the product.
- **P2 = 1, not 0.** C2B callbacks give the payee the payer's registered first, middle and last name plus a masked MSISDN (v2), or a SHA-256 of the MSISDN (v1, which can be reversed by enumerating phone numbers). Settlement does not need this, and it is disclosed in the integrator docs. The payer-facing privacy statement was unreadable (403), so I could not confirm undisclosed collection. Lower anchor not taken because nothing read shows non-disclosure. A reviewer with browser access to the privacy statement should re-check.
- **S1 = 1.** Funds move wallet to shortcode on M-Pesa, and balances are held on M-Pesa (C2B and Account Balance docs). Disclosed provider custody.
- **S4 = 0.** Derived: S1 = 1, C2 = 0, C3 = 0, O3 unknown.
- **S5 = 0.** Admissible lowering evidence. The C2B docs specify callbacks as a plain JSON POST to merchant URLs, with no signature, HMAC or shared-secret field or header (the only controls are HTTPS in production and URL keyword rules). The reference handlers at pinned commits (`mpesa_listener/listener.js` L66-L82, `mpesa_c2b_php_confirmation_validation/confirm.php` L1-L33) accept callbacks without any authenticity check.
- **Left unknown:** C1 (account freeze and termination terms unreadable), C4, C5, O1, O3, F2, F3, P1, P3, P4, P5, S2, S3, S6.

## Migration 2026-10-07

Migrated to the post-red-team evidence rules (docs/seed-brief.md, final section).

- **Quotes and archives.** Every `kind: document` item now has a `quote`. The Postman collection is a static JSON file, so its quotes (request URLs and `_postman_id`) are checked live. The Daraja `/apis/CustomerToBusiness` and `/apis/AccountBalance` pages are client-rendered, so I saved the text I read to `data/archive/m-pesa-daraja-c2b.txt` and `data/archive/m-pesa-daraja-account-balance.txt` and set `archive` on those items. Each file opens with a header naming the request: `POST https://developer.safaricom.co.ke/api/graphql`, query `GetApiDocumentation` / `populateApi(apiName)`, made 2026-10-07. Below the header is the `data.populateApi.markdown` field of the response, verbatim. The S5 item now quotes the docs' statement that callbacks are a plain POST in application/json.
- **`by`.** The file has no `tier: claimed` items.
- **Components.** Added 13. Closed (`public: false`, proprietary, operated by Safaricom unless noted):
  - M-Pesa core ledger (`required: true`)
  - M-Pesa customer register / KYC (`required: true`; the C2B payload returns names "as per the M-Pesa register", and NPS Regulations reg 12 requires the register)
  - Daraja API gateway and OAuth
  - customer channels (SIM Toolkit, USSD, apps)
  - M-PESA Org portal
  - the trust fund (trustees and banks unnamed)

  Public (`required: false`, licences as in `repos`, operator recorded as github.com/safaricom with the existing attribution caveat): the seven SDK/sample repos.
- **Context.** Two CBK primary sources, both read 2026-10-07:
  - The Directory of Authorized Payment Service Providers as at August 10, 2026 lists Safaricom PLC, first licensed January 1, 2016, for mobile money.
  - The National Payment System Regulations, 2014 (CBK-hosted PDF):
    - reg 25(3): a Trust Fund that is never less than what is owed to customers, not commingled, and placed in licensed banks or government securities
    - reg 29: audited Trust accounts and a system security audit
    - reg 10: on revocation, CBK takes over to distribute the Trust Fund, and any shortfall is recoverable from trustees
    - reg 12: a customer register with IPRS-verified ID
    - reg 31: AML/CFT transaction screening

  These are recorded as legal requirements. I read nothing that confirms Safaricom's own arrangement, because safaricom.co.ke returns 403. Kenya Law (new.kenyalaw.org, kenyalaw.org) also returned 403, so I used CBK's copy of the Regulations.
- **C4: stays unknown.** The new anchors were applied, but I found no readable Safaricom disclosure of filtering. I fetched all 31 Daraja API docs via `populateApi` and searched them for sanction, AML, blacklist, watchlist and KYC. The only hits were KYC fields for organisation operators and the C2B error `C2B00014 Invalid KYC Details`. The customer terms and privacy statement remain 403. Reg 31 requiring screening is context only and is not a disclosure by the provider. I added a finding to the cell explaining this.
- **P2: 1 -> 0.** C2B callbacks pass the payer's register name and a masked MSISDN (v2), or an enumerable SHA-256 of it (v1), to every payee. Under the new anchors, 1 needs collection beyond settlement needs "disclosed in a policy", and 0 covers undisclosed collection or collection beyond the stated legal requirement. The only disclosure I read is the integrator documentation, and I read no stated legal basis for giving payer names to payees. Reg 12 requires Safaricom to keep the register; it does not require sharing it. Judgment call: following the brief's lower-anchor rule, I took 0 because the evidence for 1 was not seen. A reviewer who can read the privacy statement and finds a disclosed legal basis for this sharing could restore 1.
- No other score changed. Validator: `node scripts/validate.mjs --offline data/providers/m-pesa.yaml` and `GITHUB_TOKEN=$(gh auth token) node scripts/validate.mjs data/providers/m-pesa.yaml` both report 0 errors.
