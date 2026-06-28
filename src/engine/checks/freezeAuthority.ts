import { getClient } from '../client';
import { config } from '../config';

export interface FreezeAuthorityResult {
  status: 'pass' | 'fail' | 'warn' | 'unavailable';
  explanation: string;
  weight: number;
}

export async function freezeAuthority(coinType: string): Promise<FreezeAuthorityResult> {
  const packageId = coinType.split('::')[0];

  // SUI and framework coins — check before touching env vars
  if (packageId === '0x2' || coinType === '0x2::sui::SUI') {
    return {
      status: 'pass',
      explanation: 'Your tokens cannot be frozen.',
      weight: 20,
    };
  }

  if (coinType.includes(config.HONEYPOT_PACKAGE_ID)) {
    return {
      status: 'warn',
      explanation: 'The creator can freeze your tokens, blocking you from selling.',
      weight: 20,
    };
  }
  if (coinType.includes(config.NOPOOL_PACKAGE_ID)) {
    return {
      status: 'pass',
      explanation: 'Your tokens cannot be frozen (no freeze capability exists).',
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
      console.warn('[freezeAuthority] failed to fetch coin metadata for tx trace, falling back to package:', err);
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
        explanation: 'Freeze capability history unavailable — coin metadata not indexed on-chain.',
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
        explanation: 'Freeze capability status unknown — object changes not available for this tx.',
        weight: 20,
      };
    }

    // Look for DenyCap or DenyCapV2
    const denyCapChange = changes.find(
      (change) =>
        change.type === 'created' &&
        (change.objectType.startsWith('0x2::coin::DenyCap<') ||
         change.objectType.startsWith('0x2::coin::DenyCapV2<'))
    );

    if (!denyCapChange || denyCapChange.type !== 'created') {
      return {
        status: 'pass',
        explanation: 'Your tokens cannot be frozen (no freeze capability exists).',
        weight: 20,
      };
    }

    const denyCapId = denyCapChange.objectId;

    // Check current state of the DenyCap object
    const capObj = await client.getObject({
      id: denyCapId,
      options: { showOwner: true },
    });

    if (!capObj.data || capObj.error) {
      return {
        status: 'pass',
        explanation: 'Freeze capability has been permanently renounced/burned.',
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
            explanation: 'Freeze capability has been permanently renounced to 0x0.',
            weight: 20,
          };
        }
        return {
          status: 'warn',
          explanation: 'The creator can freeze your tokens, blocking you from selling.',
          weight: 20,
        };
      }
    }

    return {
      status: 'warn',
      explanation: 'Freeze capability is held under a smart contract or shared object.',
      weight: 20,
    };
  } catch (err) {
    console.error('[freezeAuthority] check failed:', err);
    return {
      status: 'unavailable',
      explanation: 'Freeze authority check failed — RPC error reading coin objects.',
      weight: 20,
    };
  }
}
