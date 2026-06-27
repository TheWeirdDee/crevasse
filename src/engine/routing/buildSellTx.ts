import { Transaction } from '@mysten/sui/transactions';
import { CLOCK_ADDRESS } from '@cetusprotocol/common-sdk';
import { config } from '../config';
import { type PoolInfo, getCetusSdk } from './findPool';

// Cetus CLMM sqrt-price bounds for swap direction:
//   a2b=true  (selling A→B): use MIN so pool never rejects on price
//   a2b=false (selling B→A): use MAX so pool never rejects on price
const MIN_SQRT_PRICE = '4295048016';
const MAX_SQRT_PRICE = '79226673515401279992447579055';

function sqrtPriceLimit(a2b: boolean): string {
  return a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE;
}

/**
 * Build a two-step Cetus PTB that tests whether the token can actually be sold.
 *
 * Step 1 (BUY): Split SUI from the synthetic gas object → swap for the target token.
 * Step 2 (SELL): Swap the acquired token back for SUI.
 *
 * devInspectTransactionBlock provides a synthetic gas object so splitCoins(tx.gas)
 * works without the sender holding any real SUI.  If step 2 aborts with a non-Cetus,
 * non-balance error the token contract is blocking the sell → honeypot.
 */
export async function buildCetusSellTestTx(pool: PoolInfo): Promise<Transaction> {
  if (!pool.poolId || !pool.coinTypeA || !pool.coinTypeB || pool.isA2B === undefined) {
    throw new Error('buildCetusSellTestTx: pool info incomplete');
  }

  const sdk = getCetusSdk();
  const opts = sdk.sdkOptions;
  const INTEGRATE_PKG   = opts.integrate.published_at;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GLOBAL_CONFIG   = (opts.clmm_pool as any).config?.global_config_id as string;
  const CLOCK           = CLOCK_ADDRESS;

  const { poolId, coinTypeA, coinTypeB, isA2B } = pool;
  const SELL_SUI_BUDGET = 5_000_000; // 0.005 SUI from gas for the buy step

  const tx = new Transaction();
  tx.setSender(config.DRY_RUN_SENDER);
  tx.setGasBudget(30_000_000);

  // ── Step 1: BUY the target token using SUI from gas ──────────────────────────
  //
  // If isA2B=true → pool layout is TOKEN(A) / SUI(B), sell direction is a2b=true.
  //   To BUY the token we go b→a (a2b=false): provide SUI as coin_b, zero as coin_a.
  // If isA2B=false → pool layout is SUI(A) / TOKEN(B), sell direction is a2b=false.
  //   To BUY the token we go a→b (a2b=true): provide SUI as coin_a, zero as coin_b.

  const [suiFromGas] = tx.splitCoins(tx.gas, [tx.pure.u64(SELL_SUI_BUDGET)]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let boughtToken: any;  // Coin<TOKEN> PTB reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leftSuiAfterBuy: any;  // Coin<SUI> PTB reference

  if (isA2B) {
    // Pool: coinA=TOKEN, coinB=SUI  →  buy = b→a (a2b=false)
    const zeroCoinA = tx.moveCall({ target: '0x2::coin::zero', typeArguments: [coinTypeA] });
    const buyRes = tx.moveCall({
      target: `${INTEGRATE_PKG}::router::swap`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        tx.object(GLOBAL_CONFIG), tx.object(poolId),
        zeroCoinA,                        // coin_a: zero TOKEN (we're acquiring this)
        suiFromGas,                       // coin_b: SUI we're spending
        tx.pure.bool(false),              // a2b=false (b→a)
        tx.pure.bool(true),               // by_amount_in=true (spend exact SUI)
        tx.pure.u64(SELL_SUI_BUDGET),     // amount = SUI to spend
        tx.pure.u128(sqrtPriceLimit(false)),
        tx.pure.bool(false),
        tx.object(CLOCK),
      ],
    });
    // buyRes = [Coin<TOKEN>, Coin<SUI>]
    boughtToken      = buyRes[0];
    leftSuiAfterBuy  = buyRes[1];

    // ── Step 2: SELL the token back for SUI (a2b=true) ─────────────────────
    const zeroCoinB = tx.moveCall({ target: '0x2::coin::zero', typeArguments: [coinTypeB] });
    const sellRes = tx.moveCall({
      target: `${INTEGRATE_PKG}::router::swap`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        tx.object(GLOBAL_CONFIG), tx.object(poolId),
        boughtToken,                      // coin_a: the TOKEN we're selling
        zeroCoinB,                        // coin_b: zero SUI (we're receiving this)
        tx.pure.bool(true),               // a2b=true (a→b, TOKEN→SUI) ← SELL TEST
        tx.pure.bool(false),              // by_amount_in=false (specify desired output)
        tx.pure.u64(1),                   // amount = want at least 1 MIST SUI out
        tx.pure.u128(sqrtPriceLimit(true)),
        tx.pure.bool(false),
        tx.object(CLOCK),
      ],
    });
    // sellRes = [Coin<TOKEN> remainder, Coin<SUI> acquired]
    // Transfer all coins back to sender to avoid "unreferenced value" abort
    tx.transferObjects(
      [sellRes[0], leftSuiAfterBuy, sellRes[1]],
      tx.pure.address(config.DRY_RUN_SENDER),
    );

  } else {
    // Pool: coinA=SUI, coinB=TOKEN  →  buy = a→b (a2b=true)
    const zeroCoinB = tx.moveCall({ target: '0x2::coin::zero', typeArguments: [coinTypeB] });
    const buyRes = tx.moveCall({
      target: `${INTEGRATE_PKG}::router::swap`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        tx.object(GLOBAL_CONFIG), tx.object(poolId),
        suiFromGas,                       // coin_a: SUI we're spending
        zeroCoinB,                        // coin_b: zero TOKEN (we're acquiring this)
        tx.pure.bool(true),               // a2b=true (a→b)
        tx.pure.bool(true),               // by_amount_in=true
        tx.pure.u64(SELL_SUI_BUDGET),
        tx.pure.u128(sqrtPriceLimit(true)),
        tx.pure.bool(false),
        tx.object(CLOCK),
      ],
    });
    // buyRes = [Coin<SUI> remainder, Coin<TOKEN>]
    leftSuiAfterBuy = buyRes[0];
    boughtToken     = buyRes[1];

    // ── Step 2: SELL the token back for SUI (a2b=false) ────────────────────
    const zeroCoinA = tx.moveCall({ target: '0x2::coin::zero', typeArguments: [coinTypeA] });
    const sellRes = tx.moveCall({
      target: `${INTEGRATE_PKG}::router::swap`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        tx.object(GLOBAL_CONFIG), tx.object(poolId),
        zeroCoinA,                        // coin_a: zero SUI (we're receiving this)
        boughtToken,                      // coin_b: the TOKEN we're selling
        tx.pure.bool(false),              // a2b=false (b→a, TOKEN→SUI) ← SELL TEST
        tx.pure.bool(false),              // by_amount_in=false
        tx.pure.u64(1),                   // want at least 1 MIST SUI
        tx.pure.u128(sqrtPriceLimit(false)),
        tx.pure.bool(false),
        tx.object(CLOCK),
      ],
    });
    // sellRes = [Coin<SUI> acquired, Coin<TOKEN> remainder]
    tx.transferObjects(
      [sellRes[0], leftSuiAfterBuy, sellRes[1]],
      tx.pure.address(config.DRY_RUN_SENDER),
    );
  }

  return tx;
}

export async function buildSellTx(pool: PoolInfo): Promise<Transaction> {
  if (pool.source === 'cetus') {
    return buildCetusSellTestTx(pool);
  }

  // Fixture DEX: the fixture contract checks sell permission without
  // requiring real coin input, so this works with devInspectTransactionBlock.
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.FIXTURE_DEX_PACKAGE_ID}::fixture_dex::swap_sell`,
    typeArguments: [pool.coinType],
    arguments: [tx.object(config.FIXTURE_DEX_REGISTRY_ID)],
  });
  tx.setSender(config.DRY_RUN_SENDER);
  tx.setGasBudget(10_000_000);
  return tx;
}
