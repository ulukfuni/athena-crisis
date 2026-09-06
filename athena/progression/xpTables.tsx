import { MaxHealth } from '../map/Configuration.tsx';
import { XpReward } from './Types.tsx';

/** Starting level for all seeded instances. */
export const STARTING_LEVEL = 1;

/** Soft level cap for Phase 1 (promotions later). */
export const MAX_LEVEL = 20;

/**
 * XP required to go from `level` → `level + 1`.
 * Kept low so the docs playground can level up in a fight or two.
 */
export function xpToNextForLevel(level: number): number {
  if (level >= MAX_LEVEL) {
    return 0;
  }
  return 20 + level * 15;
}

/**
 * XP from a combat outcome already exposed by AttackUnit (DryUnit health deltas).
 * damageDealt is HP lost by the defender; killed is true when defender was removed.
 */
export function xpRewardForCombat(damageDealt: number, killed: boolean): XpReward {
  const clamped = Math.max(0, Math.min(MaxHealth, Math.round(damageDealt)));
  const damageXp = Math.max(0, Math.floor(clamped * 0.75));
  const killBonusXp = killed ? 25 : 0;
  return { damageXp, killBonusXp };
}

export function totalXpFromReward(reward: XpReward): number {
  return reward.damageXp + reward.killBonusXp;
}
