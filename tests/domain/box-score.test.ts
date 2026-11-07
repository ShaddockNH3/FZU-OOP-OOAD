import { describe, expect, it } from 'vitest';
import { BoxScore } from '@/domain/game/box-score';

describe('BoxScore', () => {
  it('累加指定字段，互不影响', () => {
    const score = new BoxScore();
    score.add('points', 3);
    score.add('points', 2);
    score.add('fieldGoalsMade');

    expect(score.points).toBe(5);
    expect(score.get('fieldGoalsMade')).toBe(1);
    expect(score.get('fieldGoalsAttempted')).toBe(0);
  });

  it('篮板是进攻 + 防守的派生值', () => {
    const score = new BoxScore({ offensiveRebounds: 2, defensiveRebounds: 5 });
    expect(score.rebounds).toBe(7);
  });

  it('没有出手时命中率是 null，不是 0%', () => {
    const score = new BoxScore();
    expect(score.fieldGoalRate).toBeNull();
    score.add('fieldGoalsAttempted', 4);
    score.add('fieldGoalsMade', 2);
    expect(score.fieldGoalRate).toBe(0.5);
  });

  it('snapshot 是拷贝，改快照不影响原对象', () => {
    const score = new BoxScore({ points: 9 });
    const snapshot = score.snapshot();
    snapshot.points = 100;
    expect(score.points).toBe(9);
  });
});
