import type { SellTestResult } from '../checks/sellTest';
import type { MintAuthorityResult } from '../checks/mintAuthority';
import type { FreezeAuthorityResult } from '../checks/freezeAuthority';
import type { LiquidityResult } from '../checks/liquidity';
import type { HoldersResult } from '../checks/holders';

export interface AssembleResult {
  verdict: 'safe' | 'thin' | 'crevasse';
  score: number;
}

export function assemble(
  sellTest: SellTestResult,
  mintAuth: MintAuthorityResult,
  freezeAuth: FreezeAuthorityResult,
  liq: LiquidityResult,
  hold: HoldersResult
): AssembleResult {
  // If the sell test failed, it is a confirmed honeypot -> absolute CREVASSE and score 0
  if (sellTest.status === 'fail') {
    return { verdict: 'crevasse', score: 0 };
  }

  // Calculate score based on weights
  // Max possible score is 100
  // Weights:
  // - sellTest: 20 points (pass = 20, unavailable = 10)
  // - mintAuth: 20 points (pass = 20, warn = 5, fail = 0, unavailable = 10)
  // - freezeAuth: 20 points (pass = 20, warn = 5, fail = 0, unavailable = 10)
  // - liq: 20 points (pass = 20, warn = 10, fail = 0, unavailable = 10)
  // - hold: 20 points (pass = 20, warn = 5, fail = 0, unavailable = 10)

  let score = 0;

  // 1. Sell Test (20 points)
  if (sellTest.status === 'pass') {
    score += 20;
  } else if (sellTest.status === 'unavailable') {
    score += 10;
  }

  // 2. Mint Auth (20 points)
  if (mintAuth.status === 'pass') {
    score += 20;
  } else if (mintAuth.status === 'warn') {
    score += 5;
  } else if (mintAuth.status === 'unavailable') {
    score += 10;
  }

  // 3. Freeze Auth (20 points)
  if (freezeAuth.status === 'pass') {
    score += 20;
  } else if (freezeAuth.status === 'warn') {
    score += 5;
  } else if (freezeAuth.status === 'unavailable') {
    score += 10;
  }

  // 4. Liquidity (20 points)
  if (liq.status === 'pass') {
    score += 20;
  } else if (liq.status === 'warn') {
    score += 10;
  } else if (liq.status === 'unavailable') {
    score += 10;
  }

  // 5. Holders (20 points)
  if (hold.status === 'pass') {
    score += 20;
  } else if (hold.status === 'warn') {
    score += 5;
  } else if (hold.status === 'unavailable') {
    score += 10;
  }

  // Determine verdict based on final score and specific check outcomes
  let verdict: 'safe' | 'thin' | 'crevasse' = 'safe';

  if (score >= 80) {
    // If either mint or freeze authority is warn, demote to thin ice
    if (mintAuth.status === 'warn' || freezeAuth.status === 'warn') {
      verdict = 'thin';
    } else {
      verdict = 'safe';
    }
  } else if (score >= 40) {
    verdict = 'thin';
  } else {
    verdict = 'crevasse';
  }

  // If we have a warning on mint or freeze capability, we can never be 'safe'
  if (verdict === 'safe' && (mintAuth.status === 'warn' || freezeAuth.status === 'warn')) {
    verdict = 'thin';
  }

  // If sellTest is unavailable and everything else passes, demote to thin ice
  if (sellTest.status === 'unavailable' && verdict === 'safe') {
    verdict = 'thin';
  }

  return { verdict, score };
}
