# Design prompt: an operational and procurement layer for the Payment Rails CROPS Dashboard

You are designing and planning, not yet building, a second layer of assessment for the Payment Rails CROPS Dashboard (`github.com/zulu0echo/crops-dashboard`). The existing layer rates rails on CROPS properties (Censorship Resistance, Open Source and Free, Privacy, Security). The new layer answers the questions an institution's procurement, finance, security and compliance functions ask next, and it lives in its own section, visually and structurally separate from the CROPS ratings.

Two kinds of source shape it:

1. The maintainer's list of operational facts: fees, licensing and custodial model, cash-out options per country, provider maturity, and transacted volumes (verified only).
2. The vendor requirements of a large UN humanitarian agency (called "the partner" in this repository, which is public). Three partner documents define them, held outside the repository at `~/Claude/Projects/coordination network/github-import/`: the partner's software development best practices (13 pages, dated 2026-08-03), its Authority to Operate (ATO) requirements sheet (v2.3, about 115 controls), and a Technical Architecture Document (TAD) template example. Appendix A summarises the controls so the design can be done without those files; read them if you have access. Do not copy them into the repository or name the partner in anything committed.

Read the repository first: `README.md`, `CONTRIBUTING.md`, `data/criteria.yaml`, `schema/provider.schema.json`, `scripts/validate.mjs`, `scripts/recheck.mjs`, `docs/methodology-red-team.md`, `docs/decisions.md`, and three provider files of different types (`data/providers/request-network.yaml`, `data/providers/gnosis-pay.yaml`, `data/providers/m-pesa.yaml`). The new layer must fit the evidence discipline those files establish. Where this document says "must", it is an acceptance test for the design. Where it leaves a choice open, propose an answer with its reasoning and list it under decisions for the maintainer (section 10).

Your output is a design document and an implementation plan (section 9), not code.

---

## 1. Constraints the design must satisfy

1. **A separate section.** The layer has its own heading, tables and pages. It never feeds into a CROPS pillar, no number combines the two layers, and there is no composite score or ranking. A reader must be able to read either layer without the other. On the overview, it is a distinct view or a clearly separated block, never extra columns in the CROPS table.
2. **Same evidence discipline.** Every fact carries an evidence item with a tier (`verified`, `documented`, `claimed`), a `checked_at` date, a URL, and for onchain facts a block or slot. The caps are the same: a vendor's statement establishes nothing on its own. `recheck` is required wherever the dashboard already requires it.
3. **Facts before ratings.** Most of this layer is quoted or measured facts (a fee schedule, a licence number, a certificate, a volume), not 0–3 scores. Introduce a rating only where four anchors can be written that a stranger would apply the same way, and justify each one.
4. **Five states, kept apart.** `evidenced`, `attested` (the provider states that a document exists and is available under NDA or on request; nobody outside has seen it), `unknown`, `absent` (evidence that the thing does not exist), and `not applicable` (there is no party to whom the control applies; see constraint 6). Each is stored and displayed differently. "Attested" exists because SOC 2 reports, penetration-test results and insurance certificates are routinely available only under NDA; recording them as unknown would be wrong and recording them as evidenced would be worse.
5. **Verified volumes only.** A volume appears only when derived from public chain data by a reproducible query that CI or a reviewer re-runs. Provider-reported figures, press figures and analytics sites are not volumes. If you propose a separate "reported" field it must be visibly distinct and never fill the volume cell.
6. **Operator-dependent controls are not applicable to operator-free rails, and the design must say where the burden goes.** Most partner controls (certification, hosting hardening, access reviews, incident reporting contracts) assume a vendor that operates a service. For a rail with no required operator (several privacy protocols and checkout rails in this dataset), those controls do not apply to the rail; they apply to whoever an institution chooses to run the client, node or relayer, which may be the institution itself. The design must represent this honestly: "not applicable: no operator; the deploying institution holds this control" is a different state from "the vendor failed to certify", and the layer must not let the second look better than the first or the reverse.
7. **Reviewable per fact.** Each fact carries `assessed_by` and `review`, like a rating cell, so the pending-review banner counts it.
8. **Freshness.** Fees, licences, certificates and cash-out partners change without notice. Each fact has its own `checked_at` and staleness window; the nightly job re-checks whatever can be re-read mechanically (onchain fee parameters, volumes, registers and certificate directories with stable URLs).
9. **Country-aware.** Cash-out options and licences are per country. Reuse `data/regions.yaml` and the Countries pages.
10. **No new runtime dependencies in the site**, no client-side JavaScript, no third-party requests. Volume queries run in CI or the nightly job, never in the browser.

