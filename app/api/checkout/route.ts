import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Checkout is not configured yet.' }, { status: 503 });

  const origin = new URL(request.url).origin;
  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('success_url', `${origin}/?session_id={CHECKOUT_SESSION_ID}`);
  body.set('cancel_url', `${origin}/#top`);
  body.set('allow_promotion_codes', 'true');
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', 'usd');
  body.set('line_items[0][price_data][unit_amount]', '999');
  body.set('line_items[0][price_data][product_data][name]', 'Voxel Max-Ready 3D Voxel Asset Pack');
  body.set('line_items[0][price_data][product_data][description]', '13 coordinated voxel assets delivered in editable VOX plus self-contained GLTF formats in one ZIP.');
  body.set('metadata[product]', 'voxel_3d_asset_pack');
  body.set('payment_intent_data[metadata][product]', 'voxel_3d_asset_pack');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const session = await response.json();
  if (!response.ok || !session?.url) {
    console.error('Stripe checkout error', session);
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
