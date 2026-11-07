import type { MatchState } from '../game/match-state';
import { GameEvent, PlayerEvent, type GameEventInit, type GameEventKind } from './game-event';

export type ReboundKind = 'offensive' | 'defensive' | 'team';

/**
 * 篮板。表格里既有"某某 抢到篮板球"，也有"湖人 抢到篮板球"这种球队篮板，
 * 后者没有球员，只记在球队上。
 */
export class ReboundEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'REBOUND';
  readonly reboundKind: ReboundKind;

  constructor(init: GameEventInit & { playerName: string; reboundKind: ReboundKind }) {
    super(init, init.playerName);
    this.reboundKind = init.reboundKind;
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;

    const field = this.reboundKind === 'offensive' ? 'offensiveRebounds' : 'defensiveRebounds';
    team.stats.add(field);
    this.playerOf(state)?.stats.add(field);
  }
}

export class StealEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'STEAL';

  constructor(init: GameEventInit & { playerName: string }) {
    super(init, init.playerName);
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;
    team.stats.add('steals');
    this.playerOf(state)?.stats.add('steals');
  }
}

export class TurnoverEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'TURNOVER';
  readonly reason: string;

  constructor(init: GameEventInit & { playerName: string; reason: string }) {
    super(init, init.playerName);
    this.reason = init.reason;
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;
    team.stats.add('turnovers');
    this.playerOf(state)?.stats.add('turnovers');
  }
}

/** 跳球：只决定首个球权，本系统不追踪球权，落一条事件供展示。 */
export class JumpBallEvent extends GameEvent {
  readonly kind: GameEventKind = 'JUMP_BALL';

  constructor(
    init: GameEventInit,
    readonly winner: string
  ) {
    super(init);
  }

  override apply(_state: MatchState): void {
    // 无统计影响
  }
}