## 2. Criteria group A: operational facts

For each criterion, the design states the exact fields; what evidence qualifies at each tier; what counts as unknown, absent and not applicable; the freshness window; whether it is a fact or a rated item (with anchors if rated); and how it is displayed and exported. You may add, merge or drop criteria with reasons.

### A1. Fees

What a payer and a payee pay, decomposed so two rails compare on the same basis: protocol or provider fee (fixed, percentage, who pays, where enforced); network cost (chain, dated sample); FX or spread (and whether the rate source is disclosed); card and scheme fees (interchange, FX mark-up, ATM, periodic); cash-out fee (link to A3); minimums, maximums and limits. Evidence: fee parameters read from contracts (verified); a pricing page or terms with a quote (documented); anything else (claimed). State how to handle fees set by partners or varying by tier. Include a worked example costing a 1,000 USDC merchant payment and a 100 USDC remittance end to end for three rails of different types, showing which inputs were unknown.

### A2. Licensing and custodial model

Two facts, kept apart:

- **Custody model.** Who holds funds at rest and in flight: self-custody, provider-custodial, hybrid (self-custody with a provider-controlled spend path), or unknown. For onchain rails this is verified from contracts and chain state and must agree with the CROPS S1 evidence; reference those items rather than copying them. For incumbents it is documented from terms. "Self-custody" in marketing is a claim.
- **Licences and registrations.** Per entity and per country: regulator, licence type and number, activities covered, date checked, from the regulator's own register where one exists (documented, primary). The provider's "we are licensed" page is a claim unless it links to the register. State how to show a licence held by a partner (issuer, EMI) rather than the provider, and how to show that the provider itself holds none.

The existing `context` field holds some of this in prose; propose whether to migrate it into structured fields or keep both.

### A3. Cash-out options per country

For each country where the rail is offered (from `availability`): how a payee turns a balance into local money (bank transfer, card withdrawal, ATM, cash agent, mobile money, P2P, none), which partner provides it, the stated fee and limits, and the evidence. Design the data so a country page can show, for every rail offered there, whether cash-out exists and at what stated cost, without hand-writing a row per rail per country where the provider's documents state a region-wide option. An off-ramp partner is a component (reuse `components`); its own licence (A2) and availability may differ from the rail's.

### A4. Provider maturity

Dated, sourced facts only: first mainnet deployment of the settlement contracts (block and date, verified) or launch date from a primary source for incumbents; operating entity (legal name, jurisdiction, company-register entry; "undisclosed" is a recorded state); security incidents and outages with primary post-mortems and whether user funds were lost (absence of a found incident is not evidence of none; say how that is displayed); product changes that affect users (closures, migrations, relicensing). Audit history stays in CROPS S6; link, do not duplicate. No age score; explain why years of operation and incident counts are shown side by side rather than combined.

### A5. Volumes transacted (verified only)

For onchain rails: a reproducible query over fixed windows (for example 30 and 365 days ending at a pinned block) counting settlements and summing amounts per token through the contracts in the provider file, with the method stated (events, addresses, treatment of multi-hop and bridged flows, normalisation to a reporting currency from an onchain price source or none, exclusions). Address self-transfers, wash activity and test transactions (label the figure "gross observed"); rails whose settlement is not observable (relayer-batched, private pools, card settlement into one treasury address), shown as "not observable" rather than zero; incumbents, shown as "not verifiable"; and cost, since public RPC log-query limits blocked several reads during research (block-range chunking, a fork-configured archive node, or a committed precomputed dataset with its query).

### A6. Candidates to accept or reject with reasons

Settlement time to finality for the payee; supported currencies and tokens (partly in C5 evidence); dispute and chargeback handling; support channels and SLAs; uptime; integration effort (SDK languages, sandbox, API gateway exposure). Keep only what can be evidenced under section 1.

