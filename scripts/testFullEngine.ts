import { sellTest } from '../src/engine/checks/sellTest';
import { mintAuthority } from '../src/engine/checks/mintAuthority';
import { freezeAuthority } from '../src/engine/checks/freezeAuthority';
import { liquidity } from '../src/engine/checks/liquidity';
import { holders } from '../src/engine/checks/holders';
import { assemble } from '../src/engine/verdict/assemble';
import { config } from '../src/engine/config';

const tokens = [
  {
    label: 'SUI                (expect: safe)',
    coinType: '0x2::sui::SUI',
  },
  {
    label: 'HONEYPOT_COIN      (expect: crevasse)',
    coinType: `${config.HONEYPOT_PACKAGE_ID}::honeypot_coin::HONEYPOT_COIN`,
  },
  {
    label: 'NOPOOL_COIN        (expect: thin)',
    coinType: `${config.NOPOOL_PACKAGE_ID}::nopool_coin::NOPOOL_COIN`,
  },
];

async function main() {
  console.log('CREVASSE Phase 1 — Full Engine Test\n');

  for (const { label, coinType } of tokens) {
    console.log(`Checking Token: ${label}`);
    console.log(`Coin Type:      ${coinType}`);
    
    const [sellRes, mintRes, freezeRes, liqRes, holdRes] = await Promise.all([
      sellTest(coinType),
      mintAuthority(coinType),
      freezeAuthority(coinType),
      liquidity(coinType),
      holders(coinType)
    ]);

    console.log('  - sellTest:       ', sellRes);
    console.log('  - mintAuthority:  ', mintRes);
    console.log('  - freezeAuthority:', freezeRes);
    console.log('  - liquidity:      ', liqRes);
    console.log('  - holders:        ', holdRes);

    const assembled = assemble(sellRes, mintRes, freezeRes, liqRes, holdRes);
    console.log('  => VERDICT:       ', assembled.verdict.toUpperCase(), `(Score: ${assembled.score}/100)`);
    console.log('-'.repeat(60) + '\n');
  }
}

main().catch(console.error);
