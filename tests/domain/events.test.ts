import { describe, expect, it } from 'vitest';
import { GameClock } from '@/domain/game/clock';
import { MatchState } from '@/domain/game/match-state';
import { Player } from '@/domain/game/player';
import { Team } from '@/domain/game/team';
import { FreeThrowEvent, ScoreEvent, ShotEvent, type GameEventInit } from '@/domain/events';

function state(): MatchState {
  const home = new Team('home', '洛杉矶湖人', '湖人');
  const away = new Team('away', '明尼苏达森林狼', '森林狼');
  home.addPlayer(new Player('home-0', '八村塁', '1', 0));
  home.addPlayer(new Player('home-1', '戴维斯', '2', 1));
  home.addPlayer(new Player('away-0', '爱德华兹', '1', 0));
  return new MatchState(home, away, GameClock.periodStart(1));
}

function init(overrides: Partial<GameEventInit> = {}): GameEventInit {
  return { id: 1, clock: new GameClock(1, 11, 40), side: 'home', description: '测试', ...overrides };
}

describe('ShotEvent', () => {
  it('命中三分：出手、命中、得分、助攻一起记', () => {
    const court = state();
    new ShotEvent({
      ...init(),
      playerName: '八村塁',
      made: true,
      points: 3,
      shotType: '三分投篮',
      assistName: '戴维斯'
    }).apply(court);

    const shooter = court.home.playerByName('八村塁');
    const assister = court.home.playerByName('戴维斯');
    expect(shooter?.stats.points).toBe(3);
    expect(shooter?.stats.get('threePointersMade')).toBe(1);
    expect(shooter?.stats.get('threePointersAttempted')).toBe(1);
    expect(shooter?.stats.get('fieldGoalsAttempted')).toBe(0);
    expect(assister?.stats.get('assists')).toBe(1);
    expect(court.home.stats.get('assists')).toBe(1);
  });

  it('不中只记出手，不加分', () => {
    const court = state();
    new ShotEvent({ ...init(), playerName: '八村塁', made: false, points: 2, shotType: '上篮' }).apply(court);

    const shooter = court.home.playerByName('八村塁');
    expect(shooter?.stats.points).toBe(0);
    expect(shooter?.stats.get('fieldGoalsAttempted')).toBe(1);
    expect(shooter?.stats.get('fieldGoalsMade')).toBe(0);
  });

  it('球员不在名单里也不会炸，球队统计照记', () => {
    const court = state();
    new ShotEvent({ ...init(), playerName: '不存在的人', made: true, points: 2, shotType: '上篮' }).apply(court);
    expect(court.home.stats.get('fieldGoalsMade')).toBe(1);
  });
});

describe('FreeThrowEvent', () => {
  it('罚球只算一分，且不计入运动战出手', () => {
    const court = state();
    new FreeThrowEvent({ ...init(), playerName: '八村塁', made: true }).apply(court);

    const shooter = court.home.playerByName('八村塁');
    expect(shooter?.stats.points).toBe(1);
    expect(shooter?.stats.get('freeThrowsMade')).toBe(1);
    expect(shooter?.stats.get('fieldGoalsAttempted')).toBe(0);
  });
});

describe('ScoreEvent', () => {
  it('按表格比分覆盖球队得分，不累加', () => {
    const court = state();
    new ScoreEvent(init({ side: null, description: '比分' }), 57, 42).apply(court);
    new ScoreEvent(init({ id: 2, side: null, description: '比分' }), 60, 44).apply(court);

    expect(court.home.score).toBe(60);
    expect(court.away.score).toBe(44);
  });
});
