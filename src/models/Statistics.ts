/**
 * 统计数据类 - 用于存储球队或球员的技术统计
 */
export class Statistics {
  points: number = 0;                    // 总得分
  fieldGoalsMade: number = 0;            // 投篮命中
  fieldGoalsAttempted: number = 0;       // 投篮出手
  threePointersMade: number = 0;         // 三分命中
  threePointersAttempted: number = 0;    // 三分出手
  freeThrowsMade: number = 0;            // 罚球命中
  freeThrowsAttempted: number = 0;       // 罚球出手
  offensiveRebounds: number = 0;         // 进攻篮板
  defensiveRebounds: number = 0;         // 防守篮板
  assists: number = 0;                   // 助攻
  fouls: number = 0;                     // 犯规
  blocks: number = 0;                    // 盖帽
  steals: number = 0;                    // 抢断
  turnovers: number = 0;                 // 失误

  /**
   * 获取总篮板数
   */
  get rebounds(): number {
    return this.offensiveRebounds + this.defensiveRebounds;
  }

  /**
   * 获取投篮命中率
   */
  get fieldGoalPercentage(): string {
    if (this.fieldGoalsAttempted === 0) return '0.0%';
    return ((this.fieldGoalsMade / this.fieldGoalsAttempted) * 100).toFixed(1) + '%';
  }

  /**
   * 获取三分命中率
   */
  get threePointPercentage(): string {
    if (this.threePointersAttempted === 0) return '0.0%';
    return ((this.threePointersMade / this.threePointersAttempted) * 100).toFixed(1) + '%';
  }

  /**
   * 增加某个统计项的值
   */
  increment(statName: keyof Statistics, value: number = 1): void {
    if (typeof this[statName] === 'number') {
      (this[statName] as number) += value;
    }
  }

  /**
   * 克隆统计数据
   */
  clone(): Statistics {
    const newStats = new Statistics();
    Object.assign(newStats, this);
    return newStats;
  }
}
