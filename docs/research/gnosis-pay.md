# Gnosis Pay: research log (2026-10-07)

All onchain reads are pinned to Gnosis Chain block **48629765** and were made with `cast` against https://rpc.gnosischain.com. Repos are cited at these commits:

| Repo | Commit |
| --- | --- |
| gnosispay/account-kit | 9366073768f4ad8a321c03832066f6b97921b21a (v5.1.1) |
| gnosispay/ui | 7fc844b4bb779ed1384468008b9a3eb2e7cf59f2 |
| gnosispay/docs | b0b8c668d044b543f794e6a91065045ec03c6cbb |
| gnosisguild/zodiac-modifier-delay | 515737f6… (matches the deployed source) and 221382ea… (HEAD) |
| gnosisguild/zodiac-modifier-roles | 820e5bc9… |

## Context that changes the reading

- **June 2026 security incident.** The ui repo ships `public/safe-recovery-data.csv`, which tags each Safe as lost or not_lost. Account-kit commit f4b92878 (2026-06-03) replaced the Delay, Roles and Spender mastercopies, and users were moved to new Safes. The help article "Recovering funds after the 2026 security incident" confirms the migration but gives no root cause, and I found no post-mortem. I scored the **post-incident** architecture: Delay 0x22d903fd…, Roles 0x732B9E9f…, Spender 0x7a592baE….
- **Consumer card closure.** The formal notice dated 21 Sep 2026 says the card and web app stop at 23:59 UTC on 20 Dec 2026. Withdrawals stay available, and Gnosis Pay moves to partner card programs. Partner programs will be new contracts and may use different setups. The scores here cover the current Gnosis Pay setup only.
- **Dead legal links.** The homepage's legal links (help.gnosispay.com/hc/...) return 404. The live pages are under help.gnosispay.com/articles/... (Pylon knowledge base).

## Where I looked

- **GitHub orgs.** `gh repo list gnosispay` returned account-kit, ui, docs, pse-react-native, siwe-demo-app, gnosispay-uptime, and forks of optimism and safe-contracts. The org has no backend, relayer, indexer or spend-service repo.
- **Upstream repos.** gnosisguild/zodiac-modifier-delay, zodiac-modifier-roles and zodiac (licenses, CLA workflow, audits); safe-global/safe-smart-account (license, audits); gnosis/CLA (CLA terms).
- **Org code search.** `org:gnosispay audit` and `org:gnosispay bounty` returned nothing.
- **Sourcify v2 API.** Checked every address in `contracts`, plus the EURe v2 implementation and its validator.
- **Gnosisscan.** Address pages are used as citation URLs only; the HTML is Cloudflare-gated, so I could not read verification status from it.
- **Legal documents (help.gnosispay.com/articles).** Terms of Service (2178874711), Privacy and Cookies Policy (7638555831), legal documents and fees, what happens to your data, the closure notice, and the incident recovery article.

## Finding a real account

1. `cast logs` for `Spend(address,address,address,uint256)` (topic 0xca8fbb9b…) over the last 500 blocks showed every spend emitted by spender modifier **0x5f07734E…**, which is an EIP-1167 proxy to the 0x7a592baE… mastercopy.
2. In tx 0xf99c9e1c… (block 48629267) the event's `account` field is the **Roles modifier** 0xd69693CA… (not the Safe), and `receiver` is **0x4822521E…**. The ui code names that address `GNOSIS_PAY_SETTLEMENT_ADDRESS`.
3. Roles `avatar()` gives the account Safe **0xE27aa566…**.
   - Owners: [0x…02], threshold 1, so the Safe owner is renounced.
   - Modules: Delay 0x91Def2b0… and Roles 0xd69693CA….
   - masterCopy: Safe 1.3.0 0xd9Db270c….
