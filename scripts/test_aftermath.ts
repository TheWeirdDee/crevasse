import { Aftermath } from 'aftermath-ts-sdk';

async function main() {
  console.log('Initializing Aftermath SDK for MAINNET...');
  try {
    const afSdk = await Aftermath.create({ network: 'MAINNET' });
    console.log('Aftermath SDK initialized. Network:', afSdk.network);

    const router = afSdk.Router();

    // Let's swap USDC to SUI on MAINNET
    const coinInType = '0xdba546b6a307dc0244bfa69fa90b7a0f9687e838ceb9021a29486c47895e69e4::usdc::USDC';
    const coinOutType = '0x2::sui::SUI';
    const coinInAmount = BigInt(1_000_000); // 1 USDC (6 decimals)

    console.log(`Querying trade route for ${coinInAmount} of ${coinInType} -> ${coinOutType}...`);
    const route = await router.getCompleteTradeRouteGivenAmountIn({
      coinInType,
      coinOutType,
      coinInAmount,
    });
    console.log('Trade route found:', JSON.stringify(route, null, 2));
  } catch (err: any) {
    console.error('Error with Aftermath SDK:', err);
  }
}

main().catch(console.error);
