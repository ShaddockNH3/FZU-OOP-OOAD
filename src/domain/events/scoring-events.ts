import type { MatchState } from '../game/match-state';
import { GameEvent, PlayerEvent, type GameEventInit, type GameEventKind } from './game-event';

export interface ShotInit extends GameEventInit {
  readonly playerName: string;
  readonly made: boolean;
  /** 投中算几分。注意表格括号里的数字是"该球员本场累计得分"，不是这一球的分值。 */
  readonly points: number;
  readonly shotType: string;
  readonly assistName?: string;
}

/** 运动战出手。 */
export class ShotEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'SHOT';
  readonly made: boolean;
  readonly points: number;
  readonly shotType: string;
  readonly assistName?: string;

  constructor(init: ShotInit) {
    super(init, init.playerName);
    this.made = init.made;
    this.points = init.points;
    this.shotType = init.shotType;
    this.assistName = init.assistName;
  }

  override participants(): readonly string[] {
    return this.assistName ? [this.playerName, this.assistName] : [this.playerName];
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;

    const isThree = this.points === 3;
    const attempted = isThree ? 'threePointersAttempted' : 'fieldGoalsAttempted';
    const made = isThree ? 'threePointersMade' : 'fieldGoalsMade';
    const player = this.playerOf(state);

    team.stats.add(attempted);
    player?.stats.add(attempted);

    if (!this.made) return;

    team.stats.add(made);
    player?.stats.add(made);
    player?.stats.add('points', this.points);

    if (!this.assistName) return;
    const assister = team.playerByName(this.assistName);
    if (!assister) return;
    assister.stats.add('assists');
    team.stats.add('assists');
  }
}

/** 罚球，一次一分，不计入运动战出手。 */
export class FreeThrowEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'FREE_THROW';
  readonly made: boolean;

  constructor(init: GameEventInit & { playerName: string; made: boolean }) {
    super(init, init.playerName);
    this.made = init.made;
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;

    const player = this.playerOf(state);
    team.stats.add('freeThrowsAttempted');
    player?.stats.add('freeThrowsAttempted');

    if (!this.made) return;

    team.stats.add('freeThrowsMade');
    player?.stats.add('freeThrowsMade');
    player?.stats.add('points', 1);
  }
}

/**
 * 比分回填。
 *
 * 表格每行都有官方比分，以它为准直接覆盖球队得分；球员个人得分仍由各人命中累加，
 * 两者不必强求相加相等（原始数据里就存在缺行）。
 */
export class ScoreEvent extends GameEvent {
  readonly kind: GameEventKind = 'SCORE';

  constructor(
    init: GameEventInit,
    readonly homeScore: number,
    readonly awayScore: number
  ) {
    super(init);
  }

  override apply(state: MatchState): void {
    state.home.setScore(this.homeScore);
    state.away.setScore(this.awayScore);
  }
}
