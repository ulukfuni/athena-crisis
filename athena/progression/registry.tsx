import Vector from '../map/Vector.tsx';
import ProgressionStore from './ProgressionStore.tsx';
import { UnitProgression } from './Types.tsx';

/**
 * Optional active store for thin combat/UI hooks.
 * Playground (or a future game mode) registers a store; production stays null → no-op.
 *
 * Note: docs playground resolves actions in a web worker (separate module instance),
 * so these bonuses do not affect worker-side damage yet. Same-realm callers
 * (UnitCard, AttackSelector, tests) do see them. Phase 2: pass progression into
 * the game-action path / worker.
 */
let activeStore: ProgressionStore | null = null;

export function setActiveProgressionStore(store: ProgressionStore | null): void {
  activeStore = store;
}

export function getActiveProgressionStore(): ProgressionStore | null {
  return activeStore;
}

export function getProgressionAt(vector: Vector | null | undefined): UnitProgression | null {
  if (!vector || !activeStore) {
    return null;
  }
  return activeStore.getAt(vector);
}

export function getProgressionAttackBonus(vector: Vector | null | undefined): number {
  return getProgressionAt(vector)?.attackBonus ?? 0;
}

export function getProgressionDefenseBonus(vector: Vector | null | undefined): number {
  return getProgressionAt(vector)?.defenseBonus ?? 0;
}
