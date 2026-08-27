# AI Licensing — x402 Machine-Use Core (V1)

## Design rule

**Each successful x402 payment buys exactly one machine-use license unit**  
(not ownership, not unlimited reuse).  
After the license is consumed, the next request for the same asset requires a new payment.

## Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/license/catalog` | Public catalog |
| GET | `/api/license/:assetId` | 402 → pay → one-use license, or redeem `?token=` |
| GET | `/api/license/status` | Health + stats |

## Sample assets

Placeholders live under `public/assets/`:
- `/assets/voxel-hero.svg`
- `/assets/voxel-environment.svg`

On redeem, the API returns a `downloadUrl` pointing at these (or at `ASSET_BASE_URL`).

## On-chain ownership (optional)

Set these env vars to require ERC-721 `ownerOf` before quoting a price:

| Variable | Purpose |
|----------|--------|
| `OWNERSHIP_RPC_URL` | JSON-RPC endpoint |
| `OWNERSHIP_CONTRACT` | NFT contract address |
| `OWNERSHIP_TOKEN_ID` | Token id (default 0) |
| `OWNERSHIP_EXPECTED_OWNER` | Optional expected owner address |

If unset, ownership check is skipped.

## Official @x402 packages (optional)

```bash
npm i @x402/core @x402/next @x402/evm
```

Then replace `lib/x402/withX402.ts` with the real `withX402` / `paymentProxy` and keep the one-use license issue in an after-settle hook. The current custom route already implements the full protocol-compatible flow.

## Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `X402_MOCK` | `true` | Local accept without facilitator |
| `X402_PAY_TO` | zero address | Merchant receive address |
| `X402_FACILITATOR_URL` | `https://x402.org/facilitator` | |
| `X402_NETWORK` | `eip155:84532` | |
| `X402_LICENSE_TTL_MS` | `900000` | |
| `LICENSE_STORE` | `memory` | or `redis` + Upstash |
| `ASSET_BASE_URL` | — | External asset CDN |
| `OWNERSHIP_*` | — | Optional on-chain gate |
