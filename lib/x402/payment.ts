/**
 * Minimal x402 payment handshake helpers.
 * Compatible with facilitator /verify + /settle endpoints.
 * In mockMode we short-circuit to a successful local payment.
 */

import { getX402Config } from './config';
import type { CatalogItem } from './catalog';

export interface PaymentRequirements {
  x402Version: number;
  scheme: 'exact';
  network: string;
  maxAmountRequired: string; // atomic units as string
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: Record<string, unknown>;
}

/** Convert human USDC (e.g. "0.05") to atomic units (6 decimals) as string */
export function toAtomicUsdc(human: string): string {
  const n = Number(human);
  if (!Number.isFinite(n) || n < 0) return '0';
  return String(Math.round(n * 1_000_000));
}

export function buildRequirements(
  item: CatalogItem,
  resourceUrl: string,
): PaymentRequirements {
  const cfg = getX402Config();
  return {
    x402Version: 1,
    scheme: 'exact',
    network: cfg.network,
    maxAmountRequired: toAtomicUsdc(item.priceUsdc),
    resource: resourceUrl,
    description: `One machine-use license: ${item.name}`,
    mimeType: item.mimeType,
    payTo: cfg.payTo,
    maxTimeoutSeconds: 60,
    asset: cfg.asset,
    extra: {
      name: 'USDC',
      version: '2',
    },
  };
}

export async function verifyPayment(
  paymentPayload: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<{ valid: boolean; reason?: string; paymentRef?: string }> {
  const cfg = getX402Config();

  if (cfg.mockMode) {
    // Dev / CI path: accept any payload that looks structured
    if (paymentPayload?.scheme === 'exact' || paymentPayload?.x402Version) {
      return { valid: true, paymentRef: `mock_${Date.now()}` };
    }
    return { valid: false, reason: 'mock_invalid_payload' };
  }

  try {
    const res = await fetch(`${cfg.facilitatorUrl.replace(/\/$/, '')}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentPayload, paymentRequirements: requirements }),
      cache: 'no-store',
    });
    const body = await res.json();
    if (!res.ok || body?.isValid === false) {
      return { valid: false, reason: body?.invalidReason || body?.error || 'verify_failed' };
    }
    return {
      valid: true,
      paymentRef: body?.payer || body?.transaction || `verified_${Date.now()}`,
    };
  } catch (err) {
    console.error('x402 verify error', err);
    return { valid: false, reason: 'facilitator_unreachable' };
  }
}

export async function settlePayment(
  paymentPayload: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<{ success: boolean; tx?: string; reason?: string }> {
  const cfg = getX402Config();

  if (cfg.mockMode) {
    return { success: true, tx: `mock_tx_${Date.now()}` };
  }

  try {
    const res = await fetch(`${cfg.facilitatorUrl.replace(/\/$/, '')}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentPayload, paymentRequirements: requirements }),
      cache: 'no-store',
    });
    const body = await res.json();
    if (!res.ok || body?.success === false) {
      return { success: false, reason: body?.errorReason || body?.error || 'settle_failed' };
    }
    return { success: true, tx: body?.transaction || body?.txHash };
  } catch (err) {
    console.error('x402 settle error', err);
    return { success: false, reason: 'facilitator_unreachable' };
  }
}