## 3. Criteria group B: institutional due diligence (derived from the partner's vendor requirements)

The partner's ATO sheet and development practices are written for software the partner procures and hosts. Most controls cannot be verified by a third party and several are partner-internal (corporate SSO, the partner's asset registry, its hosting accounts, its SIEM). The design must translate them into what an outside assessor can record about a payment provider, in the five states of constraint 4, and must state for every control whether it applies to custodial operators only, to any operator, or to nobody when the rail has no operator (constraint 6). Appendix A lists the source controls by family with their identifiers where the sheet gives them. Propose the subset to carry, grouped as below, and reject the rest with one line each.

### B1. Assurance and certifications

ISO 27001 of the developer and of the hosting provider (verifiable through the certifier's public directory or the certificate number, which makes `documented` possible without the provider's word); SOC 2 Type II or ISAE 3000/3402 reports (usually `attested`); independent source-code security review before go-live; penetration testing before go-live and at least every three years; application and platform vulnerability scanning every six months; OWASP mobile standards for mobile apps. For protocols, CROPS S6 already covers audits; link rather than duplicate, and record bounty and disclosure policy once.

### B2. Vulnerability and patch management

A documented emergency patch process; patch service levels (the partner's are critical within 30 days, high within 40, medium within 90); a public security contact and disclosure policy (`security.txt`, `SECURITY.md`); dependency and vulnerability scanning visible in CI for public repositories (`verified` from the repository).

### B3. Incident reporting and continuity

Contractual commitment to report security or data incidents within 24 hours; daily backups, quarterly restore tests and an approved recovery plan (custodial operators only; for a non-custodial rail the continuity question is the CROPS S4 walkaway test, which must be linked, not repeated); status page and incident history with primary post-mortems (link A4).

### B4. Identity and access (operator side)

MFA for end users and for privileged accounts; lockout after repeated failures; unique personal IDs; segregation of duties; joiner-mover-leaver controls; periodic access reviews (annual for users, six-monthly for privileged accounts); privileged access on separate accounts and removed on contract end; session timeout; password storage with salted SHA-2 or better. For card and custodial products this is `documented` from security pages at best and `attested` otherwise; for operator-free rails it is `not applicable` with the burden stated.

### B5. API and integration

Authentication methods for browser-to-server (OAuth 2.0, OpenID Connect, SAML, JWT) and server-to-server (keys or PKI); token expiry (the partner caps it at 120 minutes for public-classified data and 30 minutes otherwise); non-expiring tokens prohibited; export APIs that limit volumes and log exports; exposure through an API gateway. Much of this is `verified` from public SDKs and API references and should be cross-referenced with CROPS S5 and O4 rather than duplicated.

### B6. Data protection and privacy governance

Data classification; encryption at rest and in transit (TLS 1.2 or better); no production data in non-production environments; anonymised test data; data retention and deletion on termination; data processing or sharing agreements available; a completed data protection impact assessment for systems holding personal data; controller and processor defined; PII handled under the UN privacy principles. CROPS P2 records what is collected; this group records how it is governed. State the boundary so the two never contradict each other.

### B7. Logging and monitoring

Account changes, logins and logouts, and user activity logged with timestamp, origin and result; audit-log retention; logs sent to a managed SIEM; endpoint detection on all platforms. Operators only.

### B8. Hosting and network

Hardened builds to a recognised benchmark; only essential ports open; IDS or IPS; a WAF in front of internet-facing applications; database reachable only from application servers; development environments not internet-facing; tenant isolation; anti-malware. Operators only; for self-hostable rails, record instead whether the repository ships a hardened deployment configuration and infrastructure as code.

### B9. Engineering practice observable in public repositories

The partner's development practices require: a releasable default branch; protected branches with required reviews and passing checks, no direct push, no force-push; no committed secrets; a documented branching model (required to be in the README or contribution guide for open-source releases); meaningful commit messages; immutable version tags and semantic versioning; CI on every pull request with linting, static analysis, unit tests (85% coverage expected), integration tests, dependency and vulnerability scanning and build validation; build once and promote the same artifact; automated production deployment with recorded approval; infrastructure as code; a changelog; documentation kept with the change (README, API contracts, decision records, configuration, schemas, runbooks); release classification and a rollback strategy. For any provider with public repositories every one of these is `verified` or `absent` from the repository itself, which makes this the one group where operator-free rails can be assessed as fully as vendors. Propose the exact checks, which can be automated in the nightly job (branch protection and required checks are readable from the GitHub API; coverage from CI artifacts; signed tags from the repository).

### B10. Architecture documentation

The partner requires an approved TAD covering logical, infrastructure and integration architecture and the list of building blocks, plus registration of the solution in its asset registry. Record whether the provider publishes an architecture document of equivalent content (verified from the repository or documented from a docs site), and what it covers; the registry item is partner-internal and dropped.

### B11. Commercial and financial

Operating entity and contracting party (link A4); evidence that ongoing operating and maintenance costs are funded (for open-source rails: foundation, grants, fee switch, or none disclosed); insurance where attested; termination terms including data removal. Reject anything here that cannot be evidenced from a primary document.

### B12. AI components

The partner's AI controls (monitoring, validity, safety, transparency, privacy, fairness, override and decommissioning procedures, pre-trained model monitoring) apply only if the rail uses an AI system in the payment path or in compliance decisions (for example automated transaction screening). Record whether it does, from code or policy, and apply the controls only then.

## 4. How the two groups and the CROPS layer relate

State explicitly, with a diagram if useful, which facts in this layer reference CROPS evidence (S1, S4, S5, S6, O4, P2) and the rule that prevents the same fact being scored in one layer and recorded differently in the other. Also state the reading order the site should imply: CROPS answers "can this rail's behaviour be verified and does it hold the properties"; group A answers "what does it cost and where does it work"; group B answers "what would my own due diligence find, and which controls fall to me if there is no operator".

## 5. Data model

Propose the schema. Decide and justify: whether the layer lives in the provider file under a new top-level key or in a parallel file `data/operational/<slug>.yaml` (consider independent review and freshness, diff noise, reviewers with different expertise, and that group B reviewers may be security or procurement people rather than protocol researchers); how per-country facts (A2, A3) are stored without repeating availability lists; how a fact references an existing CROPS evidence item; how the five states are encoded; the validator rules with the error message for each and the self-check cases that prove them; what the nightly job re-reads and how drift is shown.

## 6. Site

Describe the pages and components in the existing design language (static, no JavaScript, phone-width safe): a separate section on the overview or a separate "Operational" view, and why; the provider page section, placed after the CROPS ratings and visually distinct; the country page additions for cash-out and licences; a fee comparison view, if any, and how it avoids implying a ranking; how volumes show their window, method and pinned block next to the number; how "not applicable: no operator" is displayed so it reads as a shift of responsibility, not a pass or a fail; exports (`data.json`, CSV) for the new fields.

## 7. Automation

CI rules on pull requests; the nightly job's re-checks for this layer (repository settings and CI results for B9, certificate directories for B1, registers for A2, volumes for A5) and their cost in API and RPC calls; the volume pipeline (where it runs, how often, how results are pinned and committed, how a reviewer re-runs one provider's query locally).

