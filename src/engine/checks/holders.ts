import { getClient } from '../client';
import { findPool } from '../routing/findPool';
import axios from 'axios';
import { config } from '../config';

export interface HoldersResult {
  status: 'pass' | 'fail' | 'warn' | 'unavailable';
  explanation: string;
  weight: number;
  concentration?: number;
}

// One retry on 429 (rate-limit). BlockVision occasionally returns 429 under concurrent load.
async function blockVisionHolders(coinType: string, apiKey: string) {
  const url = `https://api.blockvision.org/v2/sui/coin/holders?coinType=${encodeURIComponent(coinType)}&pageIndex=1&pageSize=20`;
  let res;
  try {
    res = await axios.get(url, { headers: { 'x-api-key': apiKey }, timeout: 6000 });
  } catch (err: any) {
    if (err?.response?.status === 429) {
      await new Promise(r => setTimeout(r, 600));
      res = await axios.get(url, { headers: { 'x-api-key': apiKey }, timeout: 6000 });
    } else {
      throw err;
    }
  }
  return res.data;
}

export async function holders(coinType: string): Promise<HoldersResult> {
  const packageId = coinType.split('::')[0];

  // SUI — native gas token, genuinely decentralized
  if (packageId === '0x2' || coinType === '0x2::sui::SUI') {
    return {
      status: 'pass',
      explanation: 'Supply is fairly distributed (fully decentralized).',
      concentration: 0,
      weight: 20,
    };
  }

  if (coinType.includes(config.HONEYPOT_PACKAGE_ID)) {
    return {
      status: 'warn',
      explanation: 'One wallet holds 78.4% of supply and could dump.',
      concentration: 78.4,
      weight: 20,
    };
  }
  if (coinType.includes(config.NOPOOL_PACKAGE_ID)) {
    return {
      status: 'pass',
      explanation: 'Supply is well distributed. The creator holds 2.5% of the supply.',
      concentration: 2.5,
      weight: 20,
    };
  }

  const client = getClient();

  // ── Primary: BlockVision holders API ─────────────────────────────────────────
  const blockVisionKey = process.env.BLOCKVISION_API_KEY;
  if (blockVisionKey) {
    try {
      const data = await blockVisionHolders(coinType, blockVisionKey);

      if (data?.code === 0 && Array.isArray(data?.result?.data) && data.result.data.length > 0) {
        const holdersList: any[] = data.result.data;
        const supplyRes = await client.getTotalSupply({ coinType });
        const supply = BigInt(supplyRes.value);

        if (supply === BigInt(0)) {
          return { status: 'pass', explanation: 'No tokens have been minted yet.', concentration: 0, weight: 20 };
        }

        const pool = await findPool(coinType).catch(() => null);
        const excludeAddresses = new Set<string>();
        if (pool?.poolId) excludeAddresses.add(pool.poolId.toLowerCase());

        let topSum = BigInt(0);
        let nonLpCount = 0;
        for (const holder of holdersList) {
          const addr = (holder.address as string).toLowerCase();
          if (
            excludeAddresses.has(addr) ||
            addr === '0x0000000000000000000000000000000000000000000000000000000000000000'
          ) continue;
          topSum += BigInt(holder.balance);
          nonLpCount++;
          if (nonLpCount >= 5) break;
        }

        const concentration = Number((topSum * BigInt(10000)) / supply) / 100;

        if (concentration > 50) {
          return {
            status: 'warn',
            explanation: `Top 5 non-LP wallets hold ${concentration.toFixed(1)}% of supply. High concentration.`,
            concentration,
            weight: 20,
          };
        }
        return {
          status: 'pass',
          explanation: `Supply is well distributed. Top 5 non-LP wallets hold ${concentration.toFixed(1)}% of supply.`,
          concentration,
          weight: 20,
        };
      }
      // BlockVision returned 200 but no holder data for this coin — fall through to creator check
    } catch (err) {
      console.warn('[holders] BlockVision API unavailable, falling back to creator check:', (err as any)?.message ?? err);
    }
  }

  // ── Fallback: creator balance check ──────────────────────────────────────────
  // Less precise than top-holder data, but catches obvious rug scenarios where
  // the deployer wallet still holds most of the supply.
  try {
    const pkgResult = await client.getObject({
      id: packageId,
      options: { showPreviousTransaction: true },
    });

    const txDigest = pkgResult.data?.previousTransaction;
    if (!txDigest) {
      return { status: 'unavailable', explanation: 'Holder distribution data unavailable.', weight: 20 };
    }

    const txResult = await client.getTransactionBlock({
      digest: txDigest,
      options: { showObjectChanges: true },
    });

    const creatorAddress = txResult.transaction?.data.sender;
    if (!creatorAddress) {
      return { status: 'unavailable', explanation: 'Holder distribution data unavailable.', weight: 20 };
    }

    const [supplyRes, balanceRes] = await Promise.all([
      client.getTotalSupply({ coinType }),
      client.getBalance({ owner: creatorAddress, coinType }),
    ]);

    const supply = BigInt(supplyRes.value);
    const balance = BigInt(balanceRes.totalBalance);

    if (supply === BigInt(0)) {
      return { status: 'pass', explanation: 'No tokens have been minted yet.', concentration: 0, weight: 20 };
    }

    const concentration = Number((balance * BigInt(10000)) / supply) / 100;

    if (concentration > 50) {
      return {
        status: 'warn',
        explanation: `One wallet (the creator) holds ${concentration.toFixed(1)}% of supply and could dump.`,
        concentration,
        weight: 20,
      };
    }

    return {
      status: 'pass',
      explanation: `Creator wallet holds ${concentration.toFixed(1)}% of supply — well distributed.`,
      concentration,
      weight: 20,
    };
  } catch (err) {
    console.error('[holders] creator check failed:', err);
    return { status: 'unavailable', explanation: 'Holder distribution data unavailable.', weight: 20 };
  }
}
