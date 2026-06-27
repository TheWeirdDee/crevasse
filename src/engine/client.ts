import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { config } from './config';

let _client: SuiJsonRpcClient | null = null;

export function getClient(): SuiJsonRpcClient {
  if (!_client) {
    const isMainnet = config.SUI_RPC_URL.includes('mainnet');
    const isDevnet = config.SUI_RPC_URL.includes('devnet');
    const network = isMainnet ? 'mainnet' : isDevnet ? 'devnet' : 'testnet';
    const baseClient = new SuiJsonRpcClient({ 
      url: config.SUI_RPC_URL,
      network 
    });

    _client = new Proxy(baseClient, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') {
          return async function (...args: any[]) {
            let retries = 4;
            let delay = 350;
            while (true) {
              try {
                return await value.apply(target, args);
              } catch (err: any) {
                const errStr = String(err);
                const is429 = err?.status === 429 || 
                              errStr.includes('429') || 
                              errStr.toLowerCase().includes('too many requests');
                if (is429 && retries > 0) {
                  console.warn(`[client] RPC Rate limit (429) on method '${String(prop)}'. Retrying in ${delay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  retries--;
                  delay *= 2;
                  continue;
                }
                throw err;
              }
            }
          };
        }
        return value;
      }
    });
  }
  return _client;
}
