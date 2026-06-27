import { sellTest } from './checks/sellTest';
import { mintAuthority } from './checks/mintAuthority';
import { freezeAuthority } from './checks/freezeAuthority';
import { liquidity } from './checks/liquidity';
import { holders } from './checks/holders';
import { assemble, AssembleResult } from './verdict/assemble';
import { writeVerdict } from './onchain/writeVerdict';

export interface FullCheckResult extends AssembleResult {
  token: string;
  sellTest: any;
  mintAuthority: any;
  freezeAuthority: any;
  liquidity: any;
  holders: any;
  onChain: { txDigest: string; explorerUrl: string } | null;
}

interface CacheEntry {
  result: FullCheckResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function runFullCheck(coinType: string, bypassCache = false): Promise<FullCheckResult> {
  const cacheKey = coinType.toLowerCase().trim();
  const now = Date.now();

  if (!bypassCache) {
    const entry = cache.get(cacheKey);
    if (entry && (now - entry.timestamp < CACHE_TTL_MS)) {
      console.log(`[cache] Hit for ${coinType}`);
      return entry.result;
    }
  }

  const [sellResult, mintResult, freezeResult, liquidityResult, holdersResult] = await Promise.all([
    sellTest(coinType),
    mintAuthority(coinType).catch(err => {
      console.error('[mintAuthority] failed:', err);
      return { status: 'unavailable' as const, explanation: 'Error during mint check.', weight: 20 };
    }),
    freezeAuthority(coinType).catch(err => {
      console.error('[freezeAuthority] failed:', err);
      return { status: 'unavailable' as const, explanation: 'Error during freeze check.', weight: 20 };
    }),
    liquidity(coinType).catch(err => {
      console.error('[liquidity] failed:', err);
      return { status: 'unavailable' as const, explanation: 'Error during liquidity check.', weight: 20 };
    }),
    holders(coinType).catch(err => {
      console.error('[holders] failed:', err);
      return { status: 'unavailable' as const, explanation: 'Error during holder check.', weight: 20 };
    })
  ]);

  const { verdict, score } = assemble(
    sellResult,
    mintResult,
    freezeResult,
    liquidityResult,
    holdersResult
  );

  // Write verdict to on-chain registry — non-blocking
  let onChain: { txDigest: string; explorerUrl: string } | null = null;
  try {
    onChain = await writeVerdict(coinType, verdict, score);
  } catch (err) {
    console.error('[writeVerdict] skipped:', err);
  }

  const checkResult: FullCheckResult = {
    token: coinType,
    verdict,
    score,
    sellTest: sellResult,
    mintAuthority: mintResult,
    freezeAuthority: freezeResult,
    liquidity: liquidityResult,
    holders: holdersResult,
    onChain,
  };

  cache.set(cacheKey, { result: checkResult, timestamp: now });
  return checkResult;
}