4. **Delay modifier** 0x91Def2b0…
   - owner, avatar and target are all the Safe.
   - txCooldown is 180, txExpiration is 1800.
   - Enabled modules are 0x701Fb746… and 0x5581a253…, both EIP-7702-delegated EOAs (the user's signers).
5. **Roles modifier**
   - owner() is Bouncer 0x4d5803A0… (from = Safe, to = Roles, selector = setAllowance).
   - `allowances(keccak("SPENDING_ALLOWANCE"))` returns refill 2700e18, period 86400 and balance 2695e18.
6. **Spender modifier**
   - owner is Safe 0x896a695d… (2-of-3, all EOA owners).
   - The single delegate is EOA 0x9c48bc73… (nonce 0; it signs offchain).
   - Spends are relayed by EOA 0x90830Ed5… (nonce about 3.9M).
7. **Settlement Safe** 0x4822521E…: 2-of-10.
8. **Tokens.**
   - EURe v2 (0x420CA0f9…) is a UUPS proxy. Its owner is Monerium Safe 0x8001EA26… (3-of-6), and validator() is 0xfE74A522…, a BlacklistValidatorUpgradeable with ban and unban.
   - GBPe v2 (0x8E34bfEC…) uses the same validator.
   - USDC.e (0x2a22f9c3…) has blacklister, pauser and owner all set to Safe 0x458cd345… (threshold 3).

I compared source with what is deployed:

- Spender.sol and Bouncer.sol at account-kit 9366073 are identical to the Sourcify sources except for a trailing newline.
- Delay.sol at zodiac-modifier-delay HEAD does **not** match the deployed source. Commit 515737f6 (2023-11-04) does, so S4 cites that commit.

## What I did not find or did not do

- No browser or network trace was run. P1, P4 and S5 are capped at what the code shows.
- No self-host attempt was made, so O3 is capped at 1.
- No audit of Gnosis Pay's own Spender or Bouncer, no bug bounty, no incident post-mortem.
- I did not decode the Roles receiver condition from storage; Roles v2 keeps conditions in write-once SSTORE2 contracts. The receiver lock rests on the SDK setup code plus a live spend going to the settlement Safe.
- No public implementation of the Gnosis Pay API, delay relay or spend service.
- Gnosisscan verification status for the proxies, because the pages are Cloudflare-gated. Those addresses are marked `verified: none` because Sourcify has no match.

## Judgment calls

| Cell | Score | Reasoning |
| --- | --- | --- |
| C1 | 0 | The onchain account layer has no pause or freeze role and would score 3. The Terms let Gnosis Pay or Monavate block an individual card with or without notice, which is admissible lowering evidence and matches anchor 0. |
| C4 | 1 | Screening happens in Sumsub and the closed backend and is disclosed in the Terms. The frontend code has no sanctions or geo-IP check, but that does not justify a 3. |
| O4 | 2 | There is a cardholder CSV export but no payee (merchant) export. |
| F1 | 2 | Two non-critical repos (docs, pse-react-native) have no license. Anchor 2 names one; anchor 1 does not apply. |
| F2 | 0 | Gnosis Pay's own repos have no CLA (that alone would be 2). The Delay and Roles modules sit under a Gnosis CLA that permits relicensing. Whether Gnosis Pay counts as a Gnosis affiliate is unknown, so I took the lower anchor. |
| P1 | 1 | Pylon is a support widget, not analytics, but it is a third-party script on every page load that receives email, name and Safe address. The privacy policy discloses analytics and support partners only in general terms. |
| P3 | 2 | No merchant data is onchain, but a fixed settlement address plus a long-lived Safe expose a cardholder's spending amounts and timing. This counts as minimal, documented linkage. |
| S3 | 2 | The allowance is bounded, refilling and locked to one receiver. It is not an exact amount and does not expire. |
| S4 | 2 | Funds are retained: there is a direct Delay path and a public `/withdraw` route that makes no API call. Settlement stops (C2 = C3 = 0). Reading "no higher than the weakest of S1, C2, C3" as a strict minimum would give 0; I applied C2 and C3 to the settlement half of the anchor only. |
| S5 | 2 | There is no evidence of key scoping or rotation. |
| S6 | 1 | The upstream Safe, Delay and Roles audits apply; Gnosis Pay's own contracts are unaudited as far as I found. |

## Migration 2026-10-07

I migrated the file to the post-red-team rules: `primary_chain.basis`, a `components` inventory with 18 entries, a `context` field, a `quote` on every documented item, and `recheck` on every cell scored 2 or 3. Archive copies of the help-centre pages are saved as `data/archive/gnosis-pay-{terms,privacy,data,legal-docs,closure-notice}.txt`. The live pages serve their text to curl, so each quote matches both the live page and the archive. The archives are there because the online run hit timeouts. The S6 audit item is now a verified `repo` item for the committed PDF, because PDF text cannot be quote-checked. It is still an audit report only. Both validator runs (offline, and online with a GitHub token) return 0 errors.

### Score changes

| Cell | Old | New | Reason |
| --- | --- | --- | --- |
| F1 | 2 | 0 | F1 is now scored against the component inventory. A card payment cannot complete without closed, proprietary required components: the Gnosis Pay API and backend, the spend delegate signer, the relayer, Monavate, Visa and Sumsub. A closed required component cannot be forked. On the public repos alone it would still be 2. |

No other score changed. I re-checked every cell whose anchor changed:

- **C1: stays 0.** The finding is rewritten around the module read below. The one spend delegate is EOA 0x9c48bc73… (no code, nonce 0). A single EOA can stop or selectively withhold settlement, which meets anchor 0 on onchain evidence alone. The Terms' card-block power (documented) meets it independently. The spender Safe misses every anchor-2 condition: the signers are not named in any document I found, it has a module that bypasses the threshold, and it has no timelock against the documented 3-minute user exit.
- **C4: stays 1.** The settlement contracts are neutral; Spender.spend() and the Roles scope have no address or geographic check. Sanctions and country screening is disclosed only in the hosted Terms. The versioned docs repo mentions Sumsub KYC but not screening or a list source. The filtering cannot be bypassed (C2 = 0).
- **P2: stays 1.** The privacy policy states a legal basis for each purpose, but only in the hosted policy, not in code or a repo document, so the documented cap applies. Judgment call: I read the analytics, advertising and marketing items as consent-based and disclosed (1), not as collection beyond the stated requirement (0). A stricter reading of the legitimate-interest uses would give 0.
- **S2: stays 3.** The account Safe has no guard, and its modules are only Delay and Roles. The Roles scope (below) allows no delegatecall. Delay, Roles and Spender are EIP-1167 proxies. Judgment call: the spender Safe and the settlement Safe are ordinary Safes whose owners could change their code. That cannot widen access to user accounts, and settlement-Safe custody is already scored under S1.
- **S3: stays 2.** The revised anchor 2 names this case directly: a bounded, refilling allowance limited to one receiver. It is no longer a judgment call.
- **S4: stays 2.** The revised anchor 2 needs a verified user withdrawal path. That path is the user-EOA Delay modules plus the public executeNextTx, using Sourcify-matched code. The Roles scope cannot reach setTxNonce, so the provider cannot block a queued withdrawal. The old "strict minimum" judgment call is no longer needed.
- **O3: stays 1.** No recorded attempt and no deploy script with a recorded run. The blockers are listed in the README.
- **S5 and S6** have unchanged anchors and scores. I added the recheck and line range that S5 needed.

### Spender Safe module (red team R7)

Reads at block 48629765:

- Spender Safe 0x896a695d…8428 has one module, `getModulesPaginated(0x1,10)` = [0x5f07734E…3F8a], and its guard slot is zero.
- That module is the spender modifier itself: avatar(), target() and owner() all return the Safe. Its one enabled delegate is EOA 0x9c48bc73…4d4df.

From Spender.sol at 9366073 (L29-L82), what the module can do without the 2-of-3 threshold:

- The modifier's generic `execTransactionFromModule` functions are overridden with empty bodies.
- Its only call into the Safe is `spend()`. That function makes the Safe call `execTransactionWithRole` on any `account` the delegate names, and the inner payload is always `token.transfer(receiver, amount)`.
- Changing delegates, avatar or target needs the Safe's owner, which means 2 signatures.

What limits it onchain is each user account's Roles scope. The sample account's setup transaction (0x2a9c14e8…, block 46534712) decodes to:

- the spender Safe as the only role member;
- the scope `EURe.transfer` with param 0 EqualTo the settlement Safe 0x4822521E…;
- param 1 WithinAllowance(SPENDING_ALLOWANCE);
- ExecutionOptions None.

Every later log from that Roles instance is ConsumeAllowance. This settles the receiver lock that the seed had not decoded from storage.

Conclusion: the module does bypass the threshold. One delegate key can move up to each account's remaining daily allowance into Gnosis Pay's settlement Safe, and nothing onchain ties that pull to a card authorisation. It cannot send funds anywhere else, exceed the allowance, or change account configuration. This is recorded in the C1, S1 and S3 findings, and S1 stays 1. Judgment call: the destination is fixed and the amount is capped, so I read this as disclosed custody in flight, not as the provider being able to redirect funds.

### Not changed, but flagged

O2 = 2 rests on "everything except the backend". The component inventory now shows that the indexer, relayer and delegate signer are closed as well. O2's anchor did not change in this migration, so I left the score alone. A reviewer should decide whether it should drop to 1.

## Availability 2026-10-09

- Model `allowlist`: EEA, AR, BO, BR, CH, CO, GB, MX (37 countries in all).
- Source: help-centre article "Eligible Countries for Gnosis Pay" (`https://help.gnosispay.com/articles/1662387556`, "last updated 28 days ago"). Terms section 2 links to it as the list of Non-EEA Supported Countries. It is archived at `data/archive/gnosis-pay-eligible-countries.txt`. The Terms and closure-notice archives from 2026-10-07 are cited alongside it.
- The FAQ lists every EEA state individually (all 27 EU members plus IS, LI and NO), so the region name `EEA` is used. This matches the Terms' EEA/non-EEA split.
- Judgment calls:
  - The FAQ's "Restricted Countries for Card Usage" list (22 locations, including Crimea) is about where a transaction is made, not residency. None of the 22 is on the residency list, so it is recorded in `note` and not modelled.
  - French overseas territories are excluded by the FAQ footnote. They have their own ISO codes, none of which is listed, so `FR` stays and the exclusion goes in `note`.
  - The consumer programme closes on 2026-12-20, and partner programmes will set their own eligibility. The block describes the current programme only.

## Operational 2026-10-09

Extended `data/operational/gnosis-pay.yaml` (bot B2.1, B2.3, B8.2, B9.x untouched).
- Fees and cash-out: the Terms' Fee Schedule is the help-centre article "Understanding Your Card's Fees and Limits" (help.gnosispay.com/articles/6104401027, linked from the Legal collection and kept up after the closure notice): no purchase fee, Visa FX rate without mark-up, replacement 4.99, ATM 5 free or 200 a month then 2%, limits. Bank cash-out is Monerium's IBAN (EUR cards only), from the user's own wallet, per "Getting money to a bank account" and docs repo on-off-ramps/iban-integration.mdx. Fee, bank and incident articles archived (`gnosis-pay-ops-*.txt`) because the programme closes on 20 Dec 2026.
- Licences: UAB Monavate checked in the Bank of Lithuania register (lb.lt, server-rendered; LB002139, EMI licence from 2022-03-31). The same entry lists a 2025-11-25 sanction, a EUR 270,000 fine under the AML/CTF law and EMI governance and safeguarding rules; recorded in the licences note. Monavate Ltd checked in the FCA Register in a browser (FRN 901097, authorised EMI since 04/11/2020) and archived. Licences moved from attested to evidenced.
- First deployment: settlement Safe 0x4822521E... created at Gnosis block 31420289 (2023-12-13), from the Blockscout v2 address API and confirmed with `cast codesize` before and at the block.
- Entity: Gnosis Pay Co Ltd (Companies House 14919639, incorporated 7 June 2023). Gnosis P. Tech, Unipessoal Lda (Portugal 517 666 898) is named in the Terms but not checked in a Portuguese register.
- Incidents: the June 2026 incident is now backed by Gnosis Pay's own help article ("Recovering funds after the 2026 security incident"); still no post-mortem or loss figure.
- Group B: B4.1, B5.1, B5.3 from docs repo auth.mdx at b0b8c66 (SIWE then JWT, 1 to 24 h); B5.2 from integration-model.mdx (App ID, mTLS for PSE) plus S5 refs; B6.2, B6.3, B6.4, B12.1 from the privacy policy archive (system testing uses all personal data; up to 7 years retention; controllers per residence; "We do not make use of any automated decision making"); B3.4 adds the Upptime status page (status.gnosispay.com, repo gnosispay/gnosispay-uptime); B10.1 from gp-onchain/overview.mdx; B11.1 and B11.3 from the Terms, Companies House and the closure notice. Other controls are unknown: no security page, security.txt (404), certification, SOC report, pen-test or DPA was found on gnosispay.com, the help centre or the docs repo.
- Judgment calls: B12.1 recorded `absent` on Gnosis Pay's own statement, with a note that Sumsub and Monavate screening falls outside it; B12.2 `not_applicable`. B6.2 recorded as evidenced with a negative value (testing is a stated purpose for all personal data) rather than absent. Volume stays `not_observable`.
