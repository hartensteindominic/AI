/**
 * One-use license store (V1 in-memory).
 * Production should replace with Redis / durable store / on-chain claims.
 *
 * Design rule: each successful x402 payment buys exactly one machine-use unit.
 * Consuming the license returns the asset and permanently invalidates the token.
 */

import { randomBytes } from 'crypto';
import { getX402Config } from './config';

export interface LicenseRecord {
  token: string;
  assetId: string;
  issuedAt: number;
  expiresAt: number;
  consumed: boolean;
  paymentRef?: string;
}

// Module-level store — fine for single-instance V1 / serverless cold starts reset it.
const store = new Map<string, LicenseRecord>();

function newToken(): string {
  return `lic_${randomBytes(24).toString('hex')}`;
}

export function issueLicense(assetId: string, paymentRef?: string): LicenseRecord {
  const { licenseTtlMs } = getX402Config();
  const now = Date.now();
  const record: LicenseRecord = {
    token: newToken(),
    assetId,
    issuedAt: now,
    expiresAt: now + licenseTtlMs,
    consumed: false,
    paymentRef,
  };
  store.set(record.token, record);
  return record;
}

export function peekLicense(token: string): LicenseRecord | null {
  const record = store.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    store.delete(token);
    return null;
  }
  return record;
}

/**
 * Atomically consume a one-use license.
 * Returns the record if valid and unused; otherwise null.
 */
export function consumeLicense(token: string): LicenseRecord | null {
  const record = peekLicense(token);
  if (!record || record.consumed) return null;
  record.consumed = true;
  store.set(token, record);
  return record;
}

export function licenseStats() {
  let active = 0;
  let consumed = 0;
  const now = Date.now();
  for (const r of store.values()) {
    if (r.expiresAt < now) continue;
    if (r.consumed) consumed += 1;
    else active += 1;
  }
  return { active, consumed, totalTracked: store.size };
}
