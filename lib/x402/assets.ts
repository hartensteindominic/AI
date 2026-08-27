/**
 * Asset delivery after a one-use license is consumed.
 */

import type { CatalogItem } from './catalog';

export interface DeliveredAsset {
  assetId: string;
  name: string;
  mimeType: string;
  assetKey: string;
  downloadUrl?: string;
  placeholder?: string;
  consumedAt: string;
  message: string;
}

/** Map catalog assetKey → public path when samples exist in /public/assets */
const LOCAL_SAMPLES: Record<string, string> = {
  'voxel-hero.svg': '/assets/voxel-hero.svg',
  'voxel-environment.zip': '/assets/voxel-environment.svg',
  'voxel-pack-core.zip': '/assets/voxel-hero.svg',
};

export function deliverAsset(item: CatalogItem, origin?: string): DeliveredAsset {
  const base = (process.env.ASSET_BASE_URL || '').replace(/\/$/, '');
  const local = LOCAL_SAMPLES[item.assetKey];

  let downloadUrl: string | undefined;
  if (base) {
    downloadUrl = `${base}/${item.assetKey}`;
  } else if (local && origin) {
    downloadUrl = `${origin}${local}`;
  } else if (local) {
    downloadUrl = local;
  }

  return {
    assetId: item.id,
    name: item.name,
    mimeType: item.mimeType.startsWith('image/') ? item.mimeType : 'image/svg+xml',
    assetKey: item.assetKey,
    downloadUrl,
    placeholder: downloadUrl
      ? undefined
      : `/* Wire ASSET_BASE_URL or place files under public/assets */`,
    consumedAt: new Date().toISOString(),
    message:
      'One-use license consumed. Re-request of this asset requires a new x402 payment.',
  };
}
