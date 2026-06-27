import { CetusClmmSDK } from '@cetusprotocol/sui-clmm-sdk';

async function main() {
  const sdk = CetusClmmSDK.createSDK({ env: 'testnet' });
  console.log('Cetus SDK initialized.');
  try {
    const coinA = '0x2::sui::SUI';
    const coinB = '0x5d4b302506645c37ff133b98c4b50a5ae1484161472e3a130094502764717409::coin::COIN'; // USDC Testnet
    const pool = await sdk.Pool.getPoolByCoins([coinA, coinB]);
    console.log('Pool result:', JSON.stringify(pool, null, 2));
  } catch (err: any) {
    console.error('Failed to retrieve pool:', err.message);
  }
}

main().catch(console.error);
