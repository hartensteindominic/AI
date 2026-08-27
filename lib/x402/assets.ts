/**
 * Asset delivery after a one-use license is consumed.
 *
 * V1 returns a structured descriptor + optional public path.
 * When ASSET_BASE_URL is set, returns a short-lived style download URL
 * (caller can later swap in signed S3/R2 URLs).
 */

import type { CatalogItem } from './catalog';

export interface DeliveredAsset {
  assetId: string;
  name: string;
  mimeType: string;
  assetKey: string;
  downloadUrl?: string;
  /** Placeholder content when no binary is available yet */
  placeholder?: string;
  consumedAt: string;
  message: string;
}

export function deliverAsset(item: CatalogItem): DeliveredAsset {
  const base = (process.env.ASSET_BASE_URL || '').replace(/\/$/, '');
  const downloadUrl = base ? `${base}/${item.assetKey}` : undefined;

  return {
    assetId: item.id,
    name: item.name,
    mimeType: item.mimeType,
    assetKey: item.assetKey,
    downloadUrl,
    placeholder: downloadUrl
      ? undefined
      : `/* AI Licensing V1 placeholder for ${item.assetKey} — wire ASSET_BASE_URL or binary store */`,
    consumedAt: new Date().toISOString(),
    message:
      'One-use license consumed. Re-request of this asset requires a new x402 payment.',
  };
}
