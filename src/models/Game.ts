import { Team } from './Team';
import { GameEvent } from './GameEvent';
import { Player } from './Player';

/**
 * 计时器类 - 管理比赛时间
 */
export class Clock {
  private minutes: number = 12;
  private seconds: number = 0;
  private quarter: number = 1;

  /**
   * 设置时间
   */
  setTime(timeString: string): void {
    if (!timeString) return;
    
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0]);
      const secs = parseInt(parts[1]);
      if (!isNaN(mins) && !isNaN(secs)) {
        this.minutes = mins;
        this.seconds = secs;
      }
    }
  }

  /**
   * 设置节数
   */
  setQuarter(quarter: number): void {
    this.quarter = quarter;
  }

  /**
   * 获取当前时间字符串
   */
  getTimeString(): string {
    return `${this.minutes.toString().padStart(2, '0')}:${this.seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 获取当前节数
   */
  getQuarter(): number {
    return this.quarter;
  }
}

/**
 * 游戏/比赛类 - 整个系统的"大管家"
 */
export class Game {
  homeTeam: Team;                        // 主队
  awayTeam: Team;                        // 客队
  gameClock: Clock;                      // 比赛计时器
  events: GameEvent[];                   // 所有事件数组
  currentEventIndex: number = 0;         // 当前事件索引
  isPlaying: boolean = false;            // 是否正在播放
  playbackSpeed: number = 1;             // 播放速度
  private eventTimer: ReturnType<typeof setTimeout> | null = null; // 事件定时器

  // 回调函数
  onEventProcessed?: (event: GameEvent) => void;
  onScoreUpdated?: (homeScore: number, awayScore: number) => void;
  onTimeUpdated?: (timeString: string) => void;
  onGameEnd?: () => void;
  onProgressUpdated?: (current: number, total: number) => void;

  constructor(homeTeamName: string, awayTeamName: string) {
    this.homeTeam = new Team(homeTeamName, 'LAL');
    this.awayTeam = new Team(awayTeamName, 'MIN');
    this.gameClock = new Clock();
    this.events = [];
  }

  /**
   * 加载比赛数据
   */
  loadGame(events: GameEvent[]): void {
    this.events = events;
    this.currentEventIndex = 0;
    this.isPlaying = false;
    
    // 初始化球员（从事件中提取）
    this.initializePlayers();
  }

  /**
   * 从事件中初始化球员
   */
  private initializePlayers(): void {
    const homePlayerNames = new Set<string>();
    const awayPlayerNames = new Set<string>();

    // 遍历所有事件，收集球员名字
    this.events.forEach(event => {
      if ('playerName' in event && event.playerName) {
        const playerName = event.playerName as string;
        if (event.teamName === this.homeTeam.name) {
          homePlayerNames.add(playerName);
        } else if (event.teamName === this.awayTeam.name) {
          awayPlayerNames.add(playerName);
        }
      }
      // 处理助攻球员
      if ('assistPlayerName' in event && event.assistPlayerName) {
        const assistName = event.assistPlayerName as string;
        if (event.teamName === this.homeTeam.name) {
          homePlayerNames.add(assistName);
        } else if (event.teamName === this.awayTeam.name) {
          awayPlayerNames.add(assistName);
        }
      }
    });

    console.log(`主队球员: ${homePlayerNames.size}人`, Array.from(homePlayerNames));
    console.log(`客队球员: ${awayPlayerNames.size}人`, Array.from(awayPlayerNames));

    // 为主队创建球员 - 确保至少5人
    let playerNumber = 1;
    homePlayerNames.forEach(name => {
      const player = this.homeTeam.getPlayerByName(name);
      if (!player) {
        const newPlayer = new Player(
          `home_${playerNumber}`,
          name,
          playerNumber.toString(),
          this.homeTeam.name,
          { x: 100, y: 100 }
        );
        this.homeTeam.addPlayer(newPlayer);
        playerNumber++;
      }
    });

    // 如果主队球员不足5人,添加替补
    while (this.homeTeam.getAllPlayers().length < 5) {
      const newPlayer = new Player(
        `home_${playerNumber}`,
        `球员${playerNumber}`,
        playerNumber.toString(),
        this.homeTeam.name,
        { x: 100, y: 100 }
      );
      this.homeTeam.addPlayer(newPlayer);
      playerNumber++;
    }

    // 为客队创建球员 - 确保至少5人
    playerNumber = 1;
    awayPlayerNames.forEach(name => {
      const player = this.awayTeam.getPlayerByName(name);
      if (!player) {
        const newPlayer = new Player(
          `away_${playerNumber}`,
          name,
          playerNumber.toString(),
          this.awayTeam.name,
          { x: 700, y: 100 }
        );
        this.awayTeam.addPlayer(newPlayer);
        playerNumber++;
      }
    });

    // 如果客队球员不足5人,添加替补
    while (this.awayTeam.getAllPlayers().length < 5) {
      const newPlayer = new Player(
        `away_${playerNumber}`,
        `球员${playerNumber}`,
        playerNumber.toString(),
        this.awayTeam.name,
        { x: 700, y: 100 }
      );
      this.awayTeam.addPlayer(newPlayer);
      playerNumber++;
    }

    console.log(`✅ 主队最终: ${this.homeTeam.getAllPlayers().length}人`);
    console.log(`✅ 客队最终: ${this.awayTeam.getAllPlayers().length}人`);
  }

  /**
   * 开始播放
   */
  play(): void {
    if (this.currentEventIndex >= this.events.length) {
      console.log('比赛已结束');
      if (this.onGameEnd) this.onGameEnd();
      return;
    }

    this.isPlaying = true;
    this.scheduleNextEvent();
  }

  /**
   * 暂停播放
   */
  pause(): void {
    this.isPlaying = false;
    if (this.eventTimer) {
      clearTimeout(this.eventTimer);
      this.eventTimer = null;
    }
  }

  /**
   * 设置播放速度
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  /**
   * 调度下一个事件
   */
  private scheduleNextEvent(): void {
    if (!this.isPlaying || this.currentEventIndex >= this.events.length) {
      this.isPlaying = false;
      if (this.currentEventIndex >= this.events.length && this.onGameEnd) {
        this.onGameEnd();
      }
      return;
    }

    const delay = 1000 / this.playbackSpeed; // 基础延迟
    this.eventTimer = setTimeout(() => {
      this.processNextEvent();
      this.scheduleNextEvent();
    }, delay);
  }

  /**
   * 处理下一个事件
   */
  processNextEvent(): void {
    if (this.currentEventIndex >= this.events.length) return;

    const event = this.events[this.currentEventIndex];
    
    // 应用事件效果
    event.apply(this);
    
    // 更新时钟
    this.gameClock.setTime(event.timestamp);
    this.gameClock.setQuarter(event.quarter);
    
    // 触发回调
    if (this.onEventProcessed) {
      this.onEventProcessed(event);
    }
    
    if (this.onTimeUpdated) {
      this.onTimeUpdated(this.gameClock.getTimeString());
    }
    
    if (this.onScoreUpdated) {
      this.onScoreUpdated(this.homeTeam.score, this.awayTeam.score);
    }

    if (this.onProgressUpdated) {
      this.onProgressUpdated(this.currentEventIndex, this.events.length);
    }

    this.currentEventIndex++;
  }

  /**
   * 跳转到指定事件
   */
  seekToEvent(eventIndex: number): void {
    if (eventIndex < 0 || eventIndex >= this.events.length) return;
    
    const wasPlaying = this.isPlaying;
    this.pause();
    
    // 重置比赛状态
    this.homeTeam = new Team(this.homeTeam.name, this.homeTeam.logo);
    this.awayTeam = new Team(this.awayTeam.name, this.awayTeam.logo);
    this.initializePlayers();
    
    // 重放到指定位置
    this.currentEventIndex = 0;
    while (this.currentEventIndex < eventIndex && this.currentEventIndex < this.events.length) {
      const event = this.events[this.currentEventIndex];
      event.apply(this);
      this.gameClock.setTime(event.timestamp);
      this.gameClock.setQuarter(event.quarter);
      this.currentEventIndex++;
    }
    
    // 更新UI
    if (this.onScoreUpdated) {
      this.onScoreUpdated(this.homeTeam.score, this.awayTeam.score);
    }
    if (this.onTimeUpdated) {
      this.onTimeUpdated(this.gameClock.getTimeString());
    }
    if (this.onProgressUpdated) {
      this.onProgressUpdated(this.currentEventIndex, this.events.length);
    }
    
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * 获取当前进度
   */
  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentEventIndex,
      total: this.events.length,
      percentage: this.events.length > 0 ? (this.currentEventIndex / this.events.length) * 100 : 0
    };
  }

  /**
   * 根据队名获取球队
   */
  getTeamByName(teamName: string): Team | undefined {
    if (teamName === this.homeTeam.name) return this.homeTeam;
    if (teamName === this.awayTeam.name) return this.awayTeam;
    return undefined;
  }

  /**
   * 重置比赛
   */
  reset(): void {
    this.pause();
    this.currentEventIndex = 0;
    this.homeTeam = new Team(this.homeTeam.name, this.homeTeam.logo);
    this.awayTeam = new Team(this.awayTeam.name, this.awayTeam.logo);
    this.initializePlayers();
  }
}
