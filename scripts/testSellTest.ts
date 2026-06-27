import { config } from '../src/engine/config';
import { sellTest } from '../src/engine/checks/sellTest';

const tokens = [
  {
    label: 'SUI                (expect: pass)',
    coinType: '0x2::sui::SUI',
  },
  {
    label: 'HONEYPOT_COIN      (expect: fail)',
    coinType: `${config.HONEYPOT_PACKAGE_ID}::honeypot_coin::HONEYPOT_COIN`,
  },
  {
    label: 'NOPOOL_COIN        (expect: unavailable)',
    coinType: `${config.NOPOOL_PACKAGE_ID}::nopool_coin::NOPOOL_COIN`,
  },
];

async function main() {
  console.log('CREVASSE Phase 0 — Sell Test\n');
  let allOk = true;

  for (const { label, coinType } of tokens) {
    process.stdout.write(`  ${label} ... `);
    const result = await sellTest(coinType);

    if (result.status === 'pass') {
      console.log('PASS');
    } else if (result.status === 'fail') {
      console.log(`FAIL  (${result.error})`);
    } else {
      console.log('UNAVAILABLE');
    }

    const expected =
      label.includes('pass') ? 'pass' :
      label.includes('fail') ? 'fail' :
      'unavailable';

    if (result.status !== expected) {
      console.error(`    WRONG — expected ${expected}, got ${result.status}`);
      allOk = false;
    }
  }

  console.log('');
  if (allOk) {
    console.log('All three results correct. Phase 0 spine proven.');
  } else {
    console.error('One or more results were unexpected.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
