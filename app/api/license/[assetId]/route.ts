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
import { verifyAssetOwnership } from '../../../../lib/x402/ownership';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // --- Consume path ---
  if (token) {
    const record = await consumeLicense(token);
    if (!record || record.assetId !== assetId) {
      return NextResponse.json(
        { error: 'License invalid, expired, or already used' },
        { status: 402 },
      );
    }

    const delivered = deliverAsset(item, url.origin);
    return NextResponse.json({
      ok: true,
      licenseToken: token,
      ...delivered,
    });
  }

  // Optional on-chain ownership gate before quoting a price
  const ownership = await verifyAssetOwnership(assetId);
  if (ownership.required && !ownership.owned) {
    return NextResponse.json(
      {
        error: 'Asset ownership not verified on-chain',
        reason: ownership.reason,
        owner: ownership.owner,
      },
      { status: 403 },
    );
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
      ownershipChecked: ownership.required,
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
      ownershipChecked: ownership.required,
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