## 8. Red team the design before proposing it

List how each criterion could be gamed or misread and what the design does about it. Start with: volumes inflated by self-transfers; fees hidden in spreads or partner charges; licences from registers that are weak or not checkable; certificates that cover a different legal entity or scope than the product; "attested" drifting into being read as "evidenced"; "undisclosed entity" treated as neutral; incumbents and large vendors looking mature and well-controlled by default while an operator-free protocol shows a column of "not applicable"; cash-out listed for a country where the partner has withdrawn; and the risk that a facts layer with many filled cells makes an unreviewed CROPS rating look more authoritative than it is.

## 9. Deliverables

1. `docs/operational-layer-design.md`: the design covering sections 1 to 8, with a decision table at the end (decision, options, recommendation, what it hinges on).
2. `docs/operational-layer-plan.md`: the implementation plan as ordered small steps, each with its acceptance test, a migration plan for the existing providers in the order that gives readers the most value first, an updated research brief section in the style of `docs/seed-brief.md`, and an effort estimate per provider type.
3. A draft `schema/operational.schema.json` (or additions to the provider schema) and the validator rules in prose with their self-check cases.
4. A control crosswalk: every partner control from Appendix A mapped to a group B criterion, "linked to CROPS criterion X", or "rejected: reason", with the applicability class (custodial operator, any operator, none).
5. Three worked example records, one each for a checkout rail with no required operator, a card product, and an incumbent, with every field evidenced, attested, unknown, absent or not applicable, so reviewers can see what "done" looks like, including what "not applicable" looks like next to "attested".

