/**
 * Modular unit progression (Phase 1: XP + levels).
 * Skills / inventory / promotions: see stub types in Types.tsx.
 */
export { default as ProgressionStore } from './ProgressionStore.tsx';
export type { ProgressionSnapshot } from './ProgressionStore.tsx';
export { createProgression, grantXp } from './grantXp.tsx';
export { getGrowthRates, DEFAULT_GROWTH } from './growthRates.tsx';
export {
  xpToNextForLevel,
  xpRewardForCombat,
  totalXpFromReward,
  STARTING_LEVEL,
  MAX_LEVEL,
} from './xpTables.tsx';
export { applyLevelUpHeals } from './applyGrowth.tsx';
export { processAttackUnitProgression } from './processCombat.tsx';
export type { AttackCombatSnapshot, CombatProgressionOutcome } from './processCombat.tsx';
export {
  setActiveProgressionStore,
  getActiveProgressionStore,
  getProgressionAt,
  getProgressionAttackBonus,
  getProgressionDefenseBonus,
} from './registry.tsx';
export type {
  CharacterId,
  UnitProgression,
  GrowthRates,
  XpReward,
  LevelUpEvent,
  GrantXpResult,
  UnitSkillSlot,
  UnitItemSlot,
  PromotionOption,
  UnitProgressionExtensions,
} from './Types.tsx';
