import * as PIXI from 'pixi.js';
import { Player } from '../models/Player';
import { GameEvent, ShotEvent, ReboundEvent, FoulEvent, BlockEvent, StealEvent, SubstitutionEvent, TurnoverEvent } from '../models/GameEvent';

/**
 * 渲染器 - 负责使用PixiJS绘制比赛动画
 */
export class Renderer {
  private app: PIXI.Application;
  private court: PIXI.Container;
  private playersContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  private ball: PIXI.Graphics;
  private playerSprites: Map<string, PIXI.Container> = new Map();
  private courtWidth: number;
  private courtHeight: number;
  private ballInMotion: boolean = false;

  constructor(container: HTMLElement) {
    // 创建PixiJS应用
    this.app = new PIXI.Application({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0x1a472a, // 篮球场绿色
      antialias: true
    });

    container.appendChild(this.app.view as HTMLCanvasElement);

    this.courtWidth = this.app.screen.width;
    this.courtHeight = this.app.screen.height;

    // 创建容器
    this.court = new PIXI.Container();
    this.playersContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.ball = new PIXI.Graphics();

    // 添加到舞台(分层)
    this.app.stage.addChild(this.court);
    this.app.stage.addChild(this.effectsContainer);
    this.app.stage.addChild(this.playersContainer);
    this.app.stage.addChild(this.ball);

    // 绘制球场
    this.drawCourt();
    
    // 绘制篮球(初始在中场)
    this.drawBall({ x: this.courtWidth / 2, y: this.courtHeight / 2 });
  }

  /**
   * 绘制篮球场 - 简化版本
   */
  private drawCourt(): void {
    const graphics = new PIXI.Graphics();
    const padding = 50;
    const courtWidth = this.courtWidth - padding * 2;
    const courtHeight = this.courtHeight - padding * 2;
    const centerX = this.courtWidth / 2;
    const centerY = this.courtHeight / 2;
    const leftBaseline = padding;
    const rightBaseline = this.courtWidth - padding;

    // 1. 球场底色 (橙棕色)
    graphics.beginFill(0xCD853F, 1);
    graphics.drawRect(padding, padding, courtWidth, courtHeight);
    graphics.endFill();

    // 2. 外边框 (白色)
    graphics.lineStyle(4, 0xFFFFFF, 1);
    graphics.drawRect(padding, padding, courtWidth, courtHeight);

    // 3. 中线
    graphics.lineStyle(3, 0xFFFFFF, 1);
    graphics.moveTo(centerX, padding);
    graphics.lineTo(centerX, this.courtHeight - padding);

    // 4. 中圈
    graphics.lineStyle(3, 0xFFFFFF, 1);
    graphics.drawCircle(centerX, centerY, 70);

    // 5. 禁区 (三秒区)
    const keyWidth = 160;
    const keyHeight = 200;
    
    // 左侧禁区 (橙红色填充)
    graphics.lineStyle(3, 0xFFFFFF, 1);
    graphics.beginFill(0xE67E50, 1);
    graphics.drawRect(leftBaseline, centerY - keyHeight / 2, keyWidth, keyHeight);
    graphics.endFill();
    
    // 右侧禁区 (橙红色填充)
    graphics.beginFill(0xE67E50, 1);
    graphics.drawRect(rightBaseline - keyWidth, centerY - keyHeight / 2, keyWidth, keyHeight);
    graphics.endFill();

    // 6. 罚球圈
    graphics.lineStyle(3, 0xFFFFFF, 1);
    graphics.drawCircle(leftBaseline + keyWidth, centerY, 60);
    graphics.drawCircle(rightBaseline - keyWidth, centerY, 60);

    // 7. 篮筐
    const hoopRadius = 15;
    const hoopDistance = 40;
    
    // 左侧篮筐
    graphics.lineStyle(6, 0xFF0000, 1);
    graphics.drawCircle(leftBaseline + hoopDistance, centerY, hoopRadius);
    
    // 右侧篮筐
    graphics.drawCircle(rightBaseline - hoopDistance, centerY, hoopRadius);

    // 8. 篮板 (红色)
    graphics.lineStyle(5, 0xFF0000, 1);
    graphics.moveTo(leftBaseline + 15, centerY - 30);
    graphics.lineTo(leftBaseline + 15, centerY + 30);
    graphics.moveTo(rightBaseline - 15, centerY - 30);
    graphics.lineTo(rightBaseline - 15, centerY + 30);

    this.court.addChild(graphics);
  }

