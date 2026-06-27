import { getClient } from '../src/engine/client';

async function main() {
  const client = getClient();
  const coinType = '0x5d4b302506645c37ff133b98c4b50a5ae1484161472e3a130094502764717409::coin::COIN';
  const packageId = coinType.split('::')[0];

  try {
    // Query recent transaction blocks that modified/used the package
    const txs = await client.queryTransactionBlocks({
      filter: {
        InputObject: packageId
      },
      options: {
        showObjectChanges: true
      },
      limit: 10
    });

    console.log(`Found ${txs.data.length} transactions.`);
    
    // Scan for created/mutated Coin<USDC> objects
    for (const tx of txs.data) {
      const changes = tx.objectChanges;
      if (!changes) continue;
      
      const coinObject = changes.find(c => 
        (c.type === 'created' || c.type === 'mutated') && 
        c.objectType === `0x2::coin::Coin<${coinType}>`
      );

      if (coinObject) {
        console.log('Found coin object:', coinObject);
        // We can inspect its details to make sure it's valid
        if ('objectId' in coinObject) {
          const detail = await client.getObject({
            id: coinObject.objectId,
            options: { showContent: true }
          });
          console.log('Coin details:', JSON.stringify(detail.data, null, 2));
          break;
        }
      }
    }
  } catch (err: any) {
    console.error('Failed to find coin object:', err.message);
  }
}

main().catch(console.error);
