import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { createProgression, grantXp } from './grantXp.tsx';
import { CharacterId, GrantXpResult, LevelUpEvent, UnitProgression } from './Types.tsx';
import { totalXpFromReward, xpRewardForCombat } from './xpTables.tsx';

export type ProgressionSnapshot = Readonly<{
  byCharacterId: ReadonlyMap<CharacterId, UnitProgression>;
  /** Position key (`x,y`) → characterId for units currently on the map. */
  byPosition: ReadonlyMap<string, CharacterId>;
}>;

let nextId = 1;

function positionKey(vector: Vector): string {
  return vector.toString();
}

function allocCharacterId(unit: Unit): CharacterId {
  const name = unit.getName(unit.player);
  const suffix = nextId++;
  return name ? `${name.replace(/\s+/g, '-')}-${suffix}` : `unit-${unit.id}-${suffix}`;
}

/**
 * Parallel progression state keyed by stable characterId.
 * Position index remaps on Move so combat hooks can look up by Vector.
 * Does not alter Unit / PlainUnit encoding.
 */
export default class ProgressionStore {
  private byCharacterId: Map<CharacterId, UnitProgression>;
  private byPosition: Map<string, CharacterId>;

  constructor(snapshot?: ProgressionSnapshot) {
    this.byCharacterId = new Map(snapshot?.byCharacterId ?? []);
    this.byPosition = new Map(snapshot?.byPosition ?? []);
  }

  static seedFromMap(map: MapData): ProgressionStore {
    const store = new ProgressionStore();
    for (const [vector, unit] of map.units) {
      store.addUnit(vector, unit);
    }
    return store;
  }

  snapshot(): ProgressionSnapshot {
    return {
      byCharacterId: new Map(this.byCharacterId),
      byPosition: new Map(this.byPosition),
    };
  }

  clone(): ProgressionStore {
    return new ProgressionStore(this.snapshot());
  }

  addUnit(vector: Vector, unit: Unit, displayName?: string): UnitProgression {
    const characterId = allocCharacterId(unit);
    const name = displayName ?? unit.getName(unit.player) ?? undefined;
    const progression = createProgression(characterId, unit.id, name ?? undefined);
    this.byCharacterId.set(characterId, progression);
    this.byPosition.set(positionKey(vector), characterId);
    return progression;
  }

  removeAt(vector: Vector): void {
    const key = positionKey(vector);
    const characterId = this.byPosition.get(key);
    this.byPosition.delete(key);
    if (characterId) {
      this.byCharacterId.delete(characterId);
    }
  }

  moveUnit(from: Vector, to: Vector): void {
    const fromKey = positionKey(from);
    const toKey = positionKey(to);
    const characterId = this.byPosition.get(fromKey);
    if (!characterId) {
      return;
    }
    this.byPosition.delete(fromKey);
    this.byPosition.set(toKey, characterId);
  }

  getAt(vector: Vector): UnitProgression | null {
    const characterId = this.byPosition.get(positionKey(vector));
    return characterId ? (this.byCharacterId.get(characterId) ?? null) : null;
  }

  getByCharacterId(characterId: CharacterId): UnitProgression | null {
    return this.byCharacterId.get(characterId) ?? null;
  }

  setProgression(progression: UnitProgression): void {
    this.byCharacterId.set(progression.characterId, progression);
  }

  /**
   * Apply AttackUnit-style combat: XP to attacker at `from`.
   * Removes defender progression when killed.
   */
  applyAttackUnit(params: { from: Vector; to: Vector; damageDealt: number; killed: boolean }): {
    result: GrantXpResult | null;
    levelUps: ReadonlyArray<LevelUpEvent>;
  } {
    const { from, to, damageDealt, killed } = params;
    const attacker = this.getAt(from);
    if (!attacker) {
      if (killed) {
        this.removeAt(to);
      }
      return { result: null, levelUps: [] };
    }

    const reward = xpRewardForCombat(damageDealt, killed);
    const result = grantXp(attacker, totalXpFromReward(reward));
    this.setProgression(result.progression);

    if (killed) {
      this.removeAt(to);
    }

    return { result, levelUps: result.levelUps };
  }

  /**
   * Keep position index aligned after any map mutation (Move / Create / Drop).
   * Prefer explicit moveUnit / addUnit when the action is known.
   */
  reconcile(map: MapData): void {
    const seen = new Set<string>();
    for (const [vector, unit] of map.units) {
      const key = positionKey(vector);
      seen.add(key);
      if (!this.byPosition.has(key)) {
        // Try to recover by matching orphaned character with same unit type + player.
        // If none, seed a fresh entry (e.g. CreateUnit).
        this.addUnit(vector, unit);
      }
    }
    for (const key of [...this.byPosition.keys()]) {
      if (!seen.has(key)) {
        const characterId = this.byPosition.get(key);
        this.byPosition.delete(key);
        // Keep character data if the unit merely moved (handled by moveUnit).
        // Orphans without a position are dropped only when not referenced — leave data;
        // reconcile is best-effort for CreateUnit; Move should call moveUnit.
        if (characterId && ![...this.byPosition.values()].includes(characterId)) {
          this.byCharacterId.delete(characterId);
        }
      }
    }
  }
}
