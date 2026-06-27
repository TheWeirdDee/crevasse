import { getClient } from '../client';
import { config } from '../config';
import { CetusClmmSDK } from '@cetusprotocol/sui-clmm-sdk';

export interface PoolInfo {
  source: 'fixture' | 'cetus' | 'aftermath';
  coinType: string;
  poolId?: string;
  coinTypeA?: string;
  coinTypeB?: string;
  isA2B?: boolean;
  tvlUsd?: number;
}

// type_name::get<T>().into_string() strips 0x and pads address to 64 hex chars.
// e.g. "0x2::sui::SUI" → "0000...0002::sui::SUI"
function toMoveTypeName(coinType: string): string {
  const [addr, ...rest] = coinType.split('::');
  return [addr.replace(/^0x/i, '').padStart(64, '0'), ...rest].join('::');
}

let _cetusSdk: CetusClmmSDK | null = null;
export function getCetusSdk(): CetusClmmSDK {
  if (!_cetusSdk) {
    const isMainnet = config.SUI_RPC_URL.includes('mainnet');
    _cetusSdk = CetusClmmSDK.createSDK({ env: isMainnet ? 'mainnet' : 'testnet' });
  }
  return _cetusSdk;
}

const CETUS_STATS_URL = 'https://api-sui.cetus.zone/v2/sui/stats_pools';
const SUI_LONG = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

async function findCetusPool(coinType: string): Promise<PoolInfo | null> {
  const url = `${CETUS_STATS_URL}?limit=20&coin_type=${encodeURIComponent(coinType)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();

  // API returns lp_list: null when no pools found — coerce to array
  const list: any[] = Array.isArray(data?.data?.lp_list) ? data.data.lp_list : [];
  if (list.length === 0) return null;

  // Skip paused pools
  const active = list.filter(p => p.object?.is_pause !== true);
  if (active.length === 0) return null;

  // Prefer a SUI-paired pool for the most direct sell route
  const suiPool = active.find(
    p => p.coin_a_address === SUI_LONG || p.coin_b_address === SUI_LONG,
  );
  const best = suiPool ?? active[0];

  const coinTypeA: string = best.coin_a_address;
  const coinTypeB: string = best.coin_b_address;
  const tvlUsd: number = parseFloat(String(best.pure_tvl_in_usd)) || 0;

  // a2b=true means swap coin_a → coin_b.  We want to sell coinType, so:
  // isA2B = true  when our token occupies slot A
  // isA2B = false when our token occupies slot B
  const normInput = toMoveTypeName(coinType);
  const normA = toMoveTypeName(coinTypeA);
  const normB = toMoveTypeName(coinTypeB);

  // Sanity check: Cetus API sometimes returns a default/popular pool when
  // the queried coin_type doesn't exactly match any pool.  If neither slot
  // contains our token, this pool is useless for a sell test → discard it.
  if (normA !== normInput && normB !== normInput) {
    return null;
  }

  const isA2B = normA === normInput;

  return {
    source: 'cetus',
    coinType,
    poolId: best.address,
    coinTypeA,
    coinTypeB,
    isA2B,
    tvlUsd,
  };
}

async function findFixturePool(coinType: string): Promise<PoolInfo | null> {
  const client = getClient();
  const name = { type: '0x1::ascii::String', value: toMoveTypeName(coinType) };

  let field = await client.getDynamicFieldObject({
    parentId: config.FIXTURE_DEX_REGISTRY_ID,
    name,
  });

  // Sui testnet follower nodes can return stale null responses even when the
  // field exists. Retry once with a short delay before declaring no pool.
  if (!field.data) {
    await new Promise(r => setTimeout(r, 500));
    field = await client.getDynamicFieldObject({
      parentId: config.FIXTURE_DEX_REGISTRY_ID,
      name,
    });
  }

  if (!field.data) return null;
  return { source: 'fixture', coinType };
}

export async function findPool(coinType: string): Promise<PoolInfo | null> {
  // 1. Cetus mainnet — primary source for real tokens
  try {
    const cetusPool = await findCetusPool(coinType);
    if (cetusPool) return cetusPool;
  } catch (err) {
    console.warn('[findPool] Cetus lookup failed:', err);
  }

  // 2. FixtureDex — fallback for testnet fixture tokens
  try {
    const fixturePool = await findFixturePool(coinType);
    if (fixturePool) return fixturePool;
  } catch (err) {
    console.warn('[findPool] fixture lookup failed:', err);
  }

  return null;
}
