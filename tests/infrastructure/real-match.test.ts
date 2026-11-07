import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { MatchAssembler } from '@/application/match-assembler';
import { parseWorkbook } from '@/infrastructure/xlsx/workbook-reader';
import { ScoreEvent } from '@/domain/events';

function load(name: string) {
  const path = resolve(process.cwd(), 'public', name);
  const workbook = XLSX.read(readFileSync(path), { type: 'buffer' });
  return new MatchAssembler().assemble(parseWorkbook(workbook, name));
}

describe('真实比赛表格', () => {
  const match = load('match.xlsx');

  it('四节都读到了，事件量合理', () => {
    expect(match.total).toBeGreaterThan(500);
    expect(new Set(match.events.map((event) => event.quarter))).toEqual(new Set([1, 2, 3, 4]));
  });

  it('队名和简称', () => {
    expect(match.home.name).toBe('洛杉矶湖人');
    expect(match.away.name).toBe('明尼苏达森林狼');
    expect(match.home.shortName).toBe('湖人');
    expect(match.away.shortName).toBe('森林狼');
  });

  it('最终比分跟表格最后一行一致', () => {
    const state = match.stateAt(match.total);
    expect(state.home.score).toBe(110);
    expect(state.away.score).toBe(103);
  });

  it('名单里没有解析残渣，也没有重复', () => {
    for (const team of [match.home, match.away]) {
      const names = team.players.map((player) => player.name);
      expect(names.length).toBeGreaterThan(5);
      expect(new Set(names).size).toBe(names.length);
      for (const name of names) {
        expect(name).not.toMatch(/\(\d+\s*分/);
        expect(name).not.toContain('助攻');
      }
    }
  });

  it('球员个人得分总和不会离谱地超过球队总分', () => {
    const state = match.stateAt(match.total);
    for (const team of [state.home, state.away]) {
      const sum = team.players.reduce((total, player) => total + player.stats.points, 0);
      expect(sum).toBeLessThanOrEqual(team.score + 5);
    }
  });

  it('比分事件单调递增，不会来回跳', () => {
    const scores = match.events.filter((event) => event instanceof ScoreEvent) as ScoreEvent[];
    for (let index = 1; index < scores.length; index += 1) {
      expect(scores[index].homeScore).toBeGreaterThanOrEqual(scores[index - 1].homeScore);
      expect(scores[index].awayScore).toBeGreaterThanOrEqual(scores[index - 1].awayScore);
    }
  });

  it('第二份比赛文件也能读', () => {
    const other = load('match2.xlsx');
    expect(other.home.name).toBe('猪咪');
    expect(other.total).toBeGreaterThan(100);
  });
});
