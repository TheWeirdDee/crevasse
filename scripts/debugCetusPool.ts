import { findPool } from '../src/engine/routing/findPool';
import { buildCetusSellTestTx } from '../src/engine/routing/buildSellTx';

// Test address that might be wrong (65 chars — intentional typo from test)
const USDC_TYPO = '0x5d4b302506645c37ff133b98c4b50a5ae14841612472e3a130094502764717409::coin::COIN';
// Correct mainnet Wormhole USDC — 64 hex chars
const USDC_CORRECT = '0x5d4b302506645c37ff133b98c4b50a5ae1484161472e3a130094502764717409::coin::COIN';
const CETUS = '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS';

async function debug(label: string, coinType: string) {
  console.log(`\n── ${label} ──`);
  console.log(`  coinType:  ${coinType}`);
  const pool = await findPool(coinType);
  if (!pool) { console.log('  pool:      null (no pool found)'); return; }
  console.log(`  pool:      source=${pool.source}`);
  console.log(`  poolId:    ${pool.poolId}`);
  console.log(`  coinTypeA: ${pool.coinTypeA}`);
  console.log(`  coinTypeB: ${pool.coinTypeB}`);
  console.log(`  isA2B:     ${pool.isA2B}`);
  console.log(`  tvlUsd:    ${pool.tvlUsd}`);
}

async function main() {
  await debug('USDC (typo address)', USDC_TYPO);
  await debug('USDC (correct 64-char)', USDC_CORRECT);
  await debug('CETUS', CETUS);
}

main().catch(console.error);
