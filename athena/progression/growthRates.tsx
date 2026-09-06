import { Infantry, Pioneer, SmallTank } from '../info/Unit.tsx';
import { ID } from '../MapData.tsx';
import { GrowthRates } from './Types.tsx';

/**
 * Per-unit-type growth. Generic rates only — no Nintendo class names.
 * Unknown types fall back to DEFAULT_GROWTH.
 */
export const DEFAULT_GROWTH: GrowthRates = {
  hp: 8,
  attack: 0.05,
  defense: 0.03,
};

const BY_UNIT_ID: ReadonlyMap<ID, GrowthRates> = new Map([
  [Pioneer.id, { hp: 6, attack: 0.02, defense: 0.04 }],
  [Infantry.id, { hp: 8, attack: 0.05, defense: 0.03 }],
  [SmallTank.id, { hp: 10, attack: 0.06, defense: 0.05 }],
]);

export function getGrowthRates(unitInfoId: ID): GrowthRates {
  return BY_UNIT_ID.get(unitInfoId) ?? DEFAULT_GROWTH;
}
