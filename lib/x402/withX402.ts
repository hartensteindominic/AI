/**
 * Optional thin wrapper that mirrors the shape of official @x402/next helpers.
 *
 * The current core already implements the full 402 → verify → settle → one-use
 * license flow in app/api/license/[assetId]/route.ts.
 *
 * When you install the official packages:
 *   npm i @x402/core @x402/next @x402/evm
 * you can replace this stub with the real withX402 / paymentProxy from @x402/next
 * and keep the same license-issue side-effect in an onAfterSettle hook.
 *
 * This file documents the integration point so the upgrade is a small swap.
 */

import { NextRequest, NextResponse } from 'next/server';

export type PaidHandler = (
  req: NextRequest,
  ctx: { paymentRef?: string },
) => Promise<NextResponse> | NextResponse;

/**
 * Placeholder. Real usage after installing official packages:
 *
 * import { withX402 } from '@x402/next';
 * export const GET = withX402({ price: '$0.05', ... }, handler);
 */
export function withX402Placeholder(
  _opts: { priceUsdc: string; description?: string },
  handler: PaidHandler,
) {
  return async (req: NextRequest) => {
    // Defer to the dedicated /api/license/:id route for the full one-use flow.
    // Official middleware can wrap additional routes once packages are added.
    return handler(req, {});
  };
}
