# AI / Voxel Creator Pack + Machine Licensing

Two products in one repo:

1. **Voxel Creator Pack** — human checkout ($9.99 Stripe) for a commercial-use asset pack.
2. **AI Licensing (x402)** — machine-use one-license-unit sales via the open x402 payment protocol.

## Voxel Creator Pack (human path)

- 30 original voxel-style SVG assets
- Transparent backgrounds, recolorable vectors
- Commercial use in finished work and client projects
- `POST /api/checkout` → Stripe Checkout ($9.99)
- `GET /api/verify?session_id=…` → unlock ZIP download

Set `STRIPE_SECRET_KEY` in production.

## AI Licensing — x402 machine-use core (V1)

**Design rule:** each successful x402 payment buys **exactly one machine-use license unit** (not ownership, not unlimited reuse). After the license is consumed, the next request requires a new payment. That is the mechanism that makes “bot uses asset → bot pays again” enforceable.

### Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/license/catalog` | Public catalog + prices |
| GET | `/api/license/:assetId` | 402 gate → issue one-use license, or redeem with `?token=` |
| GET | `/api/license/status` | Health, mockMode, license stats |

### Quick flow

```bash
# 1. Catalog
curl -s localhost:3000/api/license/catalog | jq

# 2. Request asset → receive 402
curl -i localhost:3000/api/license/voxel-pack-core

# 3. (In mockMode) retry with any valid-looking payment header → receive licenseToken
curl -s -H 'X-PAYMENT: {"x402Version":1,"scheme":"exact"}' \
  localhost:3000/api/license/voxel-pack-core | jq

# 4. Redeem once
curl -s 'localhost:3000/api/license/voxel-pack-core?token=lic_…' | jq
```

Full documentation: [docs/x402-licensing.md](docs/x402-licensing.md)

### Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `X402_MOCK` | `true` | Local accept without facilitator |
| `X402_PAY_TO` | zero address | Merchant receive address |
| `X402_FACILITATOR_URL` | `https://x402.org/facilitator` | |
| `X402_NETWORK` | `eip155:84532` | Base Sepolia |
| `X402_LICENSE_TTL_MS` | `900000` | 15 min unconsumed TTL |
| `LICENSE_STORE` | `memory` | Set `redis` + Upstash env for durable multi-instance store |
| `UPSTASH_REDIS_REST_URL` | — | Required when `LICENSE_STORE=redis` |
| `UPSTASH_REDIS_REST_TOKEN` | — | Required when `LICENSE_STORE=redis` |
| `ASSET_BASE_URL` | — | Base URL for asset downloads after license consume |

Set `X402_MOCK=false` + real `X402_PAY_TO` to collect live USDC.

## Run locally

```bash
npm install
npm run dev
```
