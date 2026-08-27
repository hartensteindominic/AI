/**
 * One-use license facade.
 * Backed by the pluggable store (memory by default, Upstash Redis when configured).
 */

import { getLicenseStore, type LicenseRecord } from './store';

export type { LicenseRecord };

export async function issueLicense(
  assetId: string,
  paymentRef?: string,
): Promise<LicenseRecord> {
  return getLicenseStore().issue(assetId, paymentRef);
}

export async function peekLicense(token: string): Promise<LicenseRecord | null> {
  return getLicenseStore().peek(token);
}

export async function consumeLicense(token: string): Promise<LicenseRecord | null> {
  return getLicenseStore().consume(token);
}

export async function licenseStats() {
  return getLicenseStore().stats();
}
