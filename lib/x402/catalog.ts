/**
 * Public catalog of assets available for machine-use licensing.
 * Each entry is sold as one-use license units via x402.
 */

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  /** Price in USDC (human-readable string) for one machine-use */
  priceUsdc: string;
  /** MIME type of the delivered asset */
  mimeType: string;
  /** Relative path or identifier used to locate the asset after license consume */
  assetKey: string;
  tags: string[];
}

/** V1 catalog — voxel assets from the existing product, now one-use licensed */
export const CATALOG: CatalogItem[] = [
  {
    id: 'voxel-pack-core',
    name: 'Voxel Creator Pack — Core Set',
    description: '30 original voxel-style SVG assets. One machine-use license unit.',
    priceUsdc: '0.10',
    mimeType: 'application/zip',
    assetKey: 'voxel-pack-core.zip',
    tags: ['voxel', 'svg', 'commercial-one-use'],
  },
  {
    id: 'voxel-hero',
    name: 'Voxel Hero Character',
    description: 'Single high-detail voxel hero SVG. One machine-use.',
    priceUsdc: '0.05',
    mimeType: 'image/svg+xml',
    assetKey: 'voxel-hero.svg',
    tags: ['voxel', 'character'],
  },
  {
    id: 'voxel-environment',
    name: 'Voxel Environment Kit',
    description: 'Environment props pack. One machine-use license.',
    priceUsdc: '0.08',
    mimeType: 'application/zip',
    assetKey: 'voxel-environment.zip',
    tags: ['voxel', 'environment'],
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function listCatalog(): CatalogItem[] {
  return CATALOG;
}
