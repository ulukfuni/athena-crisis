import { describe, expect, it } from 'vitest';
import { Infantry, SmallTank } from '../../info/Unit.tsx';
import withModifiers from '../../lib/withModifiers.tsx';
import { Biome } from '../../map/Biome.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import { processAttackUnitProgression } from '../processCombat.tsx';
import ProgressionStore from '../ProgressionStore.tsx';
import { setActiveProgressionStore, getProgressionAttackBonus } from '../registry.tsx';
import { xpToNextForLevel } from '../xpTables.tsx';

describe('ProgressionStore', () => {
  it('seeds units and remaps on move', () => {
    const map = withModifiers(
      MapData.createMap({
        config: { biome: Biome.Grassland },
        map: [1, 1, 1, 1],
        size: { height: 2, width: 2 },
        teams: [
          { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
          { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'Bot' }] },
        ],
        units: [
          [1, 1, { g: 40, h: 100, i: Infantry.id, p: 1 }],
          [2, 1, { g: 40, h: 100, i: Infantry.id, p: 2 }],
        ],
      }),
    );
    const store = ProgressionStore.seedFromMap(map);
    const from = vec(1, 1);
    const to = vec(1, 2);
    const before = store.getAt(from);
    expect(before?.level).toBe(1);
    store.moveUnit(from, to);
    expect(store.getAt(from)).toBeNull();
    expect(store.getAt(to)?.characterId).toBe(before?.characterId);
  });

  it('grants XP on attack and registers combat bonus', () => {
    const map = withModifiers(
      MapData.createMap({
        config: { biome: Biome.Grassland },
        map: [1, 1, 1, 1],
        size: { height: 2, width: 2 },
        teams: [
          { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
          { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'Bot' }] },
        ],
        units: [
          [1, 1, { g: 30, h: 100, i: SmallTank.id, p: 1 }],
          [2, 1, { g: 40, h: 50, i: Infantry.id, p: 2 }],
        ],
      }),
    );
    const store = ProgressionStore.seedFromMap(map);
    setActiveProgressionStore(store);
    const from = vec(1, 1);
    const to = vec(2, 1);
    const need = xpToNextForLevel(1);
    // Force a kill with enough damage to level.
    const outcome = processAttackUnitProgression(
      map,
      map.copy({ units: map.units.delete(to) }),
      { from, to, defenderHealthAfter: null },
      store,
    );
    expect(outcome.xpGained).toBeGreaterThanOrEqual(need);
    expect(outcome.levelUps.length).toBeGreaterThanOrEqual(1);
    expect(getProgressionAttackBonus(from)).toBeGreaterThan(0);
    setActiveProgressionStore(null);
  });
});
