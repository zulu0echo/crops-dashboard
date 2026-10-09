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
