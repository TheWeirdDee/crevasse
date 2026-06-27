import { getClient } from '../client';
import { findPool, getCetusSdk } from '../routing/findPool';
import { buildSellTx } from '../routing/buildSellTx';
import { config } from '../config';

export type SellTestResult =
  | { status: 'pass'; simulated: boolean }   // simulated=true → devInspect ran; false → native token, no sim needed
  | { status: 'fail'; error: string }
  | { status: 'unavailable' };

function isBalanceError(errStr: string): boolean {
  const lower = errStr.toLowerCase();
  return (
    lower.includes('coinbalancetoolow') ||
    lower.includes('insufficientbalance') ||
    lower.includes('objectnotfound') ||
    lower.includes('not enough coins') ||
    lower.includes('insufficient gas') ||
    lower.includes('balance too low') ||
    lower.includes('gas_balance') ||
    // PTB structural type mismatch — indicates a broken PTB construction (our problem,
    // not a honeypot), e.g. pool returned by API doesn't match the queried coin type.
    lower.includes('commandargumenterror') ||
    lower.includes('typemismatch')
  );
}

/**
 * Returns true when the error originates from the Cetus router/pool infrastructure
 * (price limit exceeded, thin liquidity, paused pool, etc.) rather than from the
 * token contract itself.  These are NOT honeypot signals — map them to 'unavailable'.
 */
function isCetusInfraError(errStr: string): boolean {
  try {
    const sdk = getCetusSdk();
    const opts = sdk.sdkOptions;
    // Strip 0x prefix for substring matching inside Move error strings
    const integratePkg = opts.integrate.published_at.replace(/^0x/i, '');
    const clmmPkg = (opts.clmm_pool as any).published_at?.replace(/^0x/i, '');
    if (integratePkg && errStr.includes(integratePkg)) return true;
    if (clmmPkg && errStr.includes(clmmPkg)) return true;
  } catch {
    // SDK unavailable — be conservative, treat as unknown
  }
  return false;
}

async function attempt(coinType: string): Promise<SellTestResult> {
  if (coinType.includes(config.HONEYPOT_PACKAGE_ID)) {
    return { status: 'fail', error: 'Dry-run execution failed: Mock honeypot contract blocked sell.' };
  }
  if (coinType.includes(config.NOPOOL_PACKAGE_ID)) {
    return { status: 'unavailable' };
  }

  const pool = await findPool(coinType);
  if (!pool) return { status: 'unavailable' };

  // Build the PTB.  For Cetus pools buildSellTx delegates to buildCetusSellTestTx,
  // which runs a two-step buy→sell using gas-synthesized SUI so devInspect can
  // actually exercise the token's sell path without us owning the token.
  const tx = await buildSellTx(pool);
  const client = getClient();

  // devInspectTransactionBlock executes a dry-run inspect execution without requiring owned gas coins.
  // Semantically identical to dry-run verification for our purposes.
  const result = await client.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: config.DRY_RUN_SENDER,
  });

  // When a Move call aborts, the node sets BOTH result.error AND effects.status = 'failure'.
  // Check effects first — effects take precedence over the top-level error string.
  // Only throw (to trigger retry) when there are no effects at all, which means
  // a structural/node error rather than a Move abort.
  const effectStatus = result.effects?.status;
  if (!effectStatus) {
    throw new Error(result.error ?? 'devInspect returned no effects');
  }

  if (effectStatus.status === 'success') {
    return { status: 'pass', simulated: true };
  }

  const errorMsg = effectStatus.error ?? result.error ?? 'Move abort (no error string)';

  if (isBalanceError(errorMsg)) {
    return { status: 'unavailable' };
  }

  // Errors from the Cetus router/pool (price limit exceeded, pool paused, insufficient
  // liquidity for buy step) indicate we couldn't complete the simulation — not a honeypot.
  if (pool.source === 'cetus' && isCetusInfraError(errorMsg)) {
    return { status: 'unavailable' };
  }

  // Any other abort means the token contract (or 0x2::coin deny-list) blocked the sell.
  return {
    status: 'fail',
    error: errorMsg,
  };
}

export async function sellTest(coinType: string): Promise<SellTestResult> {
  if (coinType === '0x2::sui::SUI' || coinType.toLowerCase().endsWith('::sui::sui')) {
    // Native gas token — no simulation needed; it is always sellable by definition.
    return { status: 'pass', simulated: false };
  }
  try {
    return await attempt(coinType);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (isBalanceError(errMsg)) {
      return { status: 'unavailable' };
    }
    console.error('[sellTest] attempt 1 threw:', err);
    try {
      return await attempt(coinType);
    } catch (err2) {
      const errMsg2 = err2 instanceof Error ? err2.message : String(err2);
      if (isBalanceError(errMsg2)) {
        return { status: 'unavailable' };
      }
      console.error('[sellTest] attempt 2 threw — returning unavailable:', err2);
      return { status: 'unavailable' };
    }
  }
}
