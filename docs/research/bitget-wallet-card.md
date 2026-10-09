# Bitget Wallet Card: research log

Checked: 2026-10-07. Onchain reads pinned to Arbitrum One block 512546136.

## Type decision: card (scoped to the Fiat24 program)

Bitget Wallet Card is several regional programs. The card page says "Card issuing partners vary by region" and names none. One program meets the eligibility rule: the Fiat24-issued card for Mainland China. Bitget's help centre calls it "Bitget Wallet Card (Fiat24)" (article 482), and article 802 says new Mainland China signups are closed while existing users are unaffected. Onchain, `Fiat24Account.walletProviderMap(8088)` returns `("Bitget", true)`, and Bitget-referred accounts were the largest group of card payers in the sampled window (195 accounts). The scores describe that program. Its contracts and evidence are the same Fiat24 stack as SafePal Card (see `docs/research/safepal-card.md` for addresses and source reads).

Judgment call for the reviewer: the program is closed to new signups, and the open programs (EEA/UK, LatAm, APAC, South Asia) have no artifact tying them to a contract or repo. If the dashboard should rate only the currently sold card, this provider would be `incumbent` instead.

## Other regional programs (not scored)

- Help article 281 (Europe, Africa and LATAM top-up FAQ, client-rendered, read in a browser): "The card provider has confirmed that your funds have been credited. The top-up will arrive in 3-7 minutes." Unused funds are withdrawn via "Card" > "Withdraw". The card page FAQ adds that a user who loses the wallet "won't be able to top up or withdraw from the card". Together these describe a separate card balance held with the card provider, not spending from the wallet.
- Press coverage (Decrypt, GlobeNewswire releases, third-party claims) names Immersve and Mastercard for the EEA/UK card. Immersve publishes `immersve/immersve-docs` describing a "Universal EVM" funding contract and a "Custodial" protocol. Neither Bitget nor Immersve says which one Bitget uses, and the docs repo (at `cb4b2be2`) never mentions Bitget. Not used.
- I did not find the issuers for the APAC, LatAm and South Asia programs.

## Searched

- `web3.bitget.com/card` (server-rendered FAQ), the help centre (client-rendered; articles 281, 482 and 802 read in a browser; 482 and 802 archived in `data/archive/bitget-wallet-card-help-fiat24.txt`), the privacy policy `resource/policy.html`, and `BitgetWallet_Terms_of_Use.pdf` (wallet terms, nothing card-specific).
- GitHub `bitgetwallet` org: 12 repos (bkbridge, bkexchange, bkswapv2, bwb, bwb-claim, bwb staking for Solana, dapp-integration-demos, download, solana-swap, tob-api-sdk, tob-api-sdk-ts). None is card code. Repo search for "bitget wallet card" finds only third-party comparison pages.

## Judgment calls

The calls match SafePal Card (C4 = 0, C5 = 2, O1 = 2, P3 = 1, S1 = 0, S3 = 0, S4 = 0), with Bitget-specific evidence:
- S3: 188 of 195 sampled Bitget accounts have near-maximum allowances to the authorizer, e.g. #119154 with exactly 2^256-1.
- P1 and P2: Bitget's privacy policy discloses analytics (no vendor named), government ID and biometric data for KYC.
- C5: Bitget's card pages state no freeze or sequencer assumptions, so the evidence is the contract enumeration plus Fiat24's docs.

## Availability 2026-10-09

- Sources: help article 802 (archived in `data/archive/bitget-wallet-card-help-fiat24.txt`): "Users in Mainland China can no longer apply for a new Bitget Wallet Card. Existing users are not affected." The card page FAQ (`https://web3.bitget.com/card`, server-rendered) still lists "mainland China" among regions where the card is "currently available", alongside EEA/UK, ten LatAm countries, other APAC, South Africa, Pakistan and Bangladesh.
- Model `allowlist`, 1 code: CN.
- Judgment calls: the file is scoped to the Fiat24 programme, so only CN is listed; the other regional programmes (different, unnamed issuers) are mentioned in `note` only. The card page and article 802 disagree on whether Mainland China is open; I took the more restrictive reading (existing cardholders only, no new applications) and said so in `note`, keeping CN because that is where the programme operates. Fiat24's own domicile list (`info.fiat24.com/api/fiat24/getCountries`) omits CN, consistent with the closure. The reviewer may prefer to drop the block or mark the provider `incumbent`, as flagged in the type decision above.

## Operational 2026-10-09

File: `data/operational/bitget-wallet-card.yaml` (new; no bot facts existed). Scope is the Fiat24 programme, as in the provider file.

- **Fiat24 docs read** (GitBook; HTML and `.md` variants): user manual (individual account, cash payout, MasterCard debit, money exchange, crypto top-up), products pricing for individuals, developer integration guide parts 1, 2 and 5 (authorized access model), price adjust plan, release notice 2025-02-01, legal terms (effective 21 April 2026), privacy policy (14 February 2023), payment card terms. GitBook pages carry an "agent instructions" block offering a query endpoint; not used.
- **Bitget**: card page (server-rendered FAQ; generic "0 annual fee" for all programmes) and security technology page (audits cover Bitget Swap and NFT marketplace only).
- **Registers.** FINMA authorised-institutions search (client-rendered; the `api/search/getresult` POST response is archived as `data/archive/bitget-wallet-card-ops-finma-register.txt`): SR Saphirstein AG, Zürich, "Licensed persons pursuant to Article 1b BA (FinTech licence)". Swiss UID register CHE-256.014.995: active AG, HR reference CH-020.3.046.001-4, Bellerivestrasse 245, Zürich. FinTech licensees are AML-supervised by FINMA directly, so no SRO was searched.
- **Onchain.** Fiat24CardAuthorization proxy 0xe2e3...5b14: receipt of tx 0x53392365...57a7 gives contractAddress at block 273715521 (2024-11-12 14:08:51 UTC), matching Sourcify. arb1.arbitrum.io has no historical state, so codesize bisection was not possible. `Authorized` event layout read from the Sourcify ABI and confirmed on tx 0x568b9d28...e21f (word 2 token, word 3 amount, 2 decimals).

Judgment calls:
- **Custody `provider_custodial`** (not hybrid): the balance is a Fiat24 deposit token the issuer's operator EOA can move (S1 = 0, S4 = 0).
- **Licence** recorded with `holder: partner` (Fiat24 is the issuer; Bitget refers). Bitget's own licences not looked up.
- **Fees** are Fiat24's published fees; no card FX margin is published, so it is noted as not stated rather than zero. Bitget's "0 annual fee" line is kept as a card row because it is the provider's own page, though it covers all regional programmes.
- **First deployment** is the card authorizer (card settlement), not the older EUR24 token (2022-01-16), which is noted.
- **Volume spec** counts all Fiat24 card authorizations, not only Bitget-referred accounts; stated in `exclusions`.
- **B12.1 evidenced** as automated screening (onchain sanctions oracle, card fraud blocking) without a statement on AI; B12.2 records only the user unblock override.
- **Left `unknown`**: B1.1 to B1.5, B3.1, incidents (status page history did not load).

Validator: offline 0 errors; online 0 errors.
