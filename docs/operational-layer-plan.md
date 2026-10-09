# Operational and procurement layer: plan

Status: steps 1 to 5 done on 2026-10-09; 6 to 9 open.

| # | Step | Acceptance test | Status |
| --- | --- | --- | --- |
| 1 | Controls list `data/operational-criteria.yaml`; schema `schema/operational.schema.json` | `npm run validate:offline` passes with an empty `data/operational/` | done |
| 2 | Validator rules and self-checks (states, refs, operator class, volume spec) | `node scripts/validate.mjs --self-check` prints ok; each rule has a failing case | done |
| 3 | `scripts/repo-facts.mjs` and `scripts/volumes.mjs` with self-checks | `npm test` runs both; `npm run repo-facts` fills B9 for every provider with GitHub repos | done (bot run in progress) |
| 4 | Site: Operational page, provider section, country cash-out column, exports | pages build with no third-party assets; phone width fits | done |
| 5 | Worked examples: Daimo Pay, Gnosis Pay, M-Pesa; docs (methodology 2.10b, CONTRIBUTING, brief, decisions) | the three files validate; a reviewer can see evidenced, attested, absent, N/A and unknown side by side | done |
| 6 | Nightly: run `repo-facts` and `volumes` in `recheck.yml` after the drift check; commit results through the bot PR | a scheduled run updates B9 facts and volume values without touching ratings | open |
| 7 | Volume specs for observable rails (Coinbase Commerce Transfers, Request Network fee proxies, Daimo manager events, Tornado pools) | `npm run volumes` computes each within the call budget or records why not | open |
| 8 | Research pass, group A and B, in waves of four providers | every provider has a record with no field left blank (unknown is a recorded state) | open |
| 9 | Review | reviewers listed in `docs/seed-review.md` for 2–3 ratings also cover operational facts marked evidenced | open |

## Research order (step 8)

Readers get the most from facts about rails that scored well on CROPS and from the incumbents they compare against:

1. Request Network, Coinbase Commerce, Tornado Cash, Daimo Pay (checkout and transfer rails with observable chains): group A fees, first deployment, entity, volume specs; group B is mostly N/A with a few `any` controls.
2. Gnosis Pay, ether.fi Cash, Exa, MetaMask Card, Payy, Fuse (cards with public code): licences (partner issuers), cash-out, incidents, and the operator controls from security pages.
3. M-Pesa, Wise, HesabPay, MiniPay (incumbents): licences from regulator registers, cash-out methods, operator controls from trust pages (mostly attested).
4. Remaining cards and privacy protocols.

Effort per provider: operator-free rails about 1 agent-hour (most group B implied); cards and incumbents 2 to 3 agent-hours (licence registers, trust centres, cash-out per region).

## Research brief

See `docs/seed-brief.md`, section "Operational and procurement layer".

## Control crosswalk

Every partner control family in Appendix A of the design prompt maps as follows. Families, not rows, because the sheet's rows are the partner's internal numbering.

| Partner family | Carried as | Dropped or linked |
| --- | --- | --- |
| Architecture and registry | B10.1 | registry: partner-internal |
| Change and release | B9.5, B9.7 | approvals before deployment: not observable from outside |
| Platform standards | — | partner-internal stack preferences |
| API and integration | B5.1–B5.4 | API gateway exposure: partner-internal |
| Identity and access | B4.1–B4.5 | SSO/CIAM: partner-internal; password rules: attested at best, folded into B4.2 |
| Data protection | B6.1, B6.2 | hardened builds: B8.1; secrets not hard-coded: CROPS S5 |
| Logging | B7.1, B7.2 | — |
| Network | B8.1, B8.2 | — |
| Vulnerability management | B1.4, B1.5, B1.6, B2.1, B2.2, B2.3 | anti-malware: B7.2; session timeout: B4.5 |
| Third-party risk | B1.1, B1.2, B1.3, B3.1, B2.2, B6.3 | supplier staff policy compliance: contractual, not observable |
| Continuity | B3.2, B3.3 | firewall: B8.1 |
| Finance | B11.2 | asset value in registry: partner-internal |
| AI systems | B12.1, B12.2 | the eleven sub-controls apply only when B12.1 is evidenced |
| Data governance | B6.4, B6.5 | glossary and catalogue: not applicable to a payment rail from outside |
| Development practices (repository rules, PR review, CI gates, releases, documentation) | B9.1–B9.8, B2.3, B8.2 | build-once-promote, business approval, release classification: not observable from outside |

Applicability classes: `any` 13 controls, `operator` 28, `custodial` 5.
