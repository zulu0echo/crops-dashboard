# Opera MiniPay: search log (2026-10-07)

Result: **incumbent**. The eligibility rule requires at least one verified contract or public repository needed to run MiniPay. I found neither. Everything public and onchain that MiniPay touches is either generic Celo infrastructure or Celo developer-relations material written for Mini App builders.

## Eligibility search

- **GitHub: Opera orgs.** `github.com/opera` has 13 repos: forks (rocksdb, folly, llama.cpp, DeepSeek-V3, browser-use and others) plus logpeck/terago tooling. None is MiniPay. `github.com/operasoftware` is verified and has 137 repos. A keyword filter (pay|crypto|wallet|web3|celo|eth) returns fake-store, django-payments (fork), nettle-wycheproof-testsuite and web3swift (fork). None is MiniPay.
- **GitHub: other names.** `github.com/minipay` is an unrelated org created in 2019, with `service-user` and `service-transaction`. `operacrypto` is a user with 0 repos. `opera-minipay`, `operaminipay`, `minipay-wallet`, `opera-crypto` and `opera-software` return 404.
- **`gh search repos minipay`.** The MiniPay-related results from known orgs all belong to `celo-org`:
  - `celo-org/minipay`: "MiniPay snippet code for external partners". No LICENSE; package.json says MIT. Pinned at `a25a3a23be100835d1f0f9af46a82c20607212e3`.
  - `celo-org/nexus`, `celo-org/minipay-template`, `celo-org/minipay-workshop` (MIT).
  - `celo-org/minipay-minidapps` (archived).

  All of them are Mini App scaffolds or partner snippets. None runs the wallet, its backend, or the issuer. Every other hit is a hackathon or personal project, or unrelated (Chinese/UPI "MiniPay" apps).
- **Docs.** `www.opera.com/products/minipay` redirects to `https://minipay.to`, which links to `docs.minipay.xyz`. Its `llms.txt` lists the Mini App guides and references: the injected EIP-1193 provider, custom methods, phone lookup and token transfers. No MiniPay contract or repo is named, and the phone lookup page points to Celo docs. `docs.celo.org/build/mini-apps/overview.md` says MiniPay maps phone numbers through SocialConnect and ODIS, using the core FederatedAttestations contract `0x0aD5b1d0C25ecF6266Dd951403723B2687d6aff2` and OdisPayments. Both are Celo protocol contracts, not MiniPay's.
- **MiniPay-specific onchain element.** `celo-org/minipay` README L264-L270 names `0x7888612486844Bb9BE598668081c59A9f7367FBc` as "the MiniPay issuer address on Mainnet". Reads on forno.celo.org at block 79459279: `cast code` returns `0x` (an EOA), nonce 2, about 1.10 CELO. An EOA issuer is not a verified contract, so it does not make MiniPay eligible.
- **Conclusion.** No verified contract, and no public repo needed to run the product. Typed as `incumbent` with no `primary_chain`, and `repos: []` and `contracts: []`. I did not list celo-org/minipay under `repos`, because it is Celo's partner code and not MiniPay's stack. It is cited as evidence under O2 and P3.

## Onchain (Celo 42220, forno.celo.org)

- `eth_getLogs` on FederatedAttestations, topic0 `AttestationRegistered` (`0x3ed7f328...ed6f`), issuer topic = MiniPay issuer, blocks 79454281-79459279 (forno caps ranges at 5000 blocks): **1975 events**. The signer in the sample event data is `0xc245eD03eD53cf862A274a76DCD94549cE1e0401`, also an EOA.
- `lookupIdentifiers(0xad14248c1A6401162Abbe73047c941397b22F5c2, [issuer])` at block 79459279 returns the identifier `0xda87e604...b9a5` (sample tx `0x630fd2f6...209a`).
- Sourcify v2 for FederatedAttestations reports runtime `match` (not exact). Not scored, because the contract is Celo's.

## Documents read (curl, UA `crops-dashboard-validator`; all 200 and server-rendered)

- `https://minipay.to/terms-of-service` (Blueboard Limited, Opera Group): self-custody wallet section, qualifying countries, sanctions warranty, termination "with or without notice", and an EULA forbidding derivation of source.
- `https://minipay.to/privacy-statement`, last updated 2026-09-07: data categories, purposes and legal bases, third parties (AppsFlyer, Firebase Cloud Messaging, WhatsApp, Telegram, ramp and swap providers, SumSub KYC, Gnosis Pay for the card), and "(no personal data)" for blockchain networks.
- `https://minipay.to/faq`: support content, so claimed tier. Not cited for any score. It says keys sit in the Android Keystore with a Google Drive backup, the recovery phrase is viewable in settings, ramps are third-party, and recipients see the sender's Google account name and phone number.
- `https://docs.minipay.xyz/technical-references.md` and `/technical-references/send-transaction.md`.
- `https://docs.celo.org/build/mini-apps/overview.md`.

## Not found or not done

- No audit, bug bounty, or code for the MiniPay app or backend. The RPC endpoint the app uses was not identified, and no app trace was run.
- No document stating issuer freeze powers or sequencer assumptions to users (C5).

## Judgment calls

- **C1 = 0.** The terms let Blueboard terminate an individual user's access with or without notice. That blocks the MiniPay path, not Celo settlement, and the user keeps the keys.
- **C2 = 1, S1 = 1, S4 = 1.** The terms describe self-custody and direct token transfers. That fits the anchor-3 property, but the evidence is documents only, so the documented cap applies. S4 is derived from S1 = 1, C2 = 1, C3 = 0 and O3 unknown.
- **C3 = 0.** Anchors 0 and 1 both fit a closed, single-vendor account backend, so I took the lower.
- **C4 = 1.** Country and sanctions gating is disclosed in the terms. The backend cannot be inspected.
- **P2 = 0.** Collection is disclosed, but part of it is for marketing and analytics, beyond any legal requirement. I took the lower of 1 and 0.
- **P3 = 0.** Plain transfers link payer and payee. On top of that, the issuer's onchain attestations tie wallet addresses to phone-derived identifiers, while the privacy statement says blockchain networks receive no personal data. I treated that as undisclosed linkage.
- **P1 = 1, P4 = 1.** Present and disclosed by category in the privacy statement. Defaults and endpoints were not checked.
- **O2 = 0, F1 = 0.** Nothing MiniPay runs is public, and the EULA forbids deriving source.
- **Left unknown:** O1, O3, F2, F3, P5, S2, S3, S5, S6.

## Availability 2026-10-09

- Source: `https://minipay.to/terms-of-service` (server-rendered, quotes checked live): "The Services are not available in all countries. The Services are made available to users in qualifying countries and are void where prohibited. In particular, we do not offer or make available any crypto-related services to users located in the People's Republic of China." The MiniPay Service section repeats "available only to users in qualifying countries".
- Model `blocklist`, 1 code: CN.
- Judgment calls: the qualifying-country list is not published (searched the terms, `/faq`, the home page and docs.minipay.xyz). Per the brief, I listed only what the document names and explained the unnamed "qualifying countries" and sanctions condition in `note`. The block is therefore a floor of exclusions, not evidence of availability elsewhere; a reviewer may prefer to omit it. Marketing figures ("70+ countries", "53 countries", "over 60 countries" for top-up) describe send and ramp reach and were not used. The Card's "selected supported markets" are also unlisted.
