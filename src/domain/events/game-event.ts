import type { GameClock } from '../game/clock';
import type { MatchState } from '../game/match-state';
import type { Player } from '../game/player';
import type { Team, TeamSide } from '../game/team';

export type GameEventKind =
  | 'JUMP_BALL'
  | 'SHOT'
  | 'FREE_THROW'
  | 'REBOUND'
  | 'FOUL'
  | 'BLOCK'
  | 'STEAL'
  | 'TURNOVER'
  | 'SUBSTITUTION'
  | 'SCORE'
  | 'PERIOD'
  | 'TIMEOUT'
  | 'VIOLATION';

export interface GameEventInit {
  readonly id: number;
  readonly clock: GameClock;
  /** 事件归属哪一侧；比分、节次这类中立事件为 null。 */
  readonly side: TeamSide | null;
  /** 表格里的原始文案，界面直接展示。 */
  readonly description: string;
}

/**
 * 比赛事件抽象基类。
 *
 * 子类只需要回答两件事：自己是什么类型（`kind`）、被应用时改什么（`apply`）。
 * 所有子类共用 id / 时钟 / 归属，不再每个构造函数重复五个位置参数。
 */
export abstract class GameEvent {
  readonly id: number;
  readonly clock: GameClock;
  readonly side: TeamSide | null;
  readonly description: string;

  protected constructor(init: GameEventInit) {
    this.id = init.id;
    this.clock = init.clock;
    this.side = init.side;
    this.description = init.description;
  }

  abstract readonly kind: GameEventKind;

  abstract apply(state: MatchState): void;

  /** 参与本次事件的球员名，用于在开赛前把名单建出来。 */
  participants(): readonly string[] {
    return [];
  }

  get quarter(): number {
    return this.clock.quarter;
  }

  get time(): string {
    return this.clock.label;
  }
}

/**
 * 带球员的事件基类。
 *
 * 原来的每个子类都要重写一遍"找球队 → 找球员 → 找不到就 return"，
 * 这里收拢成 `teamOf` / `playerOf` 两个受保护方法。
 */
export abstract class PlayerEvent extends GameEvent {
  readonly playerName: string;

  protected constructor(init: GameEventInit, playerName: string) {
    super(init);
    this.playerName = playerName;
  }

  override participants(): readonly string[] {
    return [this.playerName];
  }

  protected teamOf(state: MatchState): Team | null {
    return this.side ? state.team(this.side) : null;
  }

  protected playerOf(state: MatchState): Player | null {
    return this.teamOf(state)?.playerByName(this.playerName) ?? null;
  }
}
