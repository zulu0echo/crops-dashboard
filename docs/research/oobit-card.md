# Oobit Card: research log (2026-10-07)

## Eligibility: incumbent
I found no verified contract and no public repository needed to run the product.

- GitHub: the `oobit-tech` org has one public repo, `oobit-plugins` (an AI-agent/Cursor plugin manifest with no LICENSE). `gh search repos oobit` and `gh search code oobit` return unrelated or third-party repos only.
- npm: `@oobit/react-native-sdk` 3.3.5 and `@oobit/react-web` 1.3.4 carry an MIT tag, but their declared repo `github.com/oobit-tech/react-native-SDK` returns 404. These are partner-wallet widget SDKs (Plug & Pay) that wrap Oobit's hosted widget. The Oobit Card does not need them.
- docs.oobit.com covers the Plug & Pay SDK, the Partner API and Agent Pay. The only addresses it publishes are testnet tokens.
- Onchain: an eth.blockscout.com search for "oobit" returns the OBT token (0x07F9702c...), several copycat "OOB" tokens and Oobit-tagged EOAs ("Oobit 1-4", "Oobit: Deployer") whose last activity is from 2023. The deployer's transactions are OBT transfers only. I identified no DePay spender or settlement contract. The DePay page mentions a "smart contract engine" and a one-time spending approval, which is a provider claim with no address given.
- If the DePay spender, or the Rain collateral contracts used by this programme, can be identified from a sample payment, Oobit should be re-assessed as `type: card`.

## Documents (all curl-readable, quotes checked)
- `/legal/card-terms` (titled "Rain Card Terms"): issuer Third National. It covers block and suspend, OFAC eligibility and Supported Blockchains (Ethereum, Polygon, Optimism, Arbitrum).
- `/legal/terms-of-use`: in-app crypto is held on a custodial basis (s7.19); embargoed countries are excluded.
- `/legal/privacy-notice`: lists the KYC fields plus education, job title and source of funds, collection through cookies and device identifiers, and processors by category only.
- `/faq` and `/depay`: DePay networks (Ethereum, BNB Smart Chain, Solana, Polygon), payments go "directly from your wallet to Oobit's settlement layer", and the user chooses the spending approval amount.

## Judgment calls
- C1 0: account-level suspension with no stated notice period (HesabPay precedent).
- C5 1: docs-only enumeration; the FAQ and Card Terms chain lists disagree.
- P4 0: KYC, fraud and blockchain-intelligence vendors are named only by category.
- S1 1: custodial and disclosed.
- Unknown: O1, O3, O4, F2, P3, P5, S2, S3, S4, S5, S6, because no contract, code or trace is available. S3 in particular is unknown: the approval size and default are not visible.
