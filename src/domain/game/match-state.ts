import type { GameClock } from './clock';
import type { Team, TeamSide } from './team';

/**
 * 比赛状态：所有事件 `apply` 的目标。
 *
 * 事件只能改这个对象里的东西（球队、比分、时钟），拿不到 Game、拿不到 DOM，
 * 也就没法像原来那样写成 `apply(game: any)`。
 */
export class MatchState {
  private currentClock: GameClock;

  constructor(
    readonly home: Team,
    readonly away: Team,
    clock: GameClock
  ) {
    this.currentClock = clock;
  }

  get clock(): GameClock {
    return this.currentClock;
  }

  setClock(clock: GameClock): void {
    this.currentClock = clock;
  }

  team(side: TeamSide): Team {
    return side === 'home' ? this.home : this.away;
  }
}
