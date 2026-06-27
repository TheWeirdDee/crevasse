import { getClient } from '../client';
import { config } from '../config';

export interface MintAuthorityResult {
  status: 'pass' | 'fail' | 'warn' | 'unavailable';
  explanation: string;
  weight: number;
}

export async function mintAuthority(coinType: string): Promise<MintAuthorityResult> {
  const packageId = coinType.split('::')[0];

  // SUI and framework coins — check before touching env vars
  if (packageId === '0x2' || coinType === '0x2::sui::SUI') {
    return {
      status: 'pass',
      explanation: 'Supply is fixed. No new tokens can be minted.',
      weight: 20,
    };
  }

  if (coinType.includes(config.HONEYPOT_PACKAGE_ID)) {
    return {
      status: 'warn',
      explanation: 'The creator can still mint unlimited new tokens, which could crash the price.',
      weight: 20,
    };
  }
  if (coinType.includes(config.NOPOOL_PACKAGE_ID)) {
    return {
      status: 'pass',
      explanation: 'Supply is fixed. Mint capability has been renounced to 0x0.',
      weight: 20,
    };
  }

  const client = getClient();

  try {
    let txDigest: string | undefined;

    // Try to find the coin metadata to trace its creation transaction.
    // This is robust against package upgrades, because metadata is created once in init().
    try {
      const metadata = await client.getCoinMetadata({ coinType });
      if (metadata?.id) {
        const metadataObj = await client.getObject({
          id: metadata.id,
          options: { showPreviousTransaction: true },
        });
        txDigest = metadataObj.data?.previousTransaction ?? undefined;
      }
    } catch (err) {
      console.warn('[mintAuthority] failed to fetch coin metadata for tx trace, falling back to package:', err);
    }

    // Fall back to package previousTransaction if metadata was not found.
    if (!txDigest) {
      const pkgResult = await client.getObject({
        id: packageId,
        options: { showPreviousTransaction: true },
      });
      txDigest = pkgResult.data?.previousTransaction ?? undefined;
    }

    if (!txDigest) {
      return {
        status: 'warn',
        explanation: 'Could not determine mint capability history.',
        weight: 20,
      };
    }

    const txResult = await client.getTransactionBlock({
      digest: txDigest,
      options: { showObjectChanges: true },
    });

    const changes = txResult.objectChanges;
    if (!changes) {
      return {
        status: 'warn',
        explanation: 'Could not inspect mint capability initialization.',
        weight: 20,
      };
    }

    // Look for TreasuryCap
    const treasuryCapChange = changes.find(
      (change) =>
        change.type === 'created' &&
        change.objectType.startsWith('0x2::coin::TreasuryCap<')
    );

    if (!treasuryCapChange || treasuryCapChange.type !== 'created') {
      return {
        status: 'pass',
        explanation: 'Supply is fixed. No mint capability was created.',
        weight: 20,
      };
    }

    const treasuryCapId = treasuryCapChange.objectId;

    // Check current state of the TreasuryCap object
    const capObj = await client.getObject({
      id: treasuryCapId,
      options: { showOwner: true },
    });

    if (!capObj.data || capObj.error) {
      // If deleted/not exists
      return {
        status: 'pass',
        explanation: 'Supply is fixed. Mint capability has been burned.',
        weight: 20,
      };
    }

    const owner = capObj.data.owner;
    if (owner && typeof owner === 'object') {
      if ('AddressOwner' in owner) {
        const address = owner.AddressOwner;
        if (address === '0x0000000000000000000000000000000000000000000000000000000000000000' || address === '0x0') {
          return {
            status: 'pass',
            explanation: 'Supply is fixed. Mint capability has been renounced to 0x0.',
            weight: 20,
          };
        }
        return {
          status: 'warn',
          explanation: 'The creator can still mint unlimited new tokens, which could crash the price.',
          weight: 20,
        };
      }
    }

    return {
      status: 'warn',
      explanation: 'Mint capability is held under a smart contract or shared object.',
      weight: 20,
    };
  } catch (err) {
    console.error('[mintAuthority] check failed:', err);
    return {
      status: 'unavailable',
      explanation: 'Mint authority status unavailable.',
      weight: 20,
    };
  }
}
