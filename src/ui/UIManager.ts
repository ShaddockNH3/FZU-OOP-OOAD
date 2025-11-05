import { Team } from '../models/Team';
import { Player } from '../models/Player';

/**
 * UI管理器 - 负责更新界面上的数据统计
 */
export class UIManager {
  private scoreElement: HTMLElement;
  private timeElement: HTMLElement;
  private quarterElement: HTMLElement;
  private teamStatsElement: HTMLElement;
  private homePlayersStatsElement: HTMLElement;
  private awayPlayersStatsElement: HTMLElement;

  constructor() {
    this.scoreElement = document.getElementById('score')!;
    this.timeElement = document.getElementById('game-time')!;
    this.quarterElement = document.getElementById('game-quarter')!;
    this.teamStatsElement = document.getElementById('team-stats')!;
    this.homePlayersStatsElement = document.getElementById('home-players-stats')!;
    this.awayPlayersStatsElement = document.getElementById('away-players-stats')!;
  }

  /**
   * 更新比分
   */
  updateScore(homeScore: number, awayScore: number): void {
    this.scoreElement.textContent = `${homeScore} - ${awayScore}`;
  }

  /**
   * 更新时间(分开显示节次和时间)
   */
  updateTime(time: string): void {
    // 解析 "第X节 MM:SS" 格式
    const match = time.match(/第(\d+)节\s+(.+)/);
    if (match) {
      this.quarterElement.textContent = `第${match[1]}节`;
      this.timeElement.textContent = match[2];
    } else {
      // 如果格式不匹配,直接显示
      this.timeElement.textContent = time;
    }
  }

  /**
   * 更新球队技术统计
   */
  updateTeamStats(homeTeam: Team, awayTeam: Team): void {
    const stats = [
      { label: '得分', home: homeTeam.score, away: awayTeam.score },
      { label: '投篮', home: `${homeTeam.teamStats.fieldGoalsMade}/${homeTeam.teamStats.fieldGoalsAttempted}`, away: `${awayTeam.teamStats.fieldGoalsMade}/${awayTeam.teamStats.fieldGoalsAttempted}` },
      { label: '三分', home: `${homeTeam.teamStats.threePointersMade}/${homeTeam.teamStats.threePointersAttempted}`, away: `${awayTeam.teamStats.threePointersMade}/${awayTeam.teamStats.threePointersAttempted}` },
      { label: '篮板', home: homeTeam.teamStats.rebounds, away: awayTeam.teamStats.rebounds },
      { label: '助攻', home: homeTeam.teamStats.assists, away: awayTeam.teamStats.assists },
      { label: '盖帽', home: homeTeam.teamStats.blocks, away: awayTeam.teamStats.blocks },
      { label: '抢断', home: homeTeam.teamStats.steals, away: awayTeam.teamStats.steals },
      { label: '犯规', home: homeTeam.teamStats.fouls, away: awayTeam.teamStats.fouls },
      { label: '失误', home: homeTeam.teamStats.turnovers, away: awayTeam.teamStats.turnovers }
    ];

    let html = '';
    stats.forEach(stat => {
      html += `
        <div class="stat-row">
          <div class="stat-value-home">${stat.home}</div>
          <div class="stat-label">${stat.label}</div>
          <div class="stat-value-away">${stat.away}</div>
        </div>
      `;
    });

    this.teamStatsElement.innerHTML = html;
  }

  /**
   * 更新球员统计
   */
  updatePlayerStats(homeTeam: Team, awayTeam: Team): void {
    // 更新主队球员统计
    this.updatePlayersTable(this.homePlayersStatsElement, homeTeam.getAllPlayers());
    
    // 更新客队球员统计
    this.updatePlayersTable(this.awayPlayersStatsElement, awayTeam.getAllPlayers());
  }

  /**
   * 更新球员统计表格
   */
  private updatePlayersTable(tableBody: HTMLElement, players: Player[]): void {
    let html = '';

    // 按得分排序
    const sortedPlayers = [...players].sort((a, b) => 
      b.personalStats.points - a.personalStats.points
    );

    sortedPlayers.forEach(player => {
      const stats = player.personalStats;
      html += `
        <tr>
          <td>${player.number}</td>
          <td>${player.name}</td>
          <td>${stats.points}</td>
          <td>${stats.fieldGoalsMade}/${stats.fieldGoalsAttempted}</td>
          <td>${stats.threePointersMade}/${stats.threePointersAttempted}</td>
          <td>${stats.freeThrowsMade}/${stats.freeThrowsAttempted}</td>
          <td>${stats.rebounds}</td>
          <td>${stats.assists}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  /**
   * 显示加载状态
   */
  showLoading(message: string = '加载中...'): void {
    // 可以添加加载动画
    console.log(message);
  }

  /**
   * 隐藏加载状态
   */
  hideLoading(): void {
    // 隐藏加载动画
  }

  /**
   * 显示错误消息
   */
  showError(message: string): void {
    alert(`错误: ${message}`);
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    console.log(`成功: ${message}`);
  }
}