Do not write site code, scripts or provider data in this task. Do not change any existing CROPS rating or file. Do not commit the partner's documents or name the partner.

## 10. Decisions for the maintainer

Collect every open choice here with your recommendation. Expected entries include: file layout (5); whether any criterion is rated rather than shown; the volume window and currency normalisation; how to treat partner-held licences and certificates; whether provider-reported figures are stored at all; the staleness window per criterion; whether "attested" items can be re-checked at all and how they expire; which B9 checks are automated; and whether the layer is shown by default on the overview or behind a view switch.

## 11. Working style

Pick the simplest design that satisfies section 1; the best schema is the one with the fewest fields that still forces evidence. Reuse what exists (`components`, `availability`, `context`, `regions.yaml`, the evidence item shape, the review fields) before adding anything. Where you cut a corner with a known ceiling, say so and name the upgrade path. Question this prompt where it is heavier than it needs to be, but do not weaken section 1.

---

## Appendix A: the partner's vendor requirements, summarised

From the partner's development practices (normative MUST/SHOULD/MAY; project-specific security requirements and the partner's policies take precedence):

- Work is traceable from work item to branch, commit, pull request, pipeline run, artifact, deployment and release record. No individual is sole author, reviewer and production approver of a material change.
- Repository rules: default branch releasable; no direct pushes to protected branches; no force-push; no secrets, credentials, personal data or build output committed; least-privilege access reviewed periodically; meaningful commit messages, recommended `type(scope): summary [ticket]`; branching model documented in the README or contribution guide, especially for open source; immutable version tags, semantic versioning where compatible.
- Pull requests: small, linked to a work item, local checks run, tests for new behaviour and failure modes, documentation updated or justified; required approvals and passing checks enforced by repository settings; reviewers must not approve what they have not inspected.
- CI on every pull request: formatting and linting, static analysis, unit tests (85% coverage expected), integration or contract tests, dependency and vulnerability scanning, build and packaging validation, documentation or API-contract checks; pipeline fails on any mandatory gate; flaky tests tracked, never ignored; build once, promote the same immutable artifact; production deployment automated and approved by the business owner or delegate; infrastructure as code with plan-before-apply, secret handling, drift detection, state protection and rollback.
- Security minimums: no committed secrets; validate and encode untrusted input at boundaries; authentication, authorisation and least privilege; protect personal and sensitive data; maintained dependencies and runtimes with vulnerability scanning; security-relevant logging without secrets or unnecessary personal data; specialist review for material security, privacy or data-model changes.
- Documentation kept with the change: README, API contracts, architecture and decision records, configuration, schemas and migrations, runbooks and rollback, user guidance.
- Releases classified standard, major or emergency; a release record identifying artifact, work items, test and acceptance evidence, window and people, migrations, monitoring, rollback and approval; smoke tests and monitoring after deployment.

From the ATO requirements sheet (v2.3), by family; each row is self-assessed and reviewer-assessed as compliant, partially compliant, non-compliant or not applicable with a justification:

