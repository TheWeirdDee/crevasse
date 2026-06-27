import { holders } from '../src/engine/checks/holders';

const TESTS = [
  { label: 'SUI',  coin: '0x2::sui::SUI' },
  { label: 'USDC', coin: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC' },
  { label: 'CETUS', coin: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS' },
];

async function main() {
  console.log('holders check\n');
  for (const { label, coin } of TESTS) {
    process.stdout.write(`${label.padEnd(6)} → `);
    try {
      const r = await holders(coin);
      console.log(JSON.stringify(r));
    } catch (e: any) {
      console.log(`THREW: ${e.message}`);
    }
  }
}

main().catch(console.error);
