import type { BoxScore } from '@/domain/game/box-score';
import type { Match } from '@/domain/game/match';
import type { MatchState } from '@/domain/game/match-state';
import type { Player } from '@/domain/game/player';
import type { Team, TeamSide } from '@/domain/game/team';
import type { GameEvent, GameEventKind } from '@/domain/events';

export interface PlayerRow {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly points: number;
  readonly fieldGoals: string;
  readonly threePointers: string;
  readonly freeThrows: string;
  readonly rebounds: number;
  readonly assists: number;
  readonly fouls: number;
  readonly onCourt: boolean;
}

export interface TeamSummary {
  readonly side: TeamSide;
  readonly name: string;
  readonly shortName: string;
  readonly score: number;
  readonly players: PlayerRow[];
}

export interface StatComparisonRow {
  readonly label: string;
  readonly home: string;
  readonly away: string;
}

export interface EventView {
  readonly id: number;
  readonly kind: GameEventKind;
  readonly quarter: number;
  readonly time: string;
  readonly description: string;
  readonly side: TeamSide | null;
}

export interface MatchSnapshot {
  readonly title: string;
  readonly home: TeamSummary;
  readonly away: TeamSummary;
  readonly clock: { readonly quarter: number; readonly label: string };
  readonly progress: { readonly index: number; readonly total: number; readonly percent: number };
  readonly playing: boolean;
  readonly speed: number;
  readonly finished: boolean;
  readonly lastEvent: EventView | null;
  readonly comparison: StatComparisonRow[];
}

export interface PlaybackView {
  readonly playing: boolean;
  readonly speed: number;
}

function percent(rate: number | null): string {
  return rate === null ? '—' : `${(rate * 100).toFixed(1)}%`;
}

function toPlayerRow(player: Player): PlayerRow {
  const stats = player.stats;
  return {
    id: player.id,
    number: player.number,
    name: player.name,
    points: stats.points,
    fieldGoals: `${stats.get('fieldGoalsMade')}/${stats.get('fieldGoalsAttempted')}`,
    threePointers: `${stats.get('threePointersMade')}/${stats.get('threePointersAttempted')}`,
    freeThrows: `${stats.get('freeThrowsMade')}/${stats.get('freeThrowsAttempted')}`,
    rebounds: stats.rebounds,
    assists: stats.get('assists'),
    fouls: stats.get('fouls'),
    onCourt: player.isStarter
  };
}

function toTeamSummary(team: Team): TeamSummary {
  const players = [...team.players].sort((a, b) => b.stats.points - a.stats.points || a.slot - b.slot);
  return {
    side: team.side,
    name: team.name,
    shortName: team.shortName,
    score: team.score,
    players: players.map(toPlayerRow)
  };
}

function comparisonRows(home: BoxScore, away: BoxScore): StatComparisonRow[] {
  return [
    { label: '投篮命中率', home: percent(home.fieldGoalRate), away: percent(away.fieldGoalRate) },
    { label: '三分命中率', home: percent(home.threePointRate), away: percent(away.threePointRate) },
    { label: '罚球命中率', home: percent(home.freeThrowRate), away: percent(away.freeThrowRate) },
    { label: '篮板', home: String(home.rebounds), away: String(away.rebounds) },
    { label: '助攻', home: String(home.get('assists')), away: String(away.get('assists')) },
    { label: '抢断', home: String(home.get('steals')), away: String(away.get('steals')) },
    { label: '盖帽', home: String(home.get('blocks')), away: String(away.get('blocks')) },
    { label: '失误', home: String(home.get('turnovers')), away: String(away.get('turnovers')) },
    { label: '犯规', home: String(home.get('fouls')), away: String(away.get('fouls')) }
  ];
}

function toEventView(event: GameEvent | null): EventView | null {
  if (!event) return null;
  return {
    id: event.id,
    kind: event.kind,
    quarter: event.quarter,
    time: event.time,
    description: event.description,
    side: event.side
  };
}

/** 把领域状态摊平成界面能直接渲染的普通对象。 */
export function buildSnapshot(
  match: Match,
  state: MatchState,
  progress: { index: number; total: number },
  playback: PlaybackView,
  lastEvent: GameEvent | null
): MatchSnapshot {
  const index = progress.index;
  return {
    title: match.meta.title,
    home: toTeamSummary(state.home),
    away: toTeamSummary(state.away),
    clock: { quarter: state.clock.quarter, label: state.clock.label },
    progress: {
      index,
      total: progress.total,
      percent: progress.total === 0 ? 0 : (index / progress.total) * 100
    },
    playing: playback.playing,
    speed: playback.speed,
    finished: progress.total > 0 && index >= progress.total,
    lastEvent: toEventView(lastEvent),
    comparison: comparisonRows(state.home.stats, state.away.stats)
  };
}