  /**
   * 绘制篮球
   */
  private drawBall(position: { x: number; y: number }): void {
    this.ball.clear();
    this.ball.beginFill(0xFFA500);
    this.ball.drawCircle(0, 0, 8);
    this.ball.endFill();
    
    // 添加篮球纹理线条
    this.ball.lineStyle(1, 0x000000, 0.5);
    this.ball.moveTo(-8, 0);
    this.ball.lineTo(8, 0);
    this.ball.moveTo(0, -8);
    this.ball.lineTo(0, 8);

    this.ball.position.set(position.x, position.y);
  }

  /**
   * 绘制所有球员 - 标准5v5阵型
   */
  drawPlayers(homePlayers: Player[], awayPlayers: Player[]): void {
    // 清空现有球员
    this.playersContainer.removeChildren();
    this.playerSprites.clear();

    const padding = 50; // 与球场padding一致
    const courtCenterY = this.courtHeight / 2;

    // 主队站位 (左半场) - 标准1-2-2阵型
    const homePositions = [
      { x: padding + 100, y: courtCenterY },           // 1号 控球后卫 (中)
      { x: padding + 180, y: courtCenterY - 120 },    // 2号 得分后卫 (上)
      { x: padding + 180, y: courtCenterY + 120 },    // 3号 小前锋 (下)
      { x: padding + 260, y: courtCenterY - 50 },     // 4号 大前锋 (上中) - 向中间靠拢
      { x: padding + 260, y: courtCenterY + 50 }      // 5号 中锋 (下中) - 向中间靠拢
    ];

    // 客队站位 (右半场) - 镜像阵型
    const awayPositions = [
      { x: this.courtWidth - padding - 100, y: courtCenterY },           // 1号
      { x: this.courtWidth - padding - 180, y: courtCenterY - 120 },    // 2号
      { x: this.courtWidth - padding - 180, y: courtCenterY + 120 },    // 3号
      { x: this.courtWidth - padding - 260, y: courtCenterY - 50 },     // 4号 - 向中间靠拢
      { x: this.courtWidth - padding - 260, y: courtCenterY + 50 }      // 5号 - 向中间靠拢
    ];

    // 绘制主队球员（红色）
    homePlayers.slice(0, 5).forEach((player, index) => {
      const pos = homePositions[index];
      player.position = pos;
      const sprite = this.createPlayerSprite(player, 0xFF6B6B, player.number);
      sprite.position.set(pos.x, pos.y);
      this.playerSprites.set(player.name, sprite);
      this.playersContainer.addChild(sprite);
    });

    // 绘制客队球员（蓝色）
    awayPlayers.slice(0, 5).forEach((player, index) => {
      const pos = awayPositions[index];
      player.position = pos;
      const sprite = this.createPlayerSprite(player, 0x4ECDC4, player.number);
      sprite.position.set(pos.x, pos.y);
      this.playerSprites.set(player.name, sprite);
      this.playersContainer.addChild(sprite);
    });

    console.log(`✅ 场上球员: 主队${Math.min(homePlayers.length, 5)}人, 客队${Math.min(awayPlayers.length, 5)}人`);
  }

