import { NextResponse } from 'next/server';
import { getX402Config } from '../../../../lib/x402/config';
import { licenseStats } from '../../../../lib/x402/licenses';
import { listCatalog } from '../../../../lib/x402/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Health / status for the licensing core */
export async function GET() {
  const cfg = getX402Config();
  return NextResponse.json({
    product: 'AI Licensing',
    model: 'each x402 payment → exactly one machine-use license unit',
    mockMode: cfg.mockMode,
    network: cfg.network,
    payToConfigured: Boolean(cfg.payTo && !cfg.payTo.startsWith('0x0000')),
    facilitatorUrl: cfg.facilitatorUrl,
    catalogSize: listCatalog().length,
    licenses: licenseStats(),
  });
}
