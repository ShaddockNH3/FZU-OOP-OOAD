import type { GameClock } from '@/domain/game/clock';
import type { TeamSide } from '@/domain/game/team';
import {
  BlockEvent,
  FoulEvent,
  FreeThrowEvent,
  JumpBallEvent,
  PeriodEvent,
  ReboundEvent,
  ShotEvent,
  StealEvent,
  SubstitutionEvent,
  TimeoutEvent,
  TurnoverEvent,
  ViolationEvent,
  type GameEvent,
  type GameEventInit,
  type ReboundKind
} from '@/domain/events';
import { extractAssist, findShotVerb, isTeamName, nameBefore } from './text';

export interface ActionContext {
  readonly id: number;
  readonly clock: GameClock;
  readonly side: TeamSide;
  readonly teamName: string;
  readonly teamShortName: string;
  readonly text: string;
}

/** 把一行文字变成事件；认不出来就返回 null。 */
export interface ActionRule {
  readonly name: string;
  tryCreate(context: ActionContext): GameEvent | null;
}

function rule(name: string, tryCreate: (context: ActionContext) => GameEvent | null): ActionRule {
  return { name, tryCreate };
}

function initOf(context: ActionContext): GameEventInit {
  return {
    id: context.id,
    clock: context.clock,
    side: context.side,
    description: context.text
  };
}

function isScoringText(text: string): boolean {
  return text.includes('命中') || text.includes('不中');
}

function reboundKindOf(text: string): ReboundKind {
  if (text.includes('进攻篮板')) return 'offensive';
  if (text.includes('防守篮板')) return 'defensive';
  return 'team';
}

function foulTypeOf(text: string): string {
  if (text.includes('进攻犯规')) return '进攻犯规';
  if (text.includes('技术犯规')) return '技术犯规';
  if (text.includes('恶意犯规')) return '恶意犯规';
  if (text.includes('投篮犯规')) return '投篮犯规';
  if (text.includes('无球犯规')) return '无球犯规';
  if (text.includes('带球撞人')) return '带球撞人';
  return '个人犯规';
}

function turnoverReasonOf(text: string): string {
  const matched = /失误[：:]\s*([^()（]+)/.exec(text);
  return matched?.[1]?.trim() ?? '失误';
}

function blockIndexOf(text: string): number {
  const positions = [text.indexOf('封盖'), text.indexOf('盖帽')].filter((index) => index >= 0);
  return positions.length > 0 ? Math.min(...positions) : -1;
}

function freeThrowIndexOf(text: string): number {
  const positions = [text.indexOf('罚球'), text.indexOf('第一罚'), text.indexOf('第二罚'), text.indexOf('第三罚'), text.indexOf('(')]
    .filter((index) => index > 0);
  return positions.length > 0 ? Math.min(...positions) : -1;
}

/**
 * 规则表。顺序即优先级，先匹配先赢。
 *
 * 两个容易踩的坑，都在这里用顺序和条件挡掉了：
 * - `犯规: 投篮犯规 (1 次犯规)` 含"投篮"，但整行没有命中/不中，投篮规则不会抢；
 * - `犯规 ... (2 罚球出手)` 含"罚球"，同样靠"必须有命中/不中"排除。
 */
export const DEFAULT_RULES: readonly ActionRule[] = [
  rule('substitution', (context) => {
    const matched = /^换人[：:]\s*(.+?)\s*替换\s*(.+)$/.exec(context.text.trim());
    if (!matched) return null;
    return new SubstitutionEvent(initOf(context), matched[1].trim(), matched[2].trim());
  }),

  rule('period', (context) => {
    const text = context.text.trim();
    if (text.startsWith('全场结束')) {
      return new PeriodEvent(initOf(context), 'end', true);
    }
    const matched = /^第\s*(\d)\s*节\s*(开始|结束)/.exec(text);
    if (!matched) return null;
    const phase = matched[2] === '开始' ? 'start' : 'end';
    return new PeriodEvent(initOf(context), phase);
  }),

  rule('jump-ball', (context) => {
    const index = context.text.indexOf('跳球');
    if (index < 0) return null;
    const winner = /([^\s：:]+)\s*得到球/.exec(context.text)?.[1] ?? '';
    return new JumpBallEvent(initOf(context), winner);
  }),

  rule('free-throw', (context) => {
    const text = context.text;
    if (text.includes('犯规') || !isScoringText(text)) return null;
    if (!text.includes('罚')) return null;
    const index = freeThrowIndexOf(text);
    if (index <= 0) return null;
    const playerName = nameBefore(text, index);
    if (playerName.length === 0) return null;
    return new FreeThrowEvent({ ...initOf(context), playerName, made: text.includes('命中') });
  }),

  rule('shot', (context) => {
    const text = context.text;
    if (!isScoringText(text)) return null;
    const shot = findShotVerb(text);
    if (!shot) return null;

    const playerName = nameBefore(text, shot.index);
    if (playerName.length === 0) return null;

    return new ShotEvent({
      ...initOf(context),
      playerName,
      made: text.includes('命中'),
      points: shot.verb.startsWith('三分') ? 3 : 2,
      shotType: shot.verb,
      assistName: extractAssist(text)
    });
  }),

  rule('rebound', (context) => {
    const index = context.text.indexOf('抢到篮板');
    if (index < 0) return null;
    const playerName = nameBefore(context.text, index);
    const teamLevel = isTeamName(playerName, context.teamName, context.teamShortName);
    return new ReboundEvent({
      ...initOf(context),
      playerName: teamLevel ? '' : playerName,
      reboundKind: reboundKindOf(context.text)
    });
  }),

  rule('turnover', (context) => {
    const matched = /失误[：:]/.exec(context.text);
    if (!matched) return null;
    const playerName = nameBefore(context.text, matched.index);
    return new TurnoverEvent({ ...initOf(context), playerName, reason: turnoverReasonOf(context.text) });
  }),

  rule('foul', (context) => {
    const index = context.text.indexOf('犯规');
    if (index < 0 || isScoringText(context.text)) return null;
    const playerName = nameBefore(context.text, index);
    if (playerName.length === 0) return null;
    return new FoulEvent({ ...initOf(context), playerName, foulType: foulTypeOf(context.text) });
  }),

  rule('block', (context) => {
    const index = blockIndexOf(context.text);
    if (index < 0) return null;
    const playerName = nameBefore(context.text, index);
    if (playerName.length === 0) return null;
    return new BlockEvent({ ...initOf(context), playerName });
  }),

  rule('steal', (context) => {
    const index = context.text.indexOf('抢断');
    if (index < 0) return null;
    const playerName = nameBefore(context.text, index);
    if (playerName.length === 0) return null;
    return new StealEvent({ ...initOf(context), playerName });
  }),

  rule('violation', (context) => {
    const matched = /违例[：:]\s*(.+)$/.exec(context.text);
    if (!matched) return null;
    return new ViolationEvent(initOf(context), matched[1].trim());
  }),

  rule('timeout', (context) => {
    const matched = /暂停\s*[：:]\s*(.+)$/.exec(context.text);
    if (!matched) return null;
    return new TimeoutEvent(initOf(context), matched[1].trim());
  })
];
