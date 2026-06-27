import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { getClient } from '../client';

export interface VerdictOnChain {
  txDigest:    string;
  explorerUrl: string;
}

// Verdict tier numbers must match the Move contract constants.
const VERDICT_U8: Record<'safe' | 'thin' | 'crevasse', number> = {
  safe:     0,
  thin:     1,
  crevasse: 2,
};

/**
 * Sign and submit a verdict to the mainnet verdict registry.
 * Returns null (silently) when the required env vars are not configured.
 */
export async function writeVerdict(
  coinType: string,
  verdict:  'safe' | 'thin' | 'crevasse',
  score:    number,
): Promise<VerdictOnChain | null> {
  const privkey    = process.env.VERDICT_WRITER_PRIVKEY;
  const registryId = process.env.VERDICT_REGISTRY_ID;
  const packageId  = process.env.VERDICT_PACKAGE_ID;

  if (!privkey || !registryId || !packageId) return null;

  const keypair = Ed25519Keypair.fromSecretKey(privkey);

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::verdict_registry::record_verdict`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(coinType),
      tx.pure.u8(VERDICT_U8[verdict]),
      tx.pure.u8(Math.min(100, Math.max(0, Math.round(score)))),
      tx.object('0x6'), // Sui Clock singleton — always 0x6 on every network
    ],
  });

  const client = getClient();
  const result = await client.signAndExecuteTransaction({
    signer:      keypair,
    transaction: tx,
    options:     { showEffects: true },
  });

  if (result.effects?.status.status !== 'success') {
    console.error('[writeVerdict] tx failed:', result.effects?.status);
    return null;
  }

  return {
    txDigest:    result.digest,
    explorerUrl: `https://suiscan.xyz/mainnet/tx/${result.digest}`,
  };
}
