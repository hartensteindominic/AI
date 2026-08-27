/**
 * x402 / AI Licensing configuration
 * Env-driven so production can point at a live facilitator + payTo address.
 */

export type Network = 'eip155:8453' | 'eip155:84532' | 'solana:mainnet' | 'solana:devnet';

export interface X402Config {
  /** When true, skip real facilitator calls and issue mock one-use licenses */
  mockMode: boolean;
  /** Merchant receive address (EVM or Solana depending on network) */
  payTo: string;
  /** Facilitator base URL (Coinbase CDP, self-hosted, or public) */
  facilitatorUrl: string;
  /** Preferred network for exact scheme payments */
  network: Network;
  /** Asset used for payments (USDC contract or mint) */
  asset: string;
  /** Default price in USDC (human units, e.g. "0.05") */
  defaultPriceUsdc: string;
  /** How long a one-use license remains valid before expiry (ms) */
  licenseTtlMs: number;
}

function env(key: string, fallback = ''): string {
  return (process.env[key] ?? fallback).trim();
}

export function getX402Config(): X402Config {
  const mockMode =
    env('X402_MOCK', 'true').toLowerCase() === 'true' ||
    !env('X402_PAY_TO');

  return {
    mockMode,
    payTo: env('X402_PAY_TO', '0x0000000000000000000000000000000000000000'),
    facilitatorUrl: env('X402_FACILITATOR_URL', 'https://x402.org/facilitator'),
    network: (env('X402_NETWORK', 'eip155:84532') as Network),
    asset: env('X402_ASSET', 'USDC'),
    defaultPriceUsdc: env('X402_DEFAULT_PRICE', '0.05'),
    licenseTtlMs: Number(env('X402_LICENSE_TTL_MS', String(15 * 60 * 1000))),
  };
}