  /**
   * 更新球员位置(添加移动动画)
   */
  updatePlayerPosition(playerId: string, targetX: number, targetY: number, duration: number = 500): void {
    const sprite = this.playerSprites.get(playerId);
    if (!sprite) return;

    const startX = sprite.position.x;
    const startY = sprite.position.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      sprite.position.x = startX + (targetX - startX) * progress;
      sprite.position.y = startY + (targetY - startY) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * 重置篮球到中心位置
   */
  private resetBallToCenter(): void {
    const centerX = this.courtWidth / 2;
    const centerY = this.courtHeight / 2;
    this.ball.position.set(centerX, centerY);
  }

  /**
   * 创建球员精灵
   */
  private createPlayerSprite(player: Player, color: number, number: string): PIXI.Container {
    const container = new PIXI.Container();

    // 球员圆圈
    const circle = new PIXI.Graphics();
    circle.beginFill(color);
    circle.drawCircle(0, 0, 20);
    circle.endFill();
    circle.lineStyle(2, 0xFFFFFF, 1);
    circle.drawCircle(0, 0, 20);

    // 球员号码
    const text = new PIXI.Text(number, {
      fontSize: 18,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    });
    text.anchor.set(0.5);

    container.addChild(circle);
    container.addChild(text);
    container.position.set(player.position.x, player.position.y);

    return container;
  }

  /**
   * 播放事件动画
   */
  async playAnimation(event: GameEvent): Promise<void> {
    if (this.ballInMotion) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (event instanceof ShotEvent) {
      await this.playShotAnimation(event);
    } else if (event instanceof ReboundEvent) {
      await this.playReboundAnimation(event);
    } else if (event instanceof FoulEvent) {
      await this.playFoulAnimation(event);
    } else if (event instanceof BlockEvent) {
      await this.playBlockAnimation(event);
    } else if (event instanceof StealEvent) {
      await this.playStealAnimation(event);
    } else if (event instanceof SubstitutionEvent) {
      await this.playSubstitutionAnimation(event);
    } else if (event instanceof TurnoverEvent) {
      await this.playTurnoverAnimation(event);
    }
    
    // 每个事件动画结束后,篮球回到中心
    this.resetBallToCenter();
  }

  /**
   * 播放投篮动画
   */
  private async playShotAnimation(event: ShotEvent): Promise<void> {
    this.ballInMotion = true;
    
    // 找到投篮球员的sprite
    const playerSprite = this.playerSprites.get(event.playerName) || 
                         Array.from(this.playerSprites.values())[0];
    
    if (!playerSprite) {
      this.ballInMotion = false;
      return;
    }

    const startX = playerSprite.position.x;
    const startY = playerSprite.position.y;
    
    // 判断投向哪个篮筐
    const isHomeTeam = event.teamName === '洛杉矶湖人';
    const padding = 50;
    const hoopDistance = 40;
    const targetX = isHomeTeam ? this.courtWidth - padding - hoopDistance : padding + hoopDistance;
    const targetY = this.courtHeight / 2;

    // 球员向前移动一点
    const playerMoveX = isHomeTeam ? startX + 40 : startX - 40;
    this.updatePlayerPosition(event.playerName, playerMoveX, startY, 300);

    await new Promise(resolve => setTimeout(resolve, 200));

    // 投篮动画
    const duration = 600;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 贝塞尔曲线轨迹
        const x = startX + (targetX - startX) * progress;
        const peakHeight = 150;
        const arc = Math.sin(progress * Math.PI) * peakHeight;
        const y = startY + (targetY - startY) * progress - arc;

        // 旋转效果
        this.ball.rotation = progress * Math.PI * 4;
        this.ball.position.set(x, y);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 命中效果
          if (event.isMade) {
            this.showMadeEffect(targetX, targetY, event.points);
            this.ball.position.set(targetX, targetY + 20);
          } else {
            this.showMissEffect(targetX, targetY);
            // 球弹开
            this.ball.position.set(targetX + (Math.random() - 0.5) * 50, targetY + 30);
          }
          
          // 球员退回原位
          setTimeout(() => {
            this.updatePlayerPosition(event.playerName, startX, startY, 300);
          }, 200);
          
          this.ballInMotion = false;
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * 播放篮板动画
   */
  private async playReboundAnimation(event: ReboundEvent): Promise<void> {
    const text = new PIXI.Text(`🏀 ${event.playerName} 抢到篮板!`, {
      fontSize: 28,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4
    });
    
    text.anchor.set(0.5);
    text.position.set(this.courtWidth / 2, 120);
    this.effectsContainer.addChild(text);

    // 球员跳起抢篮板
    const sprite = this.playerSprites.get(event.playerName);
    if (sprite) {
      const originalY = sprite.y;
      const jumpHeight = 50;
      const duration = 500;
      const startTime = Date.now();
      
      const jumpAnimate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 0.4) {
          // 快速上升
          sprite.y = originalY - jumpHeight * (progress / 0.4);
        } else if (progress < 1) {
          // 缓慢下降
          sprite.y = originalY - jumpHeight * (1 - (progress - 0.4) / 0.6);
        } else {
          sprite.y = originalY;
          return;
        }
        
        if (progress < 1) {
          requestAnimationFrame(jumpAnimate);
        }
      };
      jumpAnimate();
    }

    // 文字弹跳动画
    let bounce = 0;
    const animate = () => {
      bounce += 0.3;
      text.y = 120 + Math.abs(Math.sin(bounce)) * 20;
      if (bounce < Math.PI * 2) {
        requestAnimationFrame(animate);
      } else {
        this.effectsContainer.removeChild(text);
      }
    };
    animate();

    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  /**
   * 播放犯规动画
   */
  private async playFoulAnimation(event: FoulEvent): Promise<void> {
    const text = new PIXI.Text(`⚠️ 犯规: ${event.playerName}`, {
      fontSize: 32,
      fill: 0xFF0000,
      fontWeight: 'bold',
      stroke: 0xFFFFFF,
      strokeThickness: 4
    });
    
    text.anchor.set(0.5);
    text.position.set(this.courtWidth / 2, this.courtHeight / 2);
    this.effectsContainer.addChild(text);

    // 让犯规球员闪烁
    const sprite = this.playerSprites.get(event.playerName);
    if (sprite) {
      let blinks = 0;
      const blinkInterval = setInterval(() => {
        sprite.visible = !sprite.visible;
        blinks++;
        if (blinks >= 8) { // 闪烁4次
          clearInterval(blinkInterval);
          sprite.visible = true;
        }
      }, 150);
    }

    // 震动文字效果
    let shake = 0;
    const animate = () => {
      shake += 0.5;
      text.x = this.courtWidth / 2 + Math.sin(shake) * 10;
      if (shake < Math.PI * 4) {
        requestAnimationFrame(animate);
      } else {
        this.effectsContainer.removeChild(text);
      }
    };
    animate();

    return new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
  }

  /**
   * 播放盖帽动画
   */
  private async playBlockAnimation(event: BlockEvent): Promise<void> {
    const text = new PIXI.Text(`🚫 ${event.playerName} 盖帽!`, {
      fontSize: 36,
      fill: 0xFFA500,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 5
    });
    
    text.anchor.set(0.5);
    text.position.set(this.courtWidth / 2, this.courtHeight / 2 - 80);
    text.scale.set(0.5);
    this.effectsContainer.addChild(text);

    // 找到盖帽球员,让他跳起来
    const sprite = this.playerSprites.get(event.playerName);
    if (sprite) {
      const originalY = sprite.y;
      const jumpHeight = 40;
      const duration = 400;
      const startTime = Date.now();
      
      const jumpAnimate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 0.5) {
          // 上升
          sprite.y = originalY - jumpHeight * (progress * 2);
        } else if (progress < 1) {
          // 下降
          sprite.y = originalY - jumpHeight * (2 - progress * 2);
        } else {
          sprite.y = originalY;
          return;
        }
        
        if (progress < 1) {
          requestAnimationFrame(jumpAnimate);
        }
      };
      jumpAnimate();
    }

