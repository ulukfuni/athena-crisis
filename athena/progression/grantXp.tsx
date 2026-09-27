import { getGrowthRates } from './growthRates.tsx';
import { GrantXpResult, LevelUpEvent, UnitProgression } from './Types.tsx';
import { MAX_LEVEL, xpToNextForLevel } from './xpTables.tsx';

export function createProgression(
  characterId: string,
  unitInfoId: number,
  displayName?: string,
): UnitProgression {
  return {
    characterId,
    displayName,
    level: 1,
    xp: 0,
    xpToNext: xpToNextForLevel(1),
    hpBonus: 0,
    attackBonus: 0,
    defenseBonus: 0,
    unitInfoId,
  };
}

/**
 * Pure XP grant + level-up. Does not mutate map units — caller applies HP growth.
 */
export function grantXp(progression: UnitProgression, amount: number): GrantXpResult {
  if (amount <= 0 || progression.level >= MAX_LEVEL) {
    return {
      progression,
      leveledUp: false,
      levelUps: [],
      xpGained: 0,
    };
  }

  let current = progression;
  let remaining = amount;
  const levelUps: LevelUpEvent[] = [];

  while (remaining > 0 && current.level < MAX_LEVEL) {
    const need = current.xpToNext;
    if (remaining < need) {
      current = {
        ...current,
        xp: current.xp + remaining,
        xpToNext: need - remaining,
      };
      remaining = 0;
      break;
    }

    remaining -= need;
    const fromLevel = current.level;
    const toLevel = fromLevel + 1;
    const growth = getGrowthRates(current.unitInfoId);
    current = {
      ...current,
      level: toLevel,
      xp: 0,
      xpToNext: xpToNextForLevel(toLevel),
      hpBonus: current.hpBonus + growth.hp,
      attackBonus: current.attackBonus + growth.attack,
      defenseBonus: current.defenseBonus + growth.defense,
    };
    levelUps.push({
      characterId: current.characterId,
      displayName: current.displayName,
      fromLevel,
      toLevel,
      growth,
      progression: current,
    });
  }

  return {
    progression: current,
    leveledUp: levelUps.length > 0,
    levelUps,
    xpGained: amount - remaining,
  };
}
