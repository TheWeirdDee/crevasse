/**
 * Live integration test for the two-step Cetus sell test.
 * Run with: npx tsx scripts/testCetusSell.ts
 */
import { sellTest } from '../src/engine/checks/sellTest';

// Native Circle USDC on Sui mainnet — liquid on Cetus, should be PASS
const USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

// Mainnet CETUS token — should be PASS
const CETUS = '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS';

async function run(label: string, coinType: string, expect: string) {
  process.stdout.write(`  ${label.padEnd(18)} (expect: ${expect.padEnd(12)}) ... `);
  try {
    const res = await sellTest(coinType);
    const status = res.status.toUpperCase();
    const ok = status === expect.toUpperCase();
    const mark = ok ? 'PASS ✓' : `MISMATCH — got ${status}`;
    if ('error' in res) {
      console.log(`${mark}  [${(res as any).error}]`);
    } else {
      console.log(mark);
    }
  } catch (err: any) {
    console.log(`ERROR — ${err.message}`);
  }
}

async function main() {
  console.log('\nCREVASSE — Cetus real sell-test\n');
  await run('USDC (mainnet)', USDC, 'pass');
  await run('CETUS (mainnet)', CETUS, 'pass');
  console.log('\nDone.\n');
}

main().catch(console.error);
