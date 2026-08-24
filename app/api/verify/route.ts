import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!secret || !sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ paid: false });
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  });

  if (!response.ok) return NextResponse.json({ paid: false });
  const session = await response.json();
  const paid = session?.payment_status === 'paid' && session?.metadata?.product === 'voxel_creator_pack';

  return NextResponse.json({ paid });
}
