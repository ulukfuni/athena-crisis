import { describe, expect, it } from 'vitest';
import { Infantry } from '../../info/Unit.tsx';
import { createProgression, grantXp } from '../grantXp.tsx';
import { xpRewardForCombat, totalXpFromReward, xpToNextForLevel } from '../xpTables.tsx';

describe('progression grantXp', () => {
  it('creates level 1 progression with an xp curve', () => {
    const p = createProgression('hero-1', Infantry.id, 'Scout');
    expect(p.level).toBe(1);
    expect(p.xp).toBe(0);
    expect(p.xpToNext).toBe(xpToNextForLevel(1));
    expect(p.displayName).toBe('Scout');
  });

  it('levels up and applies growth when enough XP is granted', () => {
    const p = createProgression('hero-1', Infantry.id);
    const need = p.xpToNext;
    const result = grantXp(p, need);
    expect(result.leveledUp).toBe(true);
    expect(result.progression.level).toBe(2);
    expect(result.progression.xp).toBe(0);
    expect(result.progression.attackBonus).toBeGreaterThan(0);
    expect(result.progression.hpBonus).toBeGreaterThan(0);
    expect(result.levelUps).toHaveLength(1);
  });

  it('awards kill bonus XP', () => {
    const reward = xpRewardForCombat(40, true);
    expect(totalXpFromReward(reward)).toBeGreaterThan(xpRewardForCombat(40, false).damageXp);
  });
});
