/**
 * 游戏事件 - 抽象基类
 * 所有比赛事件的通用接口
 */
export abstract class GameEvent {
  eventId: number;                       // 事件ID
  timestamp: string;                     // 时间戳 (MM:SS)
  quarter: number;                       // 第几节
  type: string;                          // 事件类型
  teamName: string;                      // 触发事件的球队名称
  description: string;                   // 事件描述

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    type: string,
    teamName: string,
    description: string
  ) {
    this.eventId = eventId;
    this.timestamp = timestamp;
    this.quarter = quarter;
    this.type = type;
    this.teamName = teamName;
    this.description = description;
  }

  /**
   * 抽象方法：每个事件子类需要实现如何应用自己的效果
   */
  abstract apply(game: any): void;
}

/**
 * 跳球事件
 */
export class JumpBallEvent extends GameEvent {
  winner: string;

  constructor(eventId: number, timestamp: string, quarter: number, teamName: string, description: string, winner: string) {
    super(eventId, timestamp, quarter, 'JUMP_BALL', teamName, description);
    this.winner = winner;
  }

  apply(_game: any): void {
    // 跳球逻辑
    console.log(`[跳球] ${this.description}`);
  }
}

/**
 * 投篮事件
 */
export class ShotEvent extends GameEvent {
  playerName: string;
  isMade: boolean;                       // 是否命中
  points: number;                        // 得分 (2或3)
  shotType: string;                      // 投篮类型
  assistPlayerName?: string;             // 助攻球员名称

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string,
    isMade: boolean,
    points: number,
    shotType: string,
    assistPlayerName?: string
  ) {
    super(eventId, timestamp, quarter, isMade ? 'SHOT_MADE' : 'SHOT_MISSED', teamName, description);
    this.playerName = playerName;
    this.isMade = isMade;
    this.points = points;
    this.shotType = shotType;
    this.assistPlayerName = assistPlayerName;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    // 更新出手数
    if (this.points === 3) {
      player.updateStats('threePointersAttempted', 1);
      team.updateTeamStats('threePointersAttempted', 1);
      
      // 如果命中，更新三分命中数
      if (this.isMade) {
        player.updateStats('threePointersMade', 1);
        team.updateTeamStats('threePointersMade', 1);
      }
    } else {
      player.updateStats('fieldGoalsAttempted', 1);
      team.updateTeamStats('fieldGoalsAttempted', 1);
      
      // 如果命中，更新命中数
      if (this.isMade) {
        player.updateStats('fieldGoalsMade', 1);
        team.updateTeamStats('fieldGoalsMade', 1);
      }
    }

    // 如果命中，更新得分
    if (this.isMade) {
      player.updateStats('points', this.points);
      // 注意: 球队总分由 ScoreUpdateEvent 统一管理，这里不更新
      
      // 处理助攻
      if (this.assistPlayerName) {
        const assistPlayer = team.getPlayerByName(this.assistPlayerName);
        if (assistPlayer) {
          assistPlayer.updateStats('assists', 1);
          team.updateTeamStats('assists', 1);
        }
      }
    }
  }
}

/**
 * 篮板事件
 */
export class ReboundEvent extends GameEvent {
  playerName: string;
  reboundType: 'offensive' | 'defensive'; // 进攻或防守篮板

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string,
    reboundType: 'offensive' | 'defensive'
  ) {
    super(eventId, timestamp, quarter, 'REBOUND', teamName, description);
    this.playerName = playerName;
    this.reboundType = reboundType;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    if (this.reboundType === 'offensive') {
      player.updateStats('offensiveRebounds', 1);
      team.updateTeamStats('offensiveRebounds', 1);
    } else {
      player.updateStats('defensiveRebounds', 1);
      team.updateTeamStats('defensiveRebounds', 1);
    }
  }
}

/**
 * 犯规事件
 */
export class FoulEvent extends GameEvent {
  playerName: string;
  foulType: string;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string,
    foulType: string
  ) {
    super(eventId, timestamp, quarter, 'FOUL', teamName, description);
    this.playerName = playerName;
    this.foulType = foulType;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    player.updateStats('fouls', 1);
    team.updateTeamStats('fouls', 1);
  }
}

/**
 * 盖帽事件
 */
export class BlockEvent extends GameEvent {
  playerName: string;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string
  ) {
    super(eventId, timestamp, quarter, 'BLOCK', teamName, description);
    this.playerName = playerName;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    player.updateStats('blocks', 1);
    team.updateTeamStats('blocks', 1);
  }
}

/**
 * 抢断事件
 */
export class StealEvent extends GameEvent {
  playerName: string;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string
  ) {
    super(eventId, timestamp, quarter, 'STEAL', teamName, description);
    this.playerName = playerName;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    player.updateStats('steals', 1);
    team.updateTeamStats('steals', 1);
  }
}

/**
 * 失误事件
 */
export class TurnoverEvent extends GameEvent {
  playerName: string;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string
  ) {
    super(eventId, timestamp, quarter, 'TURNOVER', teamName, description);
    this.playerName = playerName;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    player.updateStats('turnovers', 1);
    team.updateTeamStats('turnovers', 1);
  }
}

/**
 * 换人事件
 */
export class SubstitutionEvent extends GameEvent {
  playerIn: string;
  playerOut: string;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerIn: string,
    playerOut: string
  ) {
    super(eventId, timestamp, quarter, 'SUBSTITUTION', teamName, description);
    this.playerIn = playerIn;
    this.playerOut = playerOut;
  }

  apply(_game: any): void {
    console.log(`[换人] ${this.teamName}: ${this.playerOut} 下, ${this.playerIn} 上`);
  }
}

/**
 * 罚球事件
 */
export class FreeThrowEvent extends GameEvent {
  playerName: string;
  isMade: boolean;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    teamName: string,
    description: string,
    playerName: string,
    isMade: boolean
  ) {
    super(eventId, timestamp, quarter, isMade ? 'FREE_THROW_MADE' : 'FREE_THROW_MISSED', teamName, description);
    this.playerName = playerName;
    this.isMade = isMade;
  }

  apply(game: any): void {
    const team = game.getTeamByName(this.teamName);
    if (!team) return;

    const player = team.getPlayerByName(this.playerName);
    if (!player) return;

    player.updateStats('freeThrowsAttempted', 1);
    team.updateTeamStats('freeThrowsAttempted', 1);

    if (this.isMade) {
      player.updateStats('freeThrowsMade', 1);
      team.updateTeamStats('freeThrowsMade', 1);
      player.updateStats('points', 1);
      team.updateScore(1);
    }
  }
}

/**
 * 比分更新事件
 */
export class ScoreUpdateEvent extends GameEvent {
  homeScore: number;
  awayScore: number;

  constructor(
    eventId: number,
    timestamp: string,
    quarter: number,
    description: string,
    homeScore: number,
    awayScore: number
  ) {
    super(eventId, timestamp, quarter, 'SCORE_UPDATE', '', description);
    this.homeScore = homeScore;
    this.awayScore = awayScore;
  }

  apply(game: any): void {
    // 直接设置球队得分
    if (game.homeTeam) {
      game.homeTeam.setScore(this.homeScore);
    }
    if (game.awayTeam) {
      game.awayTeam.setScore(this.awayScore);
    }
  }
}

/**
 * 节结束事件
 */
export class QuarterEndEvent extends GameEvent {
  constructor(eventId: number, timestamp: string, quarter: number, description: string) {
    super(eventId, timestamp, quarter, 'QUARTER_END', '', description);
  }

  apply(_game: any): void {
    console.log(`[第${this.quarter}节结束]`);
  }
}
