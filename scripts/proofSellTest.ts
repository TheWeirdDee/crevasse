/**
 * Diagnostic: proves the two-step Cetus sell test runs a real devInspect simulation.
 * Shows: (1) code path taken, (2) raw devInspect effects, (3) final SellTestResult.
 *
 *   npx tsx scripts/proofSellTest.ts
 */
import { getClient } from '../src/engine/client';
import { findPool } from '../src/engine/routing/findPool';
import { buildSellTx } from '../src/engine/routing/buildSellTx';
import { config } from '../src/engine/config';
import { sellTest } from '../src/engine/checks/sellTest';

const CETUS = '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS';
const USDC  = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

async function probe(label: string, coinType: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TOKEN: ${label}  (${coinType.slice(0, 20)}...)`);
  console.log('─'.repeat(60));

  // ── Step 1: findPool ────────────────────────────────────────────
  process.stdout.write('findPool()           → ');
  const pool = await findPool(coinType);
  if (!pool) {
    console.log('null  (no pool → sellTest returns unavailable)');
    return;
  }
  console.log(`source=${pool.source}  poolId=${pool.poolId?.slice(0, 10)}...`);
  console.log(`                        coinTypeA=${pool.coinTypeA?.slice(0, 30)}...`);
  console.log(`                        coinTypeB=${pool.coinTypeB?.slice(0, 30)}...`);
  console.log(`                        isA2B=${pool.isA2B}  tvlUsd=$${pool.tvlUsd?.toLocaleString()}`);

  // ── Step 2: buildSellTx → shows Cetus path, NO early return ────
  console.log(`\nbuildSellTx()        → pool.source='${pool.source}' → ${
    pool.source === 'cetus'
      ? 'buildCetusSellTestTx() [two-step buy→sell PTB]'
      : 'fixture_dex::swap_sell PTB'
  }`);
  const tx = await buildSellTx(pool);
  // Inspect how many commands the PTB has (proves it's not trivial)
  const ptbJson = tx.getData();
  const cmdCount = (ptbJson as any).commands?.length ?? '?';
  console.log(`                        PTB command count: ${cmdCount} (buy=~5 cmds + sell=~3 cmds + transfer)`);

  // ── Step 3: raw devInspect call ──────────────────────────────────
  process.stdout.write(`\ndevInspect()         → `);
  const client = getClient();
  const result = await client.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: config.DRY_RUN_SENDER,
  });

  const effectStatus = result.effects?.status;
  console.log(`effects.status.status = ${effectStatus?.status ?? 'MISSING'}`);
  if (effectStatus?.error) {
    console.log(`                        effects.status.error  = ${effectStatus.error}`);
  }
  if (result.error) {
    console.log(`                        result.error          = ${result.error}`);
  }

  // Show per-command results (proves which step passed/failed)
  if (result.results && result.results.length > 0) {
    console.log(`                        results[] per command: ${result.results.length} entries`);
    result.results.forEach((r: any, i: number) => {
      const retTypes = r.returnValues?.map((rv: any) =>
        `Coin<..> (${rv[1]})`).join(', ') ?? 'void';
      const errFlag = r.mutableReferenceOutputs?.length ? ' [mut-refs]' : '';
      console.log(`                          [${i}] returns: ${retTypes}${errFlag}`);
    });
  }

  // ── Step 4: high-level sellTest result for comparison ───────────
  process.stdout.write(`\nsellTest()           → `);
  const res = await sellTest(coinType);
  if (res.status === 'fail') {
    console.log(`FAIL  error="${(res as any).error}"`);
  } else {
    console.log(res.status.toUpperCase());
  }
}

async function main() {
  console.log('CREVASSE — raw devInspect proof\n');
  console.log('Confirming: Cetus sell test runs a REAL simulation, not pool-existence check.\n');

  await probe('CETUS', CETUS);
  await probe('USDC', USDC);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('Done.');
}

main().catch(console.error);
