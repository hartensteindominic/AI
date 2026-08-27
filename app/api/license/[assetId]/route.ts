import { NextRequest, NextResponse } from 'next/server';
import { getCatalogItem } from '../../../../lib/x402/catalog';
import {
  buildRequirements,
  verifyPayment,
  settlePayment,
  type PaymentPayload,
} from '../../../../lib/x402/payment';
import { issueLicense, consumeLicense } from '../../../../lib/x402/licenses';
import { deliverAsset } from '../../../../lib/x402/assets';
import { getX402Config } from '../../../../lib/x402/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Machine-use license endpoint.
 *
 * Flow:
 * 1. No payment header → 402 + Payment-Requirements
 * 2. Valid payment → settle → issue one-use license token → return license
 * 3. ?token=lic_... → consume license → return asset (once)
 *
 * Design: each successful x402 payment buys exactly one machine-use unit.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } },
) {
  const assetId = params.assetId;
  const item = getCatalogItem(assetId);
  if (!item) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  // --- Consume path: already paid, redeem one-use license ---
  if (token) {
    const record = await consumeLicense(token);
    if (!record || record.assetId !== assetId) {
      return NextResponse.json(
        { error: 'License invalid, expired, or already used' },
        { status: 402 },
      );
    }

    const delivered = deliverAsset(item);
    return NextResponse.json({
      ok: true,
      licenseToken: token,
      ...delivered,
    });
  }

  // --- Payment path ---
  const paymentHeader =
    request.headers.get('PAYMENT-SIGNATURE') ||
    request.headers.get('X-PAYMENT') ||
    request.headers.get('x-payment');

  const resourceUrl = `${url.origin}/api/license/${assetId}`;
  const requirements = buildRequirements(item, resourceUrl);

  if (!paymentHeader) {
    const body = {
      x402Version: 1,
      accepts: [requirements],
      error: 'Payment required for one machine-use license',
    };
    return NextResponse.json(body, {
      status: 402,
      headers: {
        'PAYMENT-REQUIRED': Buffer.from(JSON.stringify(requirements)).toString('base64'),
        'Cache-Control': 'no-store',
      },
    });
  }

  let paymentPayload: PaymentPayload;
  try {
    const raw = paymentHeader.startsWith('{')
      ? paymentHeader
      : Buffer.from(paymentHeader, 'base64').toString('utf8');
    paymentPayload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Malformed payment payload' }, { status: 400 });
  }

  const verification = await verifyPayment(paymentPayload, requirements);
  if (!verification.valid) {
    return NextResponse.json(
      { error: 'Payment verification failed', reason: verification.reason },
      { status: 402 },
    );
  }

  const settlement = await settlePayment(paymentPayload, requirements);
  if (!settlement.success) {
    return NextResponse.json(
      { error: 'Payment settlement failed', reason: settlement.reason },
      { status: 402 },
    );
  }

  const license = await issueLicense(assetId, verification.paymentRef || settlement.tx);
  const cfg = getX402Config();

  return NextResponse.json(
    {
      ok: true,
      licenseToken: license.token,
      assetId,
      expiresAt: new Date(license.expiresAt).toISOString(),
      redeemUrl: `${resourceUrl}?token=${license.token}`,
      settlementTx: settlement.tx,
      mockMode: cfg.mockMode,
      message: 'One machine-use license issued. Redeem once via redeemUrl.',
    },
    {
      status: 200,
      headers: {
        'PAYMENT-RESPONSE': Buffer.from(
          JSON.stringify({ success: true, tx: settlement.tx }),
        ).toString('base64'),
        'Cache-Control': 'no-store',
      },
    },
  );
}
