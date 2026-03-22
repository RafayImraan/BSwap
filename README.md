# BSwap

BSwap is a trustless cross-chain atomic swap prototype between Bitcoin Testnet and Hedera Testnet. It coordinates native BTC and native HBAR settlement with shared hashlocks, ordered timelocks, and a non-custodial coordination backend.

## Deployment model

BSwap now defaults to a public-safe posture:

- wallet connection is public
- server signing is disabled by default
- the backend coordinates state and metadata
- transaction authorization should come from participant wallets, not server-held private keys

If you intentionally want private operator mode for local demos, set:

```env
PUBLIC_SIGNING_ENABLED=true
```

Do not enable that mode on a public internet deployment.

## Included

- Bitcoin Testnet HTLC generation helpers
- Hedera HBAR HTLC smart contract
- Express + WebSocket coordinator
- Next.js premium settlement console
- HashPack wallet pairing path
- Demo wallet generation and env verification scripts

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Add your public client settings:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

4. Compile the Hedera contract:

```bash
npm run compile -w contracts
```

5. Deploy the Hedera contract:

```bash
npm run deploy:hedera-sdk -w server
```

6. Save the returned contract id:

```env
HEDERA_CONTRACT_ID=0.0.xxxxxxx
```

7. Verify environment:

```bash
npm run verify:env
```

8. Start the services:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

## Public deployment guidance

For a public website:

- keep `PUBLIC_SIGNING_ENABLED=false`
- do not expose server-held demo keys
- let visitors connect their own wallets
- treat the backend as a coordinator, not a signer

The UI reflects this by disabling server execution controls in public-safe mode.

## Private operator mode

Private operator mode is for local demos only. It requires:

- `BITCOIN_WIF`
- `BITCOIN_REFUND_WIF`
- `HEDERA_OPERATOR_ACCOUNT_ID`
- `HEDERA_OPERATOR_PRIVATE_KEY`
- `PUBLIC_SIGNING_ENABLED=true`

In that mode, the backend can execute settlement steps with configured testnet wallets. This is not suitable for public deployment.

## Current limitation

The project now removes server signing from public deployment, but full client-side wallet authorization for every Bitcoin and Hedera settlement step still needs deeper wallet-specific signing flows. The public-safe version is therefore suitable as a coordinator and intent console, while complete browser-side execution can be extended next.
