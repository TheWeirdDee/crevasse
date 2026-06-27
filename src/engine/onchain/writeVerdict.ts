import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

export interface VerdictOnChain {
  txDigest:    string;
  explorerUrl: string;
}

const VERDICT_U8: Record<'safe' | 'thin' | 'crevasse', number> = {
  safe:     0,
  thin:     1,
  crevasse: 2,
};

// Dedicated write client using the official Sui fullnode — confirmed to support
// sui_executeTransactionBlock without rate-limit concerns from read traffic.
let _writeClient: SuiJsonRpcClient | null = null;
function getWriteClient(): SuiJsonRpcClient {
  if (!_writeClient) {
    _writeClient = new SuiJsonRpcClient({
      url:     'https://fullnode.mainnet.sui.io:443',
      network: 'mainnet',
    });
  }
  return _writeClient;
}

export async function writeVerdict(
  coinType: string,
  verdict:  'safe' | 'thin' | 'crevasse',
  score:    number,
): Promise<VerdictOnChain | null> {
  const privkey    = process.env.VERDICT_WRITER_PRIVKEY;
  const registryId = process.env.VERDICT_REGISTRY_ID;
  const packageId  = process.env.VERDICT_PACKAGE_ID;

  if (!privkey) {
    console.warn('[writeVerdict] VERDICT_WRITER_PRIVKEY not set — skipping on-chain record');
    return null;
  }
  if (!registryId || !packageId) {
    console.warn('[writeVerdict] VERDICT_REGISTRY_ID or VERDICT_PACKAGE_ID not set — skipping');
    return null;
  }

  const keypair = Ed25519Keypair.fromSecretKey(privkey);

  const tx = new Transaction();
  tx.setSender(keypair.getPublicKey().toSuiAddress());
  tx.setGasBudget(10_000_000);
  tx.moveCall({
    target: `${packageId}::verdict_registry::record_verdict`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(coinType),
      tx.pure.u8(VERDICT_U8[verdict]),
      tx.pure.u8(Math.min(100, Math.max(0, Math.round(score)))),
      tx.object('0x6'),
    ],
  });

  const client = getWriteClient();
  const result = await client.signAndExecuteTransaction({
    signer:      keypair,
    transaction: tx,
    options:     { showEffects: true },
  });

  if (result.effects?.status.status !== 'success') {
    console.error('[writeVerdict] tx failed on-chain:', JSON.stringify(result.effects?.status));
    return null;
  }

  console.log('[writeVerdict] recorded:', result.digest);
  return {
    txDigest:    result.digest,
    explorerUrl: `https://suiscan.xyz/mainnet/tx/${result.digest}`,
  };
}
