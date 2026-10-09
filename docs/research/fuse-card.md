# Fuse Card: research log (2026-10-07)

## Which product
- The brief guessed Fuse Network (chain 122). The fuseio org and news.fuse.io have no Fuse-branded card; the only card post there ("The First Visa Card on Fuse", 2025-10-21) is Solid Card.
- Card Map (third party, used only to find the product) lists "Fuse Card" as a Squads Labs product on Solana. Squads' site links fusewallet.com, which describes Fuse Card (Bridge, Lead Bank, Visa). That is the product assessed here.

## Documents (all curl-readable, quotes checked)
- fusewallet.com/support/fuse-visa-card covers countries, KYC via Bridge, the daily limit (up to $2,000), the 5-minute withdrawal time lock and freeze in app.
- fusewallet.com/blog/fuse-pay and /blog/fuse-card describe the separate Card Account smart account, with Main Account as sole signer and the daily Spending Limit for Bridge.
- fusewallet.com/legal/terms-of-service: Squads Inc. is the provider and Lead Bank the issuer.
- bridge.xyz/card-agreements/fuse-card is the Lead Bank Prepaid Visa Cardholder Agreement. It covers block or suspend "with or without notice" and arbitration.
- squads.xyz/legal/privacy-policy (Selimor Investments Ltd d/b/a Squads): analytics and ad networks, KYC by Bridge and Lead Bank.

## Onchain (Solana mainnet, api.mainnet-beta.solana.com)
- `getProgramAccounts` on SQDS4ep... with the SpendingLimit discriminator (2odkUytTTsV) and the USDC mint at offset 73 returned 4,718 limits. The two large clusters are:
  - member EdEsqYQ5... (2,545 limits, monthly, one fixed destination, 49 USDC; not Fuse)
  - member AE2RGS1h... (1,727 limits, period Day, 2,000 USDC on 1,656 of them, 1,723 with no destination list). This matches Fuse's "daily limit up to $2,000", so AE2RGS1h... is taken as Bridge's spender key. It is a system-owned keypair account.
- Sample Card Account 2ozzxmEw... (slot 454201822): config_authority default, threshold 1, time_lock 300, one member GcWXuyno... (permissions 7). The rent collector DHsoQKQ6... is Fuse's fee payer.
- GcWXuyno... is the vault of Main Account 6AFbKVmL... (slot 454202225): threshold 2, members F6ow8NRv... (7), F7yCa8b4... (7) and Du5LoukF... (2, vote only). Squads holds no key there.
- Sample spend tx 2Pd7P942... (slot 454199060) is a SpendingLimitUse of 1.69 USDC from vault 9BWWRFQ7... to 9ipHpNhr..., signed by AE2RGS1h... with fee payer 7kEydiJ9....
- Program SQDS4ep... has programData Fy3YMJCv... with upgrade authority None (slot 454201918).
- USDC mint freezeAuthority is 7dGbd2QZ... (slot 454202586).
- OtterSec registry (verify.osec.io/status/SQDS4ep...): is_verified false, commit 3742e552 (Jan 2024), is_frozen true.

## Repos
- Squads-Protocol/v4: HEAD af94153, audited commit 64af733 (named in README L177). At 3742e55 SpendingLimitUse requires a multisig member. Commit 19dcb3e6 (2024-08-08) allowed non-members, which matches the observed spends, so source citations use 64af733.
- v4 LICENSE was BUSL-1.1 (Selimor) from d5cb3e7 (2024-01-30) and became AGPL-3.0 at 316913ad (2024-10-11, "Open sourced!").
- Squads-Protocol/public-v4-client is MIT and supports a self-host Docker build of a generic v4 UI.
- No repo exists for the Fuse app, Fuse backend or Bridge integration.

## Judgment calls
- C1 0: the card block without notice, from the cardholder agreement. The onchain layer alone would score 3.
- C5 2: the onchain spending-limit configuration counts as enumeration in code.
- O1 0: no verified build is recorded. The README build steps were not run.
- F2 0: the BUSL-to-AGPL relicense counts as a prior relicensing event even though it moved toward openness.
- S1 0: Bridge's limit has no destination restriction, so its key can redirect up to the daily cap.
- S3 1: the allowance is bounded and refilling but not tied to one receiver, so it falls between the anchors and takes the lower.
- S4 1: the withdrawal path is verified onchain, but key export from the closed app is unproven.
- S6 1: audits are pinned to 64af733, but nothing proves the deployed program equals 64af733.
- Unknown: O4 (no API schema or export to assess), P5, S5.

