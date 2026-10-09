# Deblock Card: research log

Checked: 2026-10-07.

## Type decision: incumbent

The card is a Visa debit card on Deblock's own e-money account (Deblock SAS is the EMI and says it is a direct Visa member). The self-custodial crypto wallet uses device-generated seed phrases and is not in the card path. I found no contract or public repository needed to run the card.

## Searches

- GitHub: org `DeblockApp` exists with 0 public repos and no link to deblock.com. `deblock-io`, `deblock-tech`, `deblockio`, `deblock-finance`, `deblock-com`, `deblockhq` and `deblock-labs` do not exist. Repo search "deblock" returns image-deblocking projects.
- deblock.com: legal notice and legal agreements (server-rendered; EMI ACPR CIB 17748, AMF CASP A2025-001), cards page ("direct VISA member"), self-custody page (split-key seed recovery, gas airdrops, supported networks), FAQ. The Terms, privacy policy and complaints policy are fetched client-side from a Deblock API with a bearer token embedded in the page script. WebFetch saw only the title. I did not use the token, so those documents were not read.
- app.deblock.com bundle (84 chunks): Sentry, enabled outside localhost; Intercom; Google Tag Manager; Fireblocks key-format helpers; KYC match endpoint. No contract addresses beyond library constants. Disclosure could not be checked against the unread privacy policy, so P1 stays unknown.

## Judgment calls

- C2, C3, F1 = 0 and S1 = 1, S4 = 0 from the legal notice (documented). The cards page is the provider's own claim and is used only to support these low scores.
- C1, C4, P1, P2 and P4 are unknown because the Terms and privacy policy were unreadable without the embedded API token.
- O2 unknown: the `DeblockApp` org cannot be attributed to Deblock from a primary source.

## Availability 2026-10-09

No `availability` block: I found no first-party statement of which countries the Deblock account or card is offered in, or not offered in.

- The Terms (where an eligibility clause would be) are still unread. They load from the Deblock API with an embedded bearer token, which I did not use.
- deblock.com/en/frequently-asked-questions renders client-side from deblock.com's public `/api/intercom/collections` route, which needs no token. It mirrors the Intercom help centre at https://intercom.help/deblock/en. I read all 32 collections and the bodies of all 181 articles. None lists supported or prohibited countries. Related statements, none of them an availability list:
  - "Do my cards work in all countries?" is about card acceptance abroad over Visa, not eligibility.
  - Card and Apple/Google Pay top-ups need a personal card issued in the EEA.
  - PayPal top-ups are for accounts registered in Germany or Italy only.
  - XPF display, Moana/Teitei cards and Nameless Cards are for French Polynesia, New Caledonia and Wallis and Futuna.
  - Insurance cover depends on country of residence.
- Also checked: deblock.com/en home, /cards ("Pay with your Deblock card in any country" is about spending, not eligibility), /pricing-plans and /contact-us. None names eligible countries.
- The site has locales for fr, en, es, de, pt, it, pf (French Polynesia) and nc (New Caledonia). That suggests a France/EU and French Pacific market, but it is inference, not a statement, so it is not used.

## Operational 2026-10-09

File: `data/operational/deblock-card.yaml`. No bot facts existed; none were written for B2.1, B2.3, B8.2 or B9.x.

- **Sources read** (curl, UA `crops-dashboard-validator` or `crops-dashboard-research`, no token):
  - deblock.com/en/legal-notice, /pricing-plans, /cards, /about-deblock, /press (/en/security is 404)
  - all 274 help articles reachable from the 32 public Intercom collections (intercom.help/deblock, listed by deblock.com's public `/api/intercom/collections` route)
  - status.deblock.com, /incidents and the incident pages for 2025-12-12, 2025-12-19, 2026-02-04, 2026-08-04, 2026-09-04 and 2026-10-02
  - REGAFI open-data API (www.regafi.fr/api/explore/v2.1, datasets prd-banque-entites, prd-banque-autorisations, prd-banque-passeports-sortants)
  - ESMA interim MiCA CASP register CSV
  - recherche-entreprises.api.gouv.fr for SIREN 948264163
- **Client Terms found without the token.** The public help article "Why did you close my account?" links the Client Terms v12.3 (23 Feb 2026) as a PDF on cdn1.deblock.com. I read it (51 pages) and archived the excerpts used to `data/archive/deblock-card-ops-terms.txt`. The terms say an account needs legal residence in France; this is a first-party eligibility statement the 2026-10-09 availability pass did not have, so the provider file's missing `availability` block could now be filled (not done here: out of scope).
- **Registers.** REGAFI lists DEBLOCK (CIB 17748, LEI 254900XTUI35BGIBXP21) as an e-money institution authorised on 2023-11-22, active, with free-provision passports into 29 other EEA states from 2024-09-04. ESMA's CASP register lists DEBLOCK SAS as authorised by the AMF on 23/05/2025. Both licences are `holder: provider`, documented from the registers.
- **Judgment calls**
  - `custody_model: provider_custodial` from S1 (e-money). The MPC crypto wallet (one key shard on Deblock's backend, Deblock may refuse to co-sign) is outside the card path and only noted.
  - `first_deployment` is the ACPR authorisation date (a regulator date), because no dated launch announcement was found.
  - `cashout` countries are `FR` only, from the French Terms; the note records the German PayPal clause, the 29 passports and the French Pacific locales.
  - Fees: the cards page says 0% FX on card payments abroad, but the help article charges Standard users 0.5% or 1% beyond 500 EUR a month. Both are recorded, and the help article is used for the value.
  - Incidents are major status-page incidents that touched card payments or all services. The 2026-09-04 Visa settlement incident is `funds_lost: no` on Deblock's own statement.
  - B6.3 and B12.1 are unknown: the privacy policy, which would hold retention periods and automated decision-making, still loads only through the token API.
- **Validator:** `--offline` 0 errors. Online: 0 errors on the first run. On later runs, Node's fetch timed out connecting to several hosts, because this machine's TLS connect time (about 0.29 s) exceeds Node 22's 250 ms happy-eyeballs attempt timeout. With `NODE_OPTIONS="--network-family-autoselection-attempt-timeout=3000"`, online validation returns 0 errors.
