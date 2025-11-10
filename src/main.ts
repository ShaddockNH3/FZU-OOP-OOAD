import { Game } from './models/Game';
import { EventParser } from './parsers/EventParser';
import { Renderer } from './renderers/Renderer';
import { UIManager } from './ui/UIManager';
import './style.css';

/**
 * 主应用类 - 整合所有模块
 */
class App {
  private game: Game;
  private renderer: Renderer | null = null;
  private uiManager: UIManager;

  constructor() {
    // 创建游戏实例
    this.game = new Game('洛杉矶湖人', '明尼苏达森林狼');
    
    // 创建UI管理器
    this.uiManager = new UIManager();

    // 设置游戏回调
    this.setupGameCallbacks();

    // 初始化UI事件
    this.initializeUI();

    // 自动加载match.xlsx
    this.loadDefaultGame();
  }

  /**
   * 设置游戏回调函数
   */
  private setupGameCallbacks(): void {
    // 事件处理回调
    this.game.onEventProcessed = async (event) => {
      console.log(`[事件] ${event.description}`);
      console.log(`[时间] 第${event.quarter}节 ${event.timestamp}`);
      
      // 显示第X节和XLSX原始时间
      this.uiManager.updateTime(`第${event.quarter}节 ${event.timestamp}`);
      
      // 显示事件文字
      this.showEventText(event.description);
      
      // 播放动画
      if (this.renderer) {
        await this.renderer.playAnimation(event);
      }

      // 更新统计数据
      this.updateUI();
    };

    // 比赛结束回调
    this.game.onGameEnd = () => {
      this.uiManager.showSuccess('比赛结束!');
    };

    // 比分更新回调
    this.game.onScoreUpdated = (homeScore, awayScore) => {
      this.uiManager.updateScore(homeScore, awayScore);
    };

    // 进度更新回调
    this.game.onProgressUpdated = (current, total) => {
      this.updateProgress(current, total);
    };
  }

  /**
   * 显示事件文字
   */
  private showEventText(text: string): void {
    const eventText = document.getElementById('event-text');
    if (eventText) {
      eventText.textContent = text;
      eventText.style.animation = 'none';
      setTimeout(() => {
        eventText.style.animation = 'pulse 0.5s ease-in-out';
      }, 10);
    }
  }

  /**
   * 更新进度条
   */
  private updateProgress(current: number, total: number): void {
    const currentElement = document.getElementById('current-event');
    const totalElement = document.getElementById('total-events');
    const progressBar = document.getElementById('progress-bar') as HTMLInputElement;

    if (currentElement) currentElement.textContent = current.toString();
    if (totalElement) totalElement.textContent = total.toString();
    if (progressBar) {
      progressBar.max = total.toString();
      progressBar.value = current.toString();
    }
  }

