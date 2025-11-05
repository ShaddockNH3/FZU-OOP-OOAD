import { Statistics } from './Statistics';

/**
 * 球员类 - 代表场上的每一位球员
 */
export class Player {
  playerId: string;                      // 唯一标识符
  name: string;                          // 球员姓名
  number: string;                        // 球衣号码
  position: { x: number; y: number };   // 场上位置 (像素坐标)
  personalStats: Statistics;             // 个人技术统计
  teamName: string;                      // 所属球队名称

  constructor(
    playerId: string,
    name: string,
    number: string = '0',
    teamName: string = '',
    initialPosition: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    this.playerId = playerId;
    this.name = name;
    this.number = number;
    this.position = initialPosition;
    this.personalStats = new Statistics();
    this.teamName = teamName;
  }

  /**
   * 移动到新位置
   */
  moveTo(newPosition: { x: number; y: number }): void {
    this.position = newPosition;
  }

  /**
   * 根据事件更新个人统计
   */
  updateStats(statType: keyof Statistics, value: number = 1): void {
    this.personalStats.increment(statType, value);
  }

  /**
   * 获取投篮统计字符串 (命中/出手)
   */
  getFieldGoalStats(): string {
    return `${this.personalStats.fieldGoalsMade}/${this.personalStats.fieldGoalsAttempted}`;
  }

  /**
   * 获取三分统计字符串
   */
  getThreePointStats(): string {
    return `${this.personalStats.threePointersMade}/${this.personalStats.threePointersAttempted}`;
  }

  /**
   * 获取罚球统计字符串
   */
  getFreeThrowStats(): string {
    return `${this.personalStats.freeThrowsMade}/${this.personalStats.freeThrowsAttempted}`;
  }
}
