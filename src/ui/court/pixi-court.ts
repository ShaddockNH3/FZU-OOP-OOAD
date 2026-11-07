import { Application, Container, Graphics, Text } from 'pixi.js';
import type { CourtRenderer } from '@/application/ports';
import type { Team, TeamSide } from '@/domain/game/team';
import {
  BlockEvent,
  FoulEvent,
  FreeThrowEvent,
  JumpBallEvent,
  PeriodEvent,
  ReboundEvent,
  ShotEvent,
  StealEvent,
  SubstitutionEvent,
  TimeoutEvent,
  TurnoverEvent,
  ViolationEvent,
  type GameEvent
} from '@/domain/events';
import { paintCourt } from './court-painter';
import { CENTER, COURT, attackingHoop, formationPosition, reboundSpot } from './geometry';
import { COURT_COLORS } from './palette';
import { animate, wait, type AnimationHandle } from './tween';

const FONT = '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif';

/**
 * 球场渲染器（Pixi 实现）。
 *
 * 事件类型到动画的分派用 `instanceof` 链：类型安全，且不用在领域事件里塞渲染知识。
 * 每次渲染先取消上一段动画 —— 4 倍速下事件间隔很短，不取消就会叠加成一团。
 */
export class PixiCourt implements CourtRenderer {
  private readonly playerLayer = new Container();
  private readonly fxLayer = new Container();
  private readonly ball = new Graphics();
  private readonly sprites = new Map<string, Container>();
  private readonly homeSpots = new Map<string, { x: number; y: number }>();
  private readonly pending = new Set<AnimationHandle>();
  private runId = 0;
  private active: AnimationHandle | null = null;

  private constructor(private readonly app: Application) {
    app.stage.addChild(paintCourt(), this.playerLayer, this.fxLayer, this.ball);
    this.drawBall();
  }

  static async create(host: HTMLElement): Promise<PixiCourt> {
    const app = new Application();
    await app.init({
      width: COURT.width,
      height: COURT.height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true
    });
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.canvas.style.display = 'block';
    host.appendChild(app.canvas);
    return new PixiCourt(app);
  }

  setRoster(home: Team, away: Team): void {
    this.cancel();
    this.playerLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.sprites.clear();
    this.homeSpots.clear();

    for (const team of [home, away]) {
      for (const player of team.onCourt) {
        const position = formationPosition(team.side, player.slot);
        const token = this.createPlayerToken(team.side, player.number, player.name);
        token.position.set(position.x, position.y);
        const key = this.keyOf(team.side, player.name);
        this.sprites.set(key, token);
        this.homeSpots.set(key, position);
        this.playerLayer.addChild(token);
      }
    }
  }

  renderEvent(event: GameEvent): void {
    this.cancel();
    const run = this.runId;
    void this.playEvent(run, event).finally(() => {
      if (run === this.runId) this.ball.position.set(CENTER.x, CENTER.y);
    });
  }

  cancel(): void {
    this.runId += 1;
    this.active?.cancel();
    this.active = null;
    this.cancelPending();
    this.clearEffects();
    this.resetSprites();
    this.ball.position.set(CENTER.x, CENTER.y);
  }

  destroy(): void {
    this.cancel();
    this.app.destroy(true, { children: true });
  }

  private async playEvent(run: number, event: GameEvent): Promise<void> {
    if (event instanceof ShotEvent) return this.playShot(run, event, attackingHoop(event.side ?? 'home'), event.points);
    if (event instanceof FreeThrowEvent) {
      const hoop = attackingHoop(event.side ?? 'home');
      const lineX = hoop.x < CENTER.x ? hoop.x + 150 : hoop.x - 150;
      return this.playShot(run, event, hoop, 1, { x: lineX, y: CENTER.y });
    }
    if (event instanceof ReboundEvent) {
      return this.playJump(run, event.side, event.playerName, '篮板', COURT_COLORS.highlight, reboundSpot(event.side ?? 'home'));
    }
    if (event instanceof BlockEvent) return this.playJump(run, event.side, event.playerName, '盖帽', COURT_COLORS.danger);
    if (event instanceof FoulEvent) return this.playFoul(run, event);
    if (event instanceof StealEvent) return this.playSteal(run, event);
    if (event instanceof TurnoverEvent) return this.playBanner(run, `失误 · ${event.reason}`, COURT_COLORS.danger);
    if (event instanceof SubstitutionEvent) {
      return this.playBanner(run, `换人 ${event.playerOut} → ${event.playerIn}`, COURT_COLORS.away);
    }
    if (event instanceof TimeoutEvent) return this.playBanner(run, `暂停 · ${event.timeoutType}`, COURT_COLORS.warning);
    if (event instanceof ViolationEvent) return this.playBanner(run, `违例 · ${event.reason}`, COURT_COLORS.warning);
    if (event instanceof PeriodEvent) return this.playPeriod(run, event);
    if (event instanceof JumpBallEvent) return this.playBanner(run, '跳球', COURT_COLORS.highlight, 700);
    return undefined;
  }