  /**
   * 初始化UI事件
   */
  private initializeUI(): void {
    // 播放按钮
    const playBtn = document.getElementById('play-btn');
    playBtn?.addEventListener('click', () => {
      this.game.play();
    });

    // 暂停按钮
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn?.addEventListener('click', () => {
      this.game.pause();
    });

    // 上一步按钮
    const prevBtn = document.getElementById('prev-btn');
    prevBtn?.addEventListener('click', async () => {
      this.game.pause();
      const currentIndex = this.game.currentEventIndex;
      if (currentIndex > 0) {
        // 使用seekToEvent跳转到上一步
        this.game.seekToEvent(currentIndex - 1);
        // 手动触发渲染更新
        if (this.renderer) {
          this.renderer.drawPlayers(
            this.game.homeTeam.getAllPlayers(),
            this.game.awayTeam.getAllPlayers()
          );
        }
        // 更新时间显示
        if (currentIndex - 1 >= 0) {
          const event = this.game.events[currentIndex - 1];
          this.uiManager.updateTime(`第${event.quarter}节 ${event.timestamp}`);
        }
      }
    });

    // 下一步按钮
    const nextBtn = document.getElementById('next-btn');
    nextBtn?.addEventListener('click', async () => {
      this.game.pause();
      const currentIndex = this.game.currentEventIndex;
      if (currentIndex < this.game.events.length) {
        // 直接处理下一个事件(会触发动画)
        this.game.processNextEvent();
      }
    });

    // 重置按钮
    const resetBtn = document.getElementById('reset-btn');
    resetBtn?.addEventListener('click', () => {
      this.game.reset();
      if (this.renderer) {
        this.renderer.drawPlayers(
          this.game.homeTeam.getAllPlayers(),
          this.game.awayTeam.getAllPlayers()
        );
      }
      this.uiManager.updateScore(0, 0);
      this.uiManager.updateTime('第1节 12:00');
      this.updateProgress(0, this.game.events.length);
    });

    // 速度控制按钮
    const speeds = [0.5, 1, 2, 4];
    speeds.forEach(speed => {
      const btn = document.getElementById(`speed-${speed}`);
      btn?.addEventListener('click', () => {
        this.game.setSpeed(speed);
        console.log(`播放速度: ${speed}x`);
      });
    });

    // 进度条拖动
    const progressBar = document.getElementById('progress-bar') as HTMLInputElement;
    let isDragging = false;

    progressBar?.addEventListener('mousedown', () => {
      isDragging = true;
      this.game.pause();
    });

    progressBar?.addEventListener('mouseup', () => {
      if (isDragging) {
        const targetIndex = parseInt(progressBar.value);
        this.game.seekToEvent(targetIndex);
        isDragging = false;
      }
    });

    progressBar?.addEventListener('input', () => {
      if (isDragging) {
        const current = parseInt(progressBar.value);
        const total = parseInt(progressBar.max);
        this.updateProgress(current, total);
      }
    });

    const loadMatch1Btn = document.getElementById('load-match1');
    loadMatch1Btn?.addEventListener('click', () => {
      this.loadMatchFile('/match.xlsx');
    });

    const loadMatch2Btn = document.getElementById('load-match2');
    loadMatch2Btn?.addEventListener('click', () => {
      this.loadMatchFile('/match2.xlsx');
    });

    const loadCustomBtn = document.getElementById('load-custom');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    loadCustomBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          this.uiManager.showLoading('正在加载比赛数据...');
          await this.loadGame(file);
          this.uiManager.hideLoading();
          console.log('✅ 自定义比赛加载成功!');
        } catch (error) {
          console.error('❌ 加载失败:', error);
          this.uiManager.showError(`加载比赛数据失败: ${error}`);
        }
      }
      target.value = '';
    });
  }

  private async loadMatchFile(path: string): Promise<void> {
    try {
      this.uiManager.showLoading('正在加载比赛数据...');
      console.log(`开始加载 ${path}...`);

      const response = await fetch(path);
      console.log('fetch 响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`无法加载文件: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('文件大小:', blob.size, 'bytes');
      
      const file = new File([blob], path.split('/').pop() || 'match.xlsx');
      await this.loadGame(file);

      this.uiManager.hideLoading();
      console.log('✅ 比赛数据加载成功!');
    } catch (error) {
      console.error('❌ 加载失败:', error);
      this.uiManager.showError(`加载比赛数据失败: ${error}`);
    }
  }

  private async loadDefaultGame(): Promise<void> {
    await this.loadMatchFile('/match.xlsx');
  }

  private async loadGame(file: File): Promise<void> {
    try {
      const result = await EventParser.parseXLSX(file);
      console.log(`解析到 ${result.events.length} 个事件`);
      console.log(`队伍: ${result.homeTeamName} vs ${result.awayTeamName}`);

      // 更新 Game 实例的队伍名称
      this.game = new Game(result.homeTeamName, result.awayTeamName);
      
      // 重新设置游戏回调
      this.setupGameCallbacks();
      
      this.game.loadGame(result.events);

      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        if (this.renderer) {
          this.renderer.destroy();
        }
        this.renderer = new Renderer(canvas, result.homeTeamName, result.awayTeamName);
        
        const homePlayers = this.game.homeTeam.getAllPlayers();
        const awayPlayers = this.game.awayTeam.getAllPlayers();
        this.renderer.drawPlayers(homePlayers, awayPlayers);
      }

      // 更新 UI 中的队伍名称
      this.uiManager.updateTeamNames(result.homeTeamName, result.awayTeamName);
      this.uiManager.updateScore(0, 0);
      this.uiManager.updateTime('第1节 12:00');
      this.updateUI();
      
      console.log('比赛加载完成,点击播放按钮开始!');
    } catch (error) {
      console.error('加载比赛失败:', error);
      throw error;
    }
  }

  private updateUI(): void {
    this.uiManager.updateTeamStats(this.game.homeTeam, this.game.awayTeam);
    this.uiManager.updatePlayerStats(this.game.homeTeam, this.game.awayTeam);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
