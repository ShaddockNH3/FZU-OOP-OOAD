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
   * 生成队伍 Logo（取前两个字的拼音首字母）
   */
  private generateTeamLogo(teamName: string): string {
    // 常见汉字到拼音首字母的映射
    const pinyinMap: { [key: string]: string } = {
      '洛': 'L', '杉': 'S', '矶': 'J', '湖': 'H', '人': 'R',
      '明': 'M', '尼': 'N', '苏': 'S', '达': 'D', '森': 'S', '林': 'L', '狼': 'L',
      '猪': 'Z', '咪': 'M',
      '神': 'S', '秘': 'M',
      '北': 'B', '京': 'J', '上': 'S', '海': 'H', '广': 'G', '州': 'Z',
      '深': 'S', '圳': 'Z', '天': 'T', '津': 'J', '重': 'C', '庆': 'Q',
      '成': 'C', '都': 'D', '西': 'X', '安': 'A', '南': 'N',
      '杭': 'H', '武': 'W', '汉': 'H', '长': 'C', '沙': 'S',
      '火': 'H', '箭': 'J', '勇': 'Y', '士': 'S', '骑': 'Q', '马': 'M',
      '快': 'K', '船': 'C', '雷': 'L', '霆': 'T', '太': 'T', '阳': 'Y',
      '热': 'R', '鹈': 'T', '鹕': 'H', '灰': 'H', '熊': 'X',
      '公': 'G', '牛': 'N', '活': 'H', '塞': 'S', '尔': 'E', '特': 'T',
      '开': 'K', '拓': 'T', '者': 'Z', '国': 'G', '王': 'W',
      '爵': 'J', '独': 'D', '行': 'X', '侠': 'X', '魔': 'M', '术': 'S',
      '网': 'W', '黄': 'H', '蜂': 'F', '鹰': 'Y', '猛': 'M', '龙': 'L',
      '掘': 'J', '金': 'J', '老': 'L', '凯': 'K', '篮': 'L',
      '克': 'K', '斯': 'S', '刺': 'C', '奇': 'Q', '才': 'C',
      '小': 'X', '雄': 'X', '鹿': 'L', '步': 'B'
    };

    // 如果是英文或数字，直接取前2-3个字符
    if (/^[a-zA-Z0-9\s]+$/.test(teamName)) {
      const words = teamName.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return teamName.substring(0, 3).toUpperCase();
    }

    // 处理中文队名
    const chars = teamName.trim().split('');
    let logo = '';
    let count = 0;

    for (const char of chars) {
      if (count >= 2) break; // 最多取两个字的首字母
      
      if (pinyinMap[char]) {
        logo += pinyinMap[char];
        count++;
      } else if (/[a-zA-Z0-9]/.test(char)) {
        // 如果是字母或数字，直接使用
        logo += char.toUpperCase();
        count++;
      }
    }

    // 如果不足2个字符，尝试用更多字符补充
    if (logo.length < 2 && chars.length > 0) {
      // 只取到了1个或0个，尝试添加更多
      for (let i = logo.length; i < chars.length && logo.length < 2; i++) {
        if (pinyinMap[chars[i]]) {
          logo += pinyinMap[chars[i]];
        }
      }
    }

    // 如果还是空的，就用队名前2-3个字符
    if (logo.length === 0) {
      logo = teamName.substring(0, Math.min(3, teamName.length));
    }

    return logo || '??';
  }

  /**
   * 更新队伍名称
   */
  updateTeamNames(homeTeamName: string, awayTeamName: string): void {
    const homeNameElement = document.getElementById('home-team-name');
    const awayNameElement = document.getElementById('away-team-name');
    const homePlayersTitleElement = document.getElementById('home-players-title');
    const awayPlayersTitleElement = document.getElementById('away-players-title');
    
    if (homeNameElement) homeNameElement.textContent = homeTeamName;
    if (awayNameElement) awayNameElement.textContent = awayTeamName;
    if (homePlayersTitleElement) homePlayersTitleElement.textContent = `${homeTeamName} 球员统计`;
    if (awayPlayersTitleElement) awayPlayersTitleElement.textContent = `${awayTeamName} 球员统计`;
    
    // 更新队伍 logo (使用拼音首字母)
    const homeLogoElement = document.querySelector('.home-team .team-logo');
    const awayLogoElement = document.querySelector('.away-team .team-logo');
    if (homeLogoElement) homeLogoElement.textContent = this.generateTeamLogo(homeTeamName);
    if (awayLogoElement) awayLogoElement.textContent = this.generateTeamLogo(awayTeamName);
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
