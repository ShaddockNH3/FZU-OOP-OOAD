import { GameClock } from './clock';
import { MatchState } from './match-state';
import type { Team } from './team';
import type { GameEvent } from '../events/game-event';

export interface MatchMeta {
  readonly title: string;
  readonly source: string;
}

/**
 * 一场比赛：两个队 + 一条有序事件流。
 *
 * 这里不做"播放"这件事。任意时刻的状态都由"从零重放到第 n 条"算出来，
 * 所以进度跳转、上一步、重置共用同一段代码，不会出现拖进度条后比分对不上的情况。
 */
export class Match {
  constructor(
    readonly home: Team,
    readonly away: Team,
    readonly events: readonly GameEvent[],
    readonly meta: MatchMeta
  ) {}

  get total(): number {
    return this.events.length;
  }

  initialState(): MatchState {
    return new MatchState(this.home.replica(), this.away.replica(), GameClock.periodStart(1));
  }

  /** 重放前 `applied` 条事件后的状态；`applied` 会被夹到 [0, total]。 */
  stateAt(applied: number): MatchState {
    const state = this.initialState();
    const upto = Math.min(Math.max(applied, 0), this.events.length);
    for (let index = 0; index < upto; index += 1) {
      const event = this.events[index];
      event.apply(state);
      state.setClock(event.clock);
    }
    return state;
  }
}
