/**
 * Optional on-chain ownership verification before issuing a license.
 *
 * When OWNERSHIP_RPC_URL + OWNERSHIP_CONTRACT + OWNERSHIP_TOKEN_ID are set,
 * we call ownerOf (ERC-721 style). Otherwise the check is skipped (V1 default).
 *
 * This keeps the core payment flow working without a chain while still
 * providing a real ownership gate when you wire a contract.
 */

export interface OwnershipResult {
  required: boolean;
  owned: boolean;
  owner?: string;
  reason?: string;
}

export async function verifyAssetOwnership(assetId: string): Promise<OwnershipResult> {
  const rpc = (process.env.OWNERSHIP_RPC_URL || '').trim();
  const contract = (process.env.OWNERSHIP_CONTRACT || '').trim();
  const tokenId = (process.env.OWNERSHIP_TOKEN_ID || '').trim();
  const expectedOwner = (process.env.OWNERSHIP_EXPECTED_OWNER || '').trim().toLowerCase();

  if (!rpc || !contract) {
    return { required: false, owned: true, reason: 'ownership_check_disabled' };
  }

  // Minimal eth_call for ownerOf(uint256) — selector 0x6352211e
  const id = tokenId || '0';
  const paddedId = BigInt(id).toString(16).padStart(64, '0');
  const data = `0x6352211e${paddedId}`;

  try {
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: contract, data }, 'latest'],
      }),
      cache: 'no-store',
    });
    const body = await res.json();
    if (body.error) {
      return { required: true, owned: false, reason: body.error.message || 'rpc_error' };
    }
    const raw: string = body.result || '0x';
    const owner = `0x${raw.slice(-40)}`.toLowerCase();
    const owned = expectedOwner ? owner === expectedOwner : owner !== '0x0000000000000000000000000000000000000000';
    return { required: true, owned, owner, reason: owned ? undefined : 'not_owner' };
  } catch (err) {
    console.error('ownership check failed', assetId, err);
    return { required: true, owned: false, reason: 'ownership_unreachable' };
  }
}
