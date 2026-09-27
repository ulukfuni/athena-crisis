import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { LevelUpEvent } from './Types.tsx';

/**
 * Apply HP growth from level-ups onto map units (capped by MaxHealth via setHealth).
 */
export function applyLevelUpHeals(
  map: MapData,
  position: Vector,
  levelUps: ReadonlyArray<LevelUpEvent>,
): MapData {
  if (!levelUps.length) {
    return map;
  }
  const unit = map.units.get(position);
  if (!unit) {
    return map;
  }
  const heal = levelUps.reduce((sum, event) => sum + event.growth.hp, 0);
  if (heal <= 0) {
    return map;
  }
  const healed: Unit = unit.modifyHealth(heal);
  return map.copy({
    units: map.units.set(position, healed),
  });
}
