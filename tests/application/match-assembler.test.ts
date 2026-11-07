import { describe, expect, it } from 'vitest';
import { MatchAssembler } from '@/application/match-assembler';
import { PeriodEvent, ScoreEvent, ShotEvent } from '@/domain/events';
import { tinyRawMatch } from '../fixtures/tiny-match';

const match = new MatchAssembler().assemble(tinyRawMatch());

describe('MatchAssembler', () => {
  it('比分只在变化时落一条事件，重复比分不重复记', () => {
    const scores = match.events.filter((event) => event instanceof ScoreEvent) as ScoreEvent[];
    expect(scores.map((event) => `${event.homeScore}-${event.awayScore}`)).toEqual(['3-0', '3-2', '3-3']);
  });

  it('事件按行序排列，节次来自工作表', () => {
    expect(match.events[0]).toBeInstanceOf(PeriodEvent);
    expect(match.events.every((event) => event.quarter === 1)).toBe(true);
  });

  it('队名与简称', () => {
    expect(match.home.name).toBe('洛杉矶湖人');
    expect(match.home.shortName).toBe('湖人');
    expect(match.meta.title).toBe('洛杉矶湖人 vs 明尼苏达森林狼');
  });

  it('名单从事件参与者里建，助攻人也进名单', () => {
    expect(match.home.players.map((player) => player.name)).toEqual(['八村塁', '戴维斯', '里维斯']);
    expect(match.away.players.map((player) => player.name)).toEqual(['爱德华兹']);
    expect(match.home.players[0].number).toBe('1');
  });

  it('重放到末尾时比分与统计吻合', () => {
    const state = match.stateAt(match.total);
    expect(state.home.score).toBe(3);
    expect(state.away.score).toBe(3);
    expect(state.home.playerByName('八村塁')?.stats.points).toBe(3);
    expect(state.away.playerByName('爱德华兹')?.stats.points).toBe(3);
    expect(state.home.playerByName('里维斯')?.stats.get('fouls')).toBe(1);
  });

  it('重放到中途只包含已经发生的事件', () => {
    const shotIndex = match.events.findIndex((event) => event instanceof ShotEvent);
    const state = match.stateAt(shotIndex + 1);
    expect(state.home.playerByName('八村塁')?.stats.points).toBe(3);
    expect(state.home.playerByName('里维斯')?.stats.get('fouls')).toBe(0);
  });

  it('重放不会污染原始名单', () => {
    match.stateAt(match.total);
    expect(match.home.score).toBe(0);
  });
});