  private async playShot(
    run: number,
    event: ShotEvent | FreeThrowEvent,
    hoop: { x: number; y: number },
    points: number,
    origin?: { x: number; y: number }
  ): Promise<void> {
    const shooter = this.spriteFor(event.side, event.playerName);
    const from = origin ?? (shooter ? { x: shooter.x, y: shooter.y } : CENTER);

    const flight = animate(560, (progress) => {
      const x = from.x + (hoop.x - from.x) * progress;
      const y = from.y + (hoop.y - from.y) * progress - Math.sin(progress * Math.PI) * 170;
      this.ball.position.set(x, y);
      this.ball.rotation = progress * Math.PI * 3;
    });
    if (!(await this.track(run, flight))) return;

    if (event.made) {
      this.floatText(`+${points}`, { x: hoop.x, y: hoop.y - 40 }, COURT_COLORS.success);
      this.playBanner(run, '命中', COURT_COLORS.success, 700);
    } else {
      this.floatText('不中', { x: hoop.x, y: hoop.y - 40 }, COURT_COLORS.danger);
      this.ball.position.set(hoop.x, hoop.y + 26);
    }

    await this.track(run, wait(420));
  }

  private async playJump(
    run: number,
    side: TeamSide | null,
    playerName: string,
    label: string,
    color: number,
    ballTo?: { x: number; y: number }
  ): Promise<void> {
    const sprite = this.spriteFor(side, playerName);
    if (sprite) {
      const originY = sprite.y;
      const jump = animate(420, (progress) => {
        sprite.y = originY - Math.sin(progress * Math.PI) * 52;
        if (ballTo) {
          this.ball.position.set(
            sprite.x + (ballTo.x - sprite.x) * progress,
            sprite.y + (ballTo.y - sprite.y) * progress
          );
        }
      });
      if (!(await this.track(run, jump))) return;
      sprite.y = originY;
      if (ballTo) this.ball.position.set(ballTo.x, ballTo.y);
    }
    this.playBanner(run, playerName ? `${label} · ${playerName}` : label, color, 800);
    await this.track(run, wait(500));
  }

  private async playFoul(run: number, event: FoulEvent): Promise<void> {
    const sprite = this.spriteFor(event.side, event.playerName);
    if (sprite) {
      const originX = sprite.x;
      const shake = animate(420, (progress) => {
        sprite.x = originX + Math.sin(progress * Math.PI * 6) * 8;
      });
      if (!(await this.track(run, shake))) return;
      sprite.x = originX;
    }
    this.playBanner(run, `犯规 · ${event.foulType} · ${event.playerName}`, COURT_COLORS.danger, 900);
    await this.track(run, wait(520));
  }

  private async playSteal(run: number, event: StealEvent): Promise<void> {
    const sprite = this.spriteFor(event.side, event.playerName);
    if (sprite) {
      const origin = { x: sprite.x, y: sprite.y };
      const target = { x: CENTER.x + (event.side === 'home' ? -70 : 70), y: CENTER.y };
      const rush = animate(320, (progress) => {
        sprite.x = origin.x + (target.x - origin.x) * progress;
        sprite.y = origin.y + (target.y - origin.y) * progress;
        this.ball.position.set(sprite.x, sprite.y - 18);
      });
      if (!(await this.track(run, rush))) return;

      const back = animate(320, (progress) => {
        sprite.x = target.x + (origin.x - target.x) * progress;
        sprite.y = target.y + (origin.y - target.y) * progress;
      });
      if (!(await this.track(run, back))) return;
    }
    this.playBanner(run, `抢断 · ${event.playerName}`, COURT_COLORS.highlight, 800);
  }

  private async playPeriod(run: number, event: PeriodEvent): Promise<void> {
    const label = event.isFullTime ? '全场结束' : `第 ${event.quarter} 节${event.phase === 'start' ? '开始' : '结束'}`;
    this.playBanner(run, label, COURT_COLORS.home, 1000);
    await this.track(run, wait(600));
  }

