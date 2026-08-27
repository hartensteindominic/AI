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
2. Server responds **402 Payment Required** with `PAYMENT-REQUIRED` header (and JSON body).
3. Client signs an x402 payment payload and retries with `PAYMENT-SIGNATURE` / `X-PAYMENT` header.
4. Server calls facilitator `/verify` then `/settle`.
5. On success the server **issues a one-use license token** and returns `licenseToken` + `redeemUrl`.
6. Client `GET /api/license/voxel-pack-core?token=lic_…`
7. Server **consumes** the license and returns the asset descriptor (and `downloadUrl` when `ASSET_BASE_URL` is set).

## Configuration (env)

| Variable | Default | Notes |
|----------|---------|-------|
| `X402_MOCK` | `true` | When true (or no `X402_PAY_TO`), payments accepted locally |
| `X402_PAY_TO` | zero address | Merchant receive address |
| `X402_FACILITATOR_URL` | `https://x402.org/facilitator` | Facilitator base URL |
| `X402_NETWORK` | `eip155:84532` | Base Sepolia by default |
| `X402_ASSET` | `USDC` | |
| `X402_DEFAULT_PRICE` | `0.05` | Fallback price |
| `X402_LICENSE_TTL_MS` | `900000` (15 min) | Unconsumed license TTL |
| `LICENSE_STORE` | `memory` | Set to `redis` + Upstash env for durable store |
| `UPSTASH_REDIS_REST_URL` | — | Required when `LICENSE_STORE=redis` |
| `UPSTASH_REDIS_REST_TOKEN` | — | Required when `LICENSE_STORE=redis` |
| `ASSET_BASE_URL` | — | Base URL for asset downloads after consume |

## Production next steps

- Point `ASSET_BASE_URL` (or swap `deliverAsset`) at signed S3/R2 URLs.
- Use `LICENSE_STORE=redis` with Upstash for multi-instance durability.
- Optional: add official `@x402/core` + `@x402/next` middleware on top of this core.
- Optional: on-chain ownership verification of the underlying asset before issuing licenses.
- Keep the existing Stripe human checkout as a parallel path for non-agent buyers.
