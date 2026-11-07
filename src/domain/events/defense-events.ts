import type { MatchState } from '../game/match-state';
import { PlayerEvent, type GameEventInit, type GameEventKind } from './game-event';

/** 犯规：只改统计，不推导罚球次数（罚球在表格里是独立行）。 */
export class FoulEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'FOUL';
  readonly foulType: string;

  constructor(init: GameEventInit & { playerName: string; foulType: string }) {
    super(init, init.playerName);
    this.foulType = init.foulType;
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;
    team.stats.add('fouls');
    this.playerOf(state)?.stats.add('fouls');
  }
}

export class BlockEvent extends PlayerEvent {
  readonly kind: GameEventKind = 'BLOCK';

  constructor(init: GameEventInit & { playerName: string }) {
    super(init, init.playerName);
  }

  override apply(state: MatchState): void {
    const team = this.teamOf(state);
    if (!team) return;
    team.stats.add('blocks');
    this.playerOf(state)?.stats.add('blocks');
  }
}
