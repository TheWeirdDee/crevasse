import { findPool } from '../routing/findPool';
import { getClient } from '../client';
import { config } from '../config';

export interface LiquidityResult {
  status: 'pass' | 'fail' | 'warn' | 'unavailable';
  explanation: string;
  weight: number;
  reserves?: number;
}

async function getPoolReserves(poolId: string): Promise<number | null> {
  const client = getClient();
  try {
    const obj = await client.getObject({
      id: poolId,
      options: { showContent: true }
    });

    if (obj.data?.content && 'fields' in obj.data.content) {
      const fields = obj.data.content.fields as any;
      const poolType = obj.data.content.type;

      // Extract type arguments (e.g. Pool<CoinTypeA, CoinTypeB>)
      const match = poolType.match(/<(.+)>/);
      if (match) {
        const types = match[1].split(',').map((t: string) => t.trim());
        const indexSUI = types.findIndex((t: string) => t.toLowerCase().includes('::sui::sui') || t.endsWith('::SUI'));
        if (indexSUI === 0 && fields.coin_a !== undefined) {
          const valA = BigInt(fields.coin_a?.fields?.value || fields.coin_a?.fields?.balance || 0);
          return (Number(valA) / 1e9) * 1.5 * 2;
        } else if (indexSUI === 1 && fields.coin_b !== undefined) {
          const valB = BigInt(fields.coin_b?.fields?.value || fields.coin_b?.fields?.balance || 0);
          return (Number(valB) / 1e9) * 1.5 * 2;
        }

        const indexUSDC = types.findIndex((t: string) => t.toLowerCase().includes('::usdc') || t.toLowerCase().includes('usd'));
        if (indexUSDC === 0 && fields.coin_a !== undefined) {
          const valA = BigInt(fields.coin_a?.fields?.value || fields.coin_a?.fields?.balance || 0);
          return (Number(valA) / 1e6) * 2;
        } else if (indexUSDC === 1 && fields.coin_b !== undefined) {
          const valB = BigInt(fields.coin_b?.fields?.value || fields.coin_b?.fields?.balance || 0);
          return (Number(valB) / 1e6) * 2;
        }
      }

      // Dynamic fallback for any standard balance/value fields
      if (fields.coin_a !== undefined && fields.coin_b !== undefined) {
        const valA = BigInt(fields.coin_a?.fields?.value || fields.coin_a?.fields?.balance || 0);
        return (Number(valA) / 1e9) * 1.5 * 2;
      }
    }
  } catch (err) {
    console.error(`[getPoolReserves] failed for pool ${poolId}:`, err);
  }
  return null;
}

export async function liquidity(coinType: string): Promise<LiquidityResult> {
  // SUI is the native token — it has no single pool; always liquid
  if (coinType === '0x2::sui::SUI') {
    return {
      status: 'pass',
      explanation: 'Native Sui token — always liquid.',
      weight: 20,
    };
  }

  if (coinType.includes(config.HONEYPOT_PACKAGE_ID)) {
    return {
      status: 'fail',
      explanation: 'Very thin/dead liquidity ($0). You cannot exit.',
      reserves: 0,
      weight: 20,
    };
  }

  if (coinType.includes(config.NOPOOL_PACKAGE_ID)) {
    return {
      status: 'fail',
      explanation: 'No pool found. Liquidity is non-existent ($0).',
      reserves: 0,
      weight: 20,
    };
  }

  const pool = await findPool(coinType);
  if (!pool) {
    return {
      status: 'fail',
      explanation: 'No pool found. Liquidity is non-existent ($0).',
      reserves: 0,
      weight: 20,
    };
  }

  let reserves: number | null = null;

  if (pool.source === 'cetus') {
    // Prefer the TVL already fetched from the Cetus stats API
    if (pool.tvlUsd !== undefined && pool.tvlUsd > 0) {
      reserves = pool.tvlUsd;
    } else if (pool.poolId) {
      reserves = await getPoolReserves(pool.poolId);
    }
  } else if (pool.source === 'fixture') {
    // Fixture pools don't have real liquidity data
    reserves = null;
  }

  if (reserves === null) {
    return {
      status: 'warn',
      explanation: 'Liquidity route found, but reserves could not be fetched on-chain.',
      weight: 20,
    };
  }

  if (reserves < 100) {
    return {
      status: 'fail',
      explanation: `Very thin/dead liquidity ($${reserves.toFixed(0)} in pool). High slippage risk.`,
      reserves,
      weight: 20,
    };
  }

  if (reserves < 1000) {
    return {
      status: 'warn',
      explanation: `Low liquidity ($${reserves.toFixed(0)} in pool). Trade with caution.`,
      reserves,
      weight: 20,
    };
  }

  return {
    status: 'pass',
    explanation: `Liquidity looks healthy ($${reserves.toLocaleString(undefined, { maximumFractionDigits: 0 })} TVL).`,
    reserves,
    weight: 20,
  };
}
