import type { MatchState } from '../game/match-state';
import { GameEvent, type GameEventInit, type GameEventKind } from './game-event';

export type PeriodPhase = 'start' | 'end';

/** 节开始 / 节结束 / 全场结束。 */
export class PeriodEvent extends GameEvent {
  readonly kind: GameEventKind = 'PERIOD';
  readonly phase: PeriodPhase;

  constructor(
    init: GameEventInit,
    phase: PeriodPhase,
    readonly isFullTime = false
  ) {
    super(init);
    this.phase = phase;
  }

  override apply(_state: MatchState): void {
    // 节次切换由时钟承担
  }
}

export class TimeoutEvent extends GameEvent {
  readonly kind: GameEventKind = 'TIMEOUT';

  constructor(
    init: GameEventInit,
    readonly timeoutType: string
  ) {
    super(init);
  }

  override apply(_state: MatchState): void {
    // 暂停不改变统计
  }
}

export class ViolationEvent extends GameEvent {
  readonly kind: GameEventKind = 'VIOLATION';

  constructor(
    init: GameEventInit,
    readonly reason: string
  ) {
    super(init);
  }

  override apply(_state: MatchState): void {
    // 违例本可映射成失误，但表格已单独记失误，避免重复计数
  }
}
