import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { applyLevelUpHeals } from './applyGrowth.tsx';
import ProgressionStore from './ProgressionStore.tsx';
import { LevelUpEvent } from './Types.tsx';

export type AttackCombatSnapshot = Readonly<{
  from: Vector;
  to: Vector;
  /** Defender HP after attack; omit/undefined when destroyed. */
  defenderHealthAfter: number | null | undefined;
}>;

export type CombatProgressionOutcome = Readonly<{
  map: MapData;
  levelUps: ReadonlyArray<LevelUpEvent>;
  xpGained: number;
  attackerPosition: Vector | null;
}>;

/**
 * Hook after unit-vs-unit combat is applied to MapData.
 * Grants XP from damage / kill already computed by the engine.
 */
export function processAttackUnitProgression(
  mapBefore: MapData,
  mapAfter: MapData,
  action: AttackCombatSnapshot,
  store: ProgressionStore,
): CombatProgressionOutcome {
  const { from, to, defenderHealthAfter } = action;
  const originalB = mapBefore.units.get(to);
  if (!originalB) {
    return { map: mapAfter, levelUps: [], xpGained: 0, attackerPosition: null };
  }

  const killed = defenderHealthAfter == null;
  const damageDealt = Math.max(0, originalB.health - (killed ? 0 : defenderHealthAfter));

  const { result, levelUps } = store.applyAttackUnit({
    from,
    to,
    damageDealt,
    killed,
  });

  let map = mapAfter;
  if (levelUps.length && map.units.get(from)) {
    map = applyLevelUpHeals(map, from, levelUps);
  }

  return {
    map,
    levelUps,
    xpGained: result?.xpGained ?? 0,
    attackerPosition: from,
  };
}
