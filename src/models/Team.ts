import { Player } from './Player';
import { Statistics } from './Statistics';

/**
 * 球队类 - 封装一支球队的所有信息
 */
export class Team {
  name: string;                          // 球队名称
  logo: string;                          // Logo图片URL或文字
  players: Map<string, Player>;          // 球员映射表 (playerId => Player)
  teamStats: Statistics;                 // 球队整体技术统计
  score: number = 0;                     // 当前总得分

  constructor(name: string, logo: string = '') {
    this.name = name;
    this.logo = logo;
    this.players = new Map();
    this.teamStats = new Statistics();
  }

  /**
   * 添加球员到球队
   */
  addPlayer(player: Player): void {
    this.players.set(player.playerId, player);
  }

  /**
   * 根据球员ID获取球员
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * 根据球员姓名获取球员
   */
  getPlayerByName(name: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.name === name) {
        return player;
      }
    }
    return undefined;
  }

  /**
   * 更新球队得分
   */
  updateScore(points: number): void {
    this.score += points;
    this.teamStats.increment('points', points);
  }

  /**
   * 更新球队统计
   */
  updateTeamStats(statType: keyof Statistics, value: number = 1): void {
    this.teamStats.increment(statType, value);
  }

  /**
   * 获取所有球员数组
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * 设置球队得分（用于从比分中解析）
   */
  setScore(score: number): void {
    this.score = score;
  }
}
