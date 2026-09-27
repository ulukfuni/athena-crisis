import { getSkillDefenseStatusEffects } from '../info/Skill.tsx';
import { TileInfo } from '../info/Tile.tsx';
import { LeaderStatusEffect } from '../map/Configuration.tsx';
import Entity, { isUnit } from '../map/Entity.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { getProgressionDefenseBonus } from '../progression/registry.tsx';

function findUnitVector(map: MapData, entity: Entity): Vector | null {
  if (!isUnit(entity)) {
    return null;
  }
  for (const [vector, unit] of map.units) {
    if (unit === entity) {
      return vector;
    }
  }
  return null;
}

export default function getDefenseStatusEffect(
  map: MapData,
  entity: Entity,
  tile: TileInfo | null,
  vector: Vector | null = null,
) {
  const player = map.getPlayer(entity);
  const at = vector ?? findUnitVector(map, entity);
  return Math.max(
    0,
    1 +
      (isUnit(entity) && entity.isLeader() ? LeaderStatusEffect : 0) +
      getSkillDefenseStatusEffects(entity, tile, player.skills, player.activeSkills) +
      getProgressionDefenseBonus(at),
  );
}