  private playBanner(run: number, label: string, color: number, duration = 900): void {
    if (run !== this.runId) return;

    const text = new Text({
      text: label,
      style: { fontFamily: FONT, fontSize: 26, fontWeight: '700', fill: color }
    });
    text.anchor.set(0.5);

    const panel = new Graphics();
    const width = text.width + 44;
    const height = text.height + 20;
    panel
      .roundRect(-width / 2, -height / 2, width, height, height / 2)
      .fill({ color: 0xffffff, alpha: 0.94 })
      .stroke({ color, width: 2, alpha: 0.9 });

    const banner = new Container();
    banner.addChild(panel, text);
    banner.position.set(CENTER.x, COURT.padding + 52);
    banner.alpha = 0;
    this.fxLayer.addChild(banner);

    const enter = animate(200, (progress) => {
      banner.alpha = progress;
      banner.scale.set(0.9 + progress * 0.1);
    }, (progress) => progress);
    this.spawn(enter);

    void enter.done.then(async () => {
      if (run !== this.runId) return;
      const hold = wait(duration);
      this.spawn(hold);
      await hold.done;
      if (run !== this.runId) return;
      const fade = animate(220, (progress) => {
        banner.alpha = 1 - progress;
      });
      this.spawn(fade);
      await fade.done;
      if (!banner.destroyed) banner.destroy({ children: true });
    });
  }

  private floatText(label: string, at: { x: number; y: number }, color: number): void {
    const text = new Text({
      text: label,
      style: {
        fontFamily: FONT,
        fontSize: 30,
        fontWeight: '700',
        fill: color,
        stroke: { color: 0xffffff, width: 5 }
      }
    });
    text.anchor.set(0.5);
    text.position.set(at.x, at.y);
    this.fxLayer.addChild(text);

    const fade = animate(700, (progress) => {
      text.alpha = 1 - progress;
      text.y = at.y - progress * 46;
    });
    this.spawn(fade);
    void fade.done.then(() => {
      if (!text.destroyed) text.destroy();
    });
  }

  private createPlayerToken(side: TeamSide, number: string, name: string): Container {
    const token = new Container();

    const shadow = new Graphics();
    shadow.ellipse(0, 18, 18, 6).fill({ color: COURT_COLORS.shadow, alpha: 0.18 });

    const body = new Graphics();
    body.circle(0, 0, COURT.playerRadius).fill({ color: side === 'home' ? COURT_COLORS.home : COURT_COLORS.away });
    body.circle(0, 0, COURT.playerRadius).stroke({ color: 0xffffff, width: 2.5 });

    const jersey = new Text({
      text: number,
      style: { fontFamily: FONT, fontSize: 15, fontWeight: '700', fill: 0xffffff }
    });
    jersey.anchor.set(0.5);

    const label = new Text({
      text: name,
      style: {
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: '600',
        fill: 0x21324a,
        stroke: { color: 0xffffff, width: 4 },
        wordWrap: true,
        wordWrapWidth: 108,
        align: 'center'
      }
    });
    label.anchor.set(0.5, 0);
    label.y = COURT.playerRadius + 7;

    token.addChild(shadow, body, jersey, label);
    return token;
  }

  private drawBall(): void {
    this.ball.clear();
    this.ball.circle(0, 0, COURT.ballRadius).fill({ color: COURT_COLORS.ball });
    this.ball.circle(0, 0, COURT.ballRadius).stroke({ color: COURT_COLORS.ballSeam, width: 1.4, alpha: 0.8 });
    this.ball
      .moveTo(-COURT.ballRadius, 0)
      .lineTo(COURT.ballRadius, 0)
      .moveTo(0, -COURT.ballRadius)
      .lineTo(0, COURT.ballRadius)
      .stroke({ color: COURT_COLORS.ballSeam, width: 1.2, alpha: 0.7 });
    this.ball.position.set(CENTER.x, CENTER.y);
  }

  private clearEffects(): void {
    this.fxLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
  }

  /** 动画被打断时球员可能停在半路，取消后一律回站位。 */
  private resetSprites(): void {
    for (const [key, spot] of this.homeSpots) {
      this.sprites.get(key)?.position.set(spot.x, spot.y);
    }
  }

  /** 记下不等待结果的补间（飘字、横幅），取消时一起停，避免写已销毁的对象。 */
  private spawn(handle: AnimationHandle): void {
    this.pending.add(handle);
    void handle.done.then(() => this.pending.delete(handle));
  }

  private cancelPending(): void {
    for (const handle of [...this.pending]) handle.cancel();
    this.pending.clear();
  }

  private spriteFor(side: TeamSide | null, playerName: string): Container | undefined {
    if (!side || playerName.length === 0) return undefined;
    return this.sprites.get(this.keyOf(side, playerName));
  }

  private keyOf(side: TeamSide, playerName: string): string {
    return `${side}:${playerName}`;
  }

  /** 把补间挂到当前这一段动画上；run 过期说明已被新事件顶掉，直接取消。 */
  private async track(run: number, handle: AnimationHandle): Promise<boolean> {
    if (run !== this.runId) {
      handle.cancel();
      return false;
    }
    this.active = handle;
    return handle.done;
  }
}
