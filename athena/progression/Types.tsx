import { ID } from '../MapData.tsx';

/**
 * Phase 1: XP + levels on unique unit instances.
 * Later phases plug into the stub interfaces below without rewriting combat.
 */

export type CharacterId = string;

export type UnitProgression = Readonly<{
  /** Stable id for this unique instance (FE-style character). */
  characterId: CharacterId;
  /** Optional display name for uniqueness (not Nintendo class names). */
  displayName?: string;
  level: number;
  xp: number;
  xpToNext: number;
  /** Accumulated flat HP restored on level-ups (display / future max-HP). */
  hpBonus: number;
  /** Additive attack status-effect bonus (e.g. 0.05 = +5%). */
  attackBonus: number;
  /** Additive defense status-effect bonus. */
  defenseBonus: number;
  /** Unit type id when seeded (for growth lookup). */
  unitInfoId: ID;
}>;

export type GrowthRates = Readonly<{
  /** HP restored on the unit when leveling (capped by MaxHealth). */
  hp: number;
  /** Added to attackBonus each level. */
  attack: number;
  /** Added to defenseBonus each level. */
  defense: number;
}>;

export type XpReward = Readonly<{
  damageXp: number;
  killBonusXp: number;
}>;

export type LevelUpEvent = Readonly<{
  characterId: CharacterId;
  displayName?: string;
  fromLevel: number;
  toLevel: number;
  growth: GrowthRates;
  progression: UnitProgression;
}>;

export type GrantXpResult = Readonly<{
  progression: UnitProgression;
  leveledUp: boolean;
  levelUps: ReadonlyArray<LevelUpEvent>;
  xpGained: number;
}>;

/** Phase 2 stub: learned skills on a unit instance. */
export type UnitSkillSlot = Readonly<{
  skillId: string;
  rank?: number;
}>;

/** Phase 2 stub: inventory / equipment. */
export type UnitItemSlot = Readonly<{
  itemId: string;
  equipped?: boolean;
}>;

/** Phase 2 stub: class promotion. */
export type PromotionOption = Readonly<{
  toUnitInfoId: ID;
  requiredLevel: number;
}>;

export type UnitProgressionExtensions = Readonly<{
  skills?: ReadonlyArray<UnitSkillSlot>;
  items?: ReadonlyArray<UnitItemSlot>;
  promotion?: PromotionOption | null;
}>;
