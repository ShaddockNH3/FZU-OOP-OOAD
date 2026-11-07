import type { MatchState } from '../game/match-state';
import { GameEvent, type GameEventInit, type GameEventKind } from './game-event';

/** 换人。名单在开赛前已经建好，这里只记录谁上谁下，界面上播一条提示。 */
export class SubstitutionEvent extends GameEvent {
  readonly kind: GameEventKind = 'SUBSTITUTION';

  constructor(
    init: GameEventInit,
    readonly playerIn: string,
    readonly playerOut: string
  ) {
    super(init);
  }

  override participants(): readonly string[] {
    return [this.playerIn, this.playerOut];
  }

  override apply(_state: MatchState): void {
    // 统计不随换人变化
  }
}
