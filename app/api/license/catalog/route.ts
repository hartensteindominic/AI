import { NextResponse } from 'next/server';
import { listCatalog } from '../../../../lib/x402/catalog';
import { getX402Config } from '../../../../lib/x402/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public catalog of machine-use license units.
 * GET /api/license/catalog
 */
export async function GET() {
  const cfg = getX402Config();
  const items = listCatalog().map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceUsdc: item.priceUsdc,
    mimeType: item.mimeType,
    tags: item.tags,
    licenseUrl: `/api/license/${item.id}`,
  }));

  return NextResponse.json({
    product: 'AI Licensing',
    model: 'one-machine-use-per-payment',
    mockMode: cfg.mockMode,
    network: cfg.network,
    asset: cfg.asset,
    items,
  });
}
