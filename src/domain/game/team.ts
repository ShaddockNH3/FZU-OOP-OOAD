import { BoxScore } from './box-score';
import { Player } from './player';

export type TeamSide = 'home' | 'away';

const STARTERS = 5;

/**
 * 球队实体。
 *
 * 分数只有一个来源：`stats.points`。原先 `Team.score` 和 `Team.teamStats.points`
 * 各写各的，罚球走一条路、比分回填走另一条路，最后必然对不上。
 */
export class Team {
  readonly stats = new BoxScore();
  private readonly roster = new Map<string, Player>();
  private readonly order: string[] = [];

  constructor(
    readonly side: TeamSide,
    readonly name: string,
    readonly shortName: string = name
  ) {}

  get score(): number {
    return this.stats.points;
  }

  setScore(value: number): void {
    this.stats.set('points', value);
  }

  addPlayer(player: Player): void {
    if (this.roster.has(player.id)) return;
    this.roster.set(player.id, player);
    this.order.push(player.id);
  }

  playerByName(name: string): Player | undefined {
    return this.players.find((player) => player.name === name);
  }

  get players(): Player[] {
    return this.order.map((id) => this.roster.get(id)).filter((player): player is Player => player !== undefined);
  }

  /** 场上五人：按 slot 排序取前五个。 */
  get onCourt(): Player[] {
    return [...this.players].sort((a, b) => a.slot - b.slot).slice(0, STARTERS);
  }

  /** 数据表里的"湖人""森林狼"这类简称，也当成这支球队。 */
  matchesName(name: string): boolean {
    const candidate = name.trim();
    if (candidate.length === 0) return false;
    return candidate === this.name || candidate === this.shortName || this.name.endsWith(candidate);
  }

  /** 清空技术统计但保留阵容，用于回放时重建状态。 */
  replica(): Team {
    const team = new Team(this.side, this.name, this.shortName);
    this.players.forEach((player) => {
      team.addPlayer(new Player(player.id, player.name, player.number, player.slot));
    });
    return team;
  }
}