## Availability 2026-10-09

- Source: fusewallet.com/support/fuse-visa-card (Framer, server-rendered; quotes match the live HTML). The card overview and the FAQ "Am I eligible for Fuse Card?" both list 18 countries: US (excluding New York and Alaska), AR, BO, BR, CO, CR, DO, EC, SV, GH, GT, HN, MX, PA, NG, PY, PE, UY. The FAQ answer then continues "users in the U.S. and Argentina aged 18 or older, excluding residents of New York and Alaska", a leftover from an earlier version.
- Also read: fusewallet.com/legal/terms-of-service (referral terms refer to "jurisdictions where fuse card is available" without a list).
- Judgment call: the page contradicts itself, so per the brief the more restrictive reading is recorded (allowlist US, AR), with the 18-country list and the US state exclusions in `note`. If the reviewer treats the fragment as a stale remnant, the 18-country list is the alternative.

## Operational 2026-10-09

- Sources (curl-readable, quotes checked with the validator's normaliser): bridge.xyz/card-agreements/fuse-card (Lead Bank cardholder agreement with short- and long-form fee disclosures), fusewallet.com/support/fuse-visa-card, /support/bank-transfers, /support/fuse-security, /blog/fuse-off-ramp, /blog/fuse-pay, /legal/terms-of-service, squads.xyz/legal/terms-of-service, squads.xyz/legal/privacy-policy, trust.squads.xyz (Comp AI trust centre), the FDIC BankFind API (archived at data/archive/fuse-card-ops-fdic-lead-bank.txt). The full fusewallet.com sitemap was walked for support and blog pages.
- Fees: card, monthly, annual, inactivity, replacement and international fees are all 0 in the cardholder agreement; Fuse states no top-up or transaction fees; bank off-ramp is 1 USD per ACH or SEPA transfer. The conversion spread is not stated.
- Licences: Lead Bank is on FDIC BankFind (cert 8283, Kansas City MO, state charter, non-member, active). Bridge's licences were not checked; its legal page names Bridge Building Inc. (NMLS 2450917) for US account services.
- Cash-out: card spend only (no ATM: the agreement and the support page both say so); bank transfer via ACH/SEPA with residence exclusions (NY, AK and 35 countries).
- First deployment: the oldest of 23 transactions on the Squads v4 programData account is the deployWithMaxDataLen at slot 183693695 (2023-03-20). Paging getSignaturesForAddress for Bridge's spender key AE2RGS1h... (49,500 signatures) ends at a SpendingLimitUse at slot 314054836 (2025-01-15), the first observed card debit.
- Changes: programData history shows upgrades at slots 244446274 (2024-01-27), 297082331 (2024-10-22) and 302582236 (2024-11-20) and setAuthority to null at slot 302808455 (2024-11-21). The BUSL to AGPL relicence (2024-10-11) is referenced from F2.
- Group B: the Squads Trust Center shows SOC 2 Type 1 (not Type II) and lists policy titles (vulnerability and patch management, incident response and breach notification, disaster recovery); content is behind "Request Access", so B1.3, B2.2, B3.1 and B3.3 are attested. B4.1, B6.3, B6.4, B10.1, B11.1 and B11.3 are documented; B1.4 points at S6. No status page found (status.squads.so does not resolve).
- Judgment calls:
  - Entity: Selimor Investments Limited (BVI) is recorded, not Squads Inc. The Fuse Terms name Squads Inc. without a jurisdiction, the card disclosures name Squads Labs Inc., and the Squads Terms and privacy policy name Selimor. The BVI register is not public.
  - first_deployment dates the Squads program, not the card; the first card debit is in the note and in changes.
  - Volume is `unknown` with no spec. Card debits are separable on Solana (SpendingLimitUse by Bridge's key), but the spec format takes EVM log filters only.
  - B1.1 is `unknown`, not `absent`, because a trust-centre listing is not a certifier search.
