import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Bypass TLS verification locally to prevent UNABLE_TO_VERIFY_LEAF_SIGNATURE on Windows/certain network environments
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

function get(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const config = {
  get SUI_RPC_URL() { return get('SUI_RPC_URL'); },
  get FIXTURE_DEX_PACKAGE_ID() { return get('FIXTURE_DEX_PACKAGE_ID'); },
  get FIXTURE_DEX_REGISTRY_ID() { return get('FIXTURE_DEX_REGISTRY_ID'); },
  get HONEYPOT_PACKAGE_ID() { return get('HONEYPOT_PACKAGE_ID'); },
  get NOPOOL_PACKAGE_ID() { return get('NOPOOL_PACKAGE_ID'); },
  get DRY_RUN_SENDER() { return get('DRY_RUN_SENDER'); },
};