    // 文字放大动画
    let scale = 0.5;
    const animate = () => {
      scale += 0.05;
      text.scale.set(scale);
      text.alpha = 1.5 - scale;
      if (scale < 1.5) {
        requestAnimationFrame(animate);
      } else {
        this.effectsContainer.removeChild(text);
      }
    };
    animate();

    return new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
  }

  /**
   * 播放抢断动画
   */
  private async playStealAnimation(event: StealEvent): Promise<void> {
    const text = new PIXI.Text(`⚡ ${event.playerName} 抢断!`, {
      fontSize: 30,
      fill: 0x00FF00,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4
    });
    
    text.anchor.set(0.5);
    text.position.set(this.courtWidth / 2, 180);
    this.effectsContainer.addChild(text);

    // 找到抢断球员
    const sprite = this.playerSprites.get(event.playerName);
    if (sprite) {
      const originalX = sprite.x;
      const originalY = sprite.y;
      
      // 判断是主队还是客队,冲向对方半场
      const isHomeTeam = originalX < this.courtWidth / 2;
      const targetX = isHomeTeam ? this.courtWidth * 0.65 : this.courtWidth * 0.35;
      const targetY = originalY;
      
      // 冲向对方 (300ms)
      const rushDuration = 300;
      const rushStart = Date.now();
      const rushAnimate = () => {
        const elapsed = Date.now() - rushStart;
        const progress = Math.min(elapsed / rushDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOut
        
        sprite.x = originalX + (targetX - originalX) * easeProgress;
        sprite.y = originalY + (targetY - originalY) * easeProgress;
        
        if (progress < 1) {
          requestAnimationFrame(rushAnimate);
        } else {
          // 返回原位 (300ms)
          const returnStart = Date.now();
          const returnAnimate = () => {
            const elapsed = Date.now() - returnStart;
            const progress = Math.min(elapsed / rushDuration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            sprite.x = targetX + (originalX - targetX) * easeProgress;
            sprite.y = targetY + (originalY - targetY) * easeProgress;
            
            if (progress < 1) {
              requestAnimationFrame(returnAnimate);
            }
          };
          returnAnimate();
        }
      };
      rushAnimate();
    }

    // 文字闪烁效果
    let blink = 0;
    const animate = () => {
      blink += 0.3;
      text.alpha = Math.abs(Math.sin(blink));
      if (blink < Math.PI * 3) {
        requestAnimationFrame(animate);
      } else {
        this.effectsContainer.removeChild(text);
      }
    };
    animate();

    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  /**
   * 播放换人动画
   */
  private async playSubstitutionAnimation(event: SubstitutionEvent): Promise<void> {
    const text = new PIXI.Text(`🔄 换人: ${event.playerOut} ➜ ${event.playerIn}`, {
      fontSize: 24,
      fill: 0xFFD700,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    
    text.anchor.set(0.5);
    text.position.set(this.courtWidth / 2, this.courtHeight - 80);
    this.effectsContainer.addChild(text);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.effectsContainer.removeChild(text);
        resolve();
      }, 1500);
    });
  }

  /**
   * 播放失误动画
   */
  private async playTurnoverAnimation(event: TurnoverEvent): Promise<void> {
    const text = new PIXI.Text(`❌ 失误: ${event.playerName}`, {
      fontSize: 26,
      fill: 0xFF6B6B,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    
    text.anchor.set(0.5);
    text.position.set(this.courtWidth / 2, 140);
    this.effectsContainer.addChild(text);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.effectsContainer.removeChild(text);
        resolve();
      }, 900);
    });
  }

  /**
   * 显示命中效果
   */
  private showMadeEffect(x: number, y: number, points: number): void {
    const text = new PIXI.Text(`+${points}`, {
      fontSize: 36,
      fill: 0x00FF00,
      fontWeight: 'bold',
      stroke: 0xFFFFFF,
      strokeThickness: 3
    });
    
    text.anchor.set(0.5);
    text.position.set(x, y - 40);
    this.effectsContainer.addChild(text);

    // 淡出动画
    let alpha = 1;
    const fadeOut = () => {
      alpha -= 0.05;
      text.alpha = alpha;
      text.y -= 2;
      
      if (alpha > 0) {
        requestAnimationFrame(fadeOut);
      } else {
        this.effectsContainer.removeChild(text);
      }
    };
    
    setTimeout(() => fadeOut(), 300);
  }

  /**
   * 显示未命中效果
   */
  private showMissEffect(x: number, y: number): void {
    const text = new PIXI.Text('未中', {
      fontSize: 24,
      fill: 0xFF0000,
      fontWeight: 'bold'
    });
    
    text.anchor.set(0.5);
    text.position.set(x, y - 40);
    this.effectsContainer.addChild(text);

    setTimeout(() => {
      this.effectsContainer.removeChild(text);
    }, 600);
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.app.destroy(true);
  }
}
