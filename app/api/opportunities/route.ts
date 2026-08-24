import { NextResponse } from 'next/server';
import { scanOpportunities } from '../../../lib/scanner.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  const { searchParams } = new URL(request.url);
  const maxResults = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 24)));

  try {
    const result = await scanOpportunities({ token, perPage: 30, maxResults });
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Scanner unavailable',
      opportunities: [],
    }, {
      status: 502,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  }
}
