import type { Match } from '@/domain/game/match';
import type { MatchState } from '@/domain/game/match-state';
import type { GameEvent } from '@/domain/events';
import { Emitter } from './emitter';
import type { Scheduler } from './ports';
import { buildSnapshot, type MatchSnapshot } from './read-models';

export interface EngineEvents {
  /** 状态有变，附带可以直接渲染的快照。 */
  changed: MatchSnapshot;
  /** 刚应用了一条事件，渲染层据此播动画。 */
  applied: { event: GameEvent; index: number };
  /** 播到最后一条。 */
  ended: void;
}

const BASE_STEP_MS = 1000;
const SPEEDS = [0.5, 1, 2, 4] as const;

export type PlaybackSpeed = (typeof SPEEDS)[number];

/**
 * 播放器。
 *
 * 只干三件事：维护"已应用几条事件"这个游标、按节拍往下走、把状态发给界面。
 * 动画、DOM、Pixi 都不在这里；计时器从 `Scheduler` 端口注入，单测可控。
 */
export class MatchEngine {
  readonly notifications = new Emitter<EngineEvents>();

  private match: Match | null = null;
  private state: MatchState | null = null;
  private cursor = 0;
  private speedValue: PlaybackSpeed = 1;
  private playingValue = false;
  private lastEvent: GameEvent | null = null;
  private cancelTimer: (() => void) | null = null;

  constructor(private readonly scheduler: Scheduler) {}

  get isLoaded(): boolean {
    return this.match !== null;
  }

  get speed(): PlaybackSpeed {
    return this.speedValue;
  }

  get playing(): boolean {
    return this.playingValue;
  }

  get total(): number {
    return this.match?.total ?? 0;
  }

  get index(): number {
    return this.cursor;
  }

  load(match: Match): void {
    this.pause();
    this.match = match;
    this.cursor = 0;
    this.lastEvent = null;
    this.state = match.initialState();
    this.emitChanged();
  }

  snapshot(): MatchSnapshot | null {
    if (!this.match || !this.state) return null;
    return buildSnapshot(
      this.match,
      this.state,
      { index: this.cursor, total: this.match.total },
      { playing: this.playingValue, speed: this.speedValue },
      this.lastEvent
    );
  }

  play(): void {
    if (!this.match) return;
    if (this.cursor >= this.match.total) this.rewind();
    if (this.playingValue) return;
    this.playingValue = true;
    this.emitChanged();
    this.schedule();
  }

  pause(): void {
    this.clearTimer();
    if (!this.playingValue) return;
    this.playingValue = false;
    this.emitChanged();
  }

  toggle(): void {
    if (this.playingValue) this.pause();
    else this.play();
  }

  /** 手动下一步：先暂停，避免自动播放和手动点击抢同一个节拍。 */
  next(): void {
    this.pause();
    if (!this.applyNext()) return;
    this.emitChanged();
  }

  /** 上一步：回放前一条边界，等于重放到 cursor - 1。 */
  previous(): void {
    this.pause();
    this.seek(this.cursor - 1);
  }

  seek(target: number): void {
    if (!this.match) return;
    const clamped = Math.min(Math.max(target, 0), this.match.total);
    this.state = this.match.stateAt(clamped);
    this.cursor = clamped;
    this.lastEvent = clamped > 0 ? (this.match.events[clamped - 1] ?? null) : null;
    this.emitChanged();
    if (this.playingValue) this.schedule();
  }

  reset(): void {
    this.pause();
    this.seek(0);
  }

  setSpeed(speed: number): void {
    const next = SPEEDS.find((candidate) => candidate === speed);
    if (next === undefined || next === this.speedValue) return;
    this.speedValue = next;
    this.emitChanged();
    if (this.playingValue) {
      this.clearTimer();
      this.schedule();
    }
  }

  destroy(): void {
    this.pause();
    this.notifications.clear();
    this.match = null;
    this.state = null;
  }

  private rewind(): void {
    this.seek(0);
  }

  private schedule(): void {
    if (!this.playingValue || !this.match) return;
    this.clearTimer();
    this.cancelTimer = this.scheduler.after(BASE_STEP_MS / this.speedValue, () => {
      this.cancelTimer = null;
      if (!this.playingValue) return;
      const applied = this.applyNext();
      if (!applied) {
        this.playingValue = false;
        this.emitChanged();
        this.notifications.emit('ended', undefined);
        return;
      }
      this.emitChanged();
      if (this.cursor >= this.match!.total) {
        this.playingValue = false;
        this.emitChanged();
        this.notifications.emit('ended', undefined);
        return;
      }
      this.schedule();
    });
  }

  private applyNext(): boolean {
    if (!this.match || !this.state) return false;
    const event = this.match.events[this.cursor];
    if (!event) return false;

    event.apply(this.state);
    this.state.setClock(event.clock);
    this.cursor += 1;
    this.lastEvent = event;
    this.notifications.emit('applied', { event, index: this.cursor - 1 });
    return true;
  }

  private clearTimer(): void {
    this.cancelTimer?.();
    this.cancelTimer = null;
  }

  private emitChanged(): void {
    const snapshot = this.snapshot();
    if (snapshot) this.notifications.emit('changed', snapshot);
  }
}

export { SPEEDS };
