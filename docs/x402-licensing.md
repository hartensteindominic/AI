# AI Licensing — x402 Machine-Use Core (V1)

## Design rule

**Each successful x402 payment buys exactly one machine-use license unit**  
(not ownership, not unlimited reuse).  
After the license is consumed, the next request for the same asset requires a new payment.  
This is the mechanism that makes “bot uses asset → bot pays again” enforceable.

## Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/license/catalog` | Public catalog of licenseable assets + prices |
| GET | `/api/license/:assetId` | x402 gate → issue one-use license, or redeem with `?token=` |
| GET | `/api/license/status` | Health + mockMode + license stats |

## Flow

1. Client (human or AI agent) `GET /api/license/voxel-pack-core`
2. Server responds **402 Payment Required** with `PAYMENT-REQUIRED` header (and JSON body) describing the exact USDC amount, network, and payTo.
3. Client signs an x402 payment payload and retries with `PAYMENT-SIGNATURE` / `X-PAYMENT` header.
4. Server calls facilitator `/verify` then `/settle`.
5. On success the server **issues a one-use license token** and returns `licenseToken` + `redeemUrl`.
6. Client `GET /api/license/voxel-pack-core?token=lic_…`
7. Server **consumes** the license (marks it used) and returns the asset descriptor.  
   Further redemptions of the same token fail with 402.

## Configuration (env)

| Variable | Default | Notes |
|----------|---------|-------|
| `X402_MOCK` | `true` | When true (or no `X402_PAY_TO`), payments are accepted locally without a facilitator |
| `X402_PAY_TO` | zero address | Merchant receive address |
| `X402_FACILITATOR_URL` | `https://x402.org/facilitator` | Facilitator base URL |
| `X402_NETWORK` | `eip155:84532` | Base Sepolia by default |
| `X402_ASSET` | `USDC` | |
| `X402_DEFAULT_PRICE` | `0.05` | Fallback price |
| `X402_LICENSE_TTL_MS` | `900000` (15 min) | How long an unconsumed license stays valid |

Set `X402_MOCK=false` and a real `X402_PAY_TO` + live facilitator to collect real USDC.

## Production next steps

- Replace in-memory license store with Redis / Postgres / on-chain claim.
- Serve real asset bytes or short-lived signed download URLs on consume.
- Add official `@x402/core` + `@x402/next` packages if you prefer the middleware approach.
- Optional: on-chain ownership verification of the underlying asset before issuing licenses.
- Wire the existing Stripe human checkout as a parallel path for non-agent buyers.
