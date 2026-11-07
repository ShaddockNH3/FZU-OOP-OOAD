import { GameClock } from '@/domain/game/clock';
import { Match } from '@/domain/game/match';
import { Player } from '@/domain/game/player';
import { Team, type TeamSide } from '@/domain/game/team';
import { ScoreEvent, type GameEvent } from '@/domain/events';
import type { RawMatch } from './ports';
import { EventFactory } from './parsing/event-factory';
import { parseScoreCell } from './parsing/text';
import { shortTeamName } from './parsing/team-name';

interface ScorePair {
  home: number;
  away: number;
}

/**
 * 原始表格 → 比赛。
 *
 * 两趟：先把每行文字变成事件，再按事件里出现的球员把名单建出来。
 * 名单先建好，`apply` 里就只需要改数据，不需要"找不到就顺手造一个"。
 */
export class MatchAssembler {
  constructor(private readonly factory: EventFactory = new EventFactory()) {}

  assemble(raw: RawMatch): Match {
    const home = new Team('home', raw.homeName, shortTeamName(raw.homeName));
    const away = new Team('away', raw.awayName, shortTeamName(raw.awayName));

    const events: GameEvent[] = [];
    let sequence = 0;
    let lastScore: ScorePair | null = null;
    let lastTime = '12:00';

    for (const row of raw.rows) {
      const time = row.time.trim() || lastTime;
      lastTime = time;
      const clock = GameClock.parse(time, row.quarter);

      const score = parseScoreCell(row.score);
      if (score && !sameScore(score, lastScore) && !(score.home === 0 && score.away === 0)) {
        events.push(
          new ScoreEvent(
            { id: (sequence += 1), clock, side: null, description: `比分 ${score.home} - ${score.away}` },
            score.home,
            score.away
          )
        );
        lastScore = score;
      }

      const columns: ReadonlyArray<[TeamSide, string, Team]> = [
        ['home', row.homeAction, home],
        ['away', row.awayAction, away]
      ];

      for (const [side, text, team] of columns) {
        const description = text.trim();
        if (description.length === 0) continue;
        const event = this.factory.create({
          id: (sequence += 1),
          clock,
          side,
          teamName: team.name,
          teamShortName: team.shortName,
          text: description
        });
        if (event) events.push(event);
      }
    }

    this.buildRosters(events, home, away);

    return new Match(home, away, events, {
      title: `${home.name} vs ${away.name}`,
      source: raw.title
    });
  }

  private buildRosters(events: readonly GameEvent[], home: Team, away: Team): void {
    const names: Record<TeamSide, string[]> = { home: [], away: [] };

    for (const event of events) {
      if (!event.side) continue;
      const bucket = names[event.side];
      for (const name of event.participants()) {
        const trimmed = name.trim();
        if (trimmed.length > 0 && !bucket.includes(trimmed)) bucket.push(trimmed);
      }
    }

    (['home', 'away'] as const).forEach((side) => {
      const team = side === 'home' ? home : away;
      names[side].forEach((name, slot) => {
        team.addPlayer(new Player(`${side}-${slot}`, name, String(slot + 1), slot));
      });
    });
  }
}

function sameScore(a: ScorePair, b: ScorePair | null): boolean {
  return b !== null && a.home === b.home && a.away === b.away;
}
