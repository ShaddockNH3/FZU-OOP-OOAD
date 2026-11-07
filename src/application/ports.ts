import type { GameEvent } from '@/domain/events';

/** 一行原始数据：一节里的一行，可能只有主队动作，也可能两边都有。 */
export interface RawMatchRow {
  readonly quarter: number;
  readonly time: string;
  readonly homeAction: string;
  readonly score: string;
  readonly awayAction: string;
}

/** 从文件里读出来的原始比赛：队名 + 行数据，还没变成事件。 */
export interface RawMatch {
  readonly title: string;
  readonly homeName: string;
  readonly awayName: string;
  readonly rows: readonly RawMatchRow[];
}

/** 比赛数据来源。文件、URL、将来的接口实现都走这个口子。 */
export interface MatchSource {
  loadFromUrl(url: string): Promise<RawMatch>;
  loadFromFile(file: File): Promise<RawMatch>;
}

/**
 * 播放节拍器。
 *
 * 抽出这层是为了让播放器可测：单测里塞一个手动推进的假计时器，
 * 不用真的等一秒。
 */
export interface Scheduler {
  after(delayMs: number, task: () => void): () => void;
}

/** 球场渲染端口。实现方是 Pixi，应用层不认识 Pixi。 */
export interface CourtRenderer {
  renderEvent(event: GameEvent): void;
  cancel(): void;
  destroy(): void;
}
