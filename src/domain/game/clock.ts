const PERIOD_MINUTES = 12;

/**
 * 比赛时钟：不可变值对象。
 *
 * 事件携带自己的时钟，回放时"时钟 = 最后一个已应用事件的时钟"，
 * 不需要一个到处被 setTime / setQuarter 的全局计时器。
 */
export class GameClock {
  constructor(
    readonly quarter: number,
    readonly minutes: number,
    readonly seconds: number
  ) {}

  static periodStart(quarter = 1): GameClock {
    return new GameClock(quarter, PERIOD_MINUTES, 0);
  }

  /** 接受 "MM:SS" / "HH:MM:SS"；解析不出来就退回本节开局。 */
  static parse(label: string, quarter: number): GameClock {
    const parts = label.trim().split(':');
    if (parts.length < 2) return GameClock.periodStart(quarter);

    const minutes = Number(parts[parts.length - 2]);
    const seconds = Number(parts[parts.length - 1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return GameClock.periodStart(quarter);

    return new GameClock(quarter, minutes, seconds);
  }

  get label(): string {
    return `${String(this.minutes).padStart(2, '0')}:${String(this.seconds).padStart(2, '0')}`;
  }
}