- Architecture and registry: current logical, infrastructure and integration architecture; list of architecture and solution building blocks; an approved TAD; registration in the partner's solution registry (partner-internal).
- Change and release: testing and approvals before deployment; formal version control with a changelog; standard CI/CD tooling; stated URLs for production, development and test.
- Platform standards (partner-internal preferences): partner-managed hosting; standard database, container, server-side, front-end and mobile stacks.
- API and integration: exposure and consumption through the partner's API gateway; export APIs limit volumes and log exports; no non-expiring tokens, expiry at most 120 minutes for public-classified data and 30 minutes otherwise; browser-to-server authentication by OAuth 2.0, OpenID Connect, SAML or JWT; server-to-server by keys or PKI certificates.
- Identity and access: annual review or recertification of end-user access; partner SSO for staff and partner CIAM for external users (partner-internal); personal unique user IDs; controlled allocation of credentials; password content and expiry rules; MFA for end users and for privileged accounts; lockout after five failed attempts; local password stores hashed with SHA-2 (256 or above) plus HMAC and a unique salt; a documented segregation-of-duties model reviewed annually; joiner-mover-leaver controls; identity changes only on authorised requests; privileged accounts recertified six-monthly, created through the partner's workflow, removed when no longer needed or on contract end, and separate from daily-use accounts; access rights authorised by the data controller.
- Data protection: encrypted backups; unprivileged runtime accounts; data classification (strictly confidential, confidential, internal, internal UN, public); encryption at rest; no clear-text secrets in files or code; TLS 1.2 or better in transit; database encryption; no production data in non-production environments; no real personal data in development and testing; separate production and non-production environments; documented standard operating procedures; no default passwords on supplier accounts; hardened builds to CIS or equivalent; endpoint detection and response reporting to a SIEM; secrets not hard-coded and held in a key-management service.
- Logging: account privilege changes, login and logout attempts (timestamp, origin IP, user ID, result), and user and system activity on important records, all in external log files; application audit logs retained; infrastructure, OS, authentication and threat logs to a corporate SIEM.
- Network: only essential ports open (80 redirect and 443 on the internet); IDS or IPS with real-time analysis; a WAF for internet-facing applications; minimised network ranges; database reachable only from the web tier on the database port; development environments not directly internet-accessible; the partner's service isolated from other customers.
- Vulnerability management: application software patched to policy; documented and evidenced emergency patch process; special-account secrets in a vault; anti-malware on all platforms; platform vulnerability scanning at least six-monthly by the partner or an independent provider with results shared; application-layer scanning at least six-monthly; secure protocol versions only; independent source-code security review before go-live; penetration testing before go-live and at least every three years; OWASP mobile standards for mobile apps; idle sessions terminated after 60 minutes.
- Third-party risk: ISO 27001 certification of the developer organisation and, in its own name and covering the offered operations, of the hosting and support organisation; supplier staff comply with the partner's security policies; contractual commitment to periodic SOC 2 Type II or ISAE 3000/3402 Type II assessments with annual access to reports; removal of all partner data on termination; reporting of actual or probable security or data-protection incidents within 24 hours; patch service levels of 30 days for critical, 40 for high and 90 for medium vulnerabilities.
- Continuity: daily data backups; quarterly tested infrastructure restores with a log; an approved recovery plan tested to the partner's service-continuity requirements; a managed network firewall or security gateway.
- Finance: the intangible asset value recorded in the solution registry; confirmation that ongoing operating and maintenance costs are understood and planned.
- AI systems, where used: functionality and behaviour monitored in production; validity and reliability demonstrated; safety and residual risk documented with monitoring and response times; security and resilience evaluated; transparency and accountability risks examined; the model explained, validated and documented; privacy risk examined; fairness and bias evaluated; respond-and-recover procedures for newly identified risks; mechanisms and responsibilities to supersede, disengage or deactivate the system; pre-trained models monitored; post-deployment monitoring plans including user input, appeal and override, decommissioning, incident response and recovery.
- Data governance: signed and current data-sharing agreements for all integrations with partners and suppliers; a completed data protection impact assessment reviewed by the data protection officer for systems holding personal data; data controllers and processors defined and documented; PII protected under the UN privacy principles; a data glossary and catalogue with a maintenance process; a data recovery process; formal management of data assets through removal, transfer and disposition; protections against data leaks.

The TAD template (v2.4 in the partner's current form) asks for the solution's logical architecture, infrastructure architecture, integration architecture and building blocks, a threat model and the security controls applied, and it is the document the ATO's architecture rows refer to. The example TAD in the partner folder was itself recorded as presented with unresolved technical comments, which is a reminder that the partner's process expects reviewer findings to be fixed, not just acknowledged.
