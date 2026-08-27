import { NextResponse } from 'next/server';
import { getX402Config } from '../../../../lib/x402/config';
import { licenseStats } from '../../../../lib/x402/licenses';
import { listCatalog } from '../../../../lib/x402/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = getX402Config();
  const stats = await licenseStats();
  return NextResponse.json({
    product: 'AI Licensing',
    model: 'each x402 payment → exactly one machine-use license unit',
    mockMode: cfg.mockMode,
    network: cfg.network,
    payToConfigured: Boolean(cfg.payTo && !cfg.payTo.startsWith('0x0000')),
    facilitatorUrl: cfg.facilitatorUrl,
    licenseStore: (process.env.LICENSE_STORE || 'memory').toLowerCase(),
    catalogSize: listCatalog().length,
    licenses: stats,
  });
}
