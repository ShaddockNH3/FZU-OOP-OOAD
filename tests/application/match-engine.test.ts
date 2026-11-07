import { describe, expect, it } from 'vitest';
import { MatchAssembler } from '@/application/match-assembler';
import { MatchEngine } from '@/application/match-engine';
import type { Scheduler } from '@/application/ports';
import type { MatchSnapshot } from '@/application/read-models';
import { tinyRawMatch } from '../fixtures/tiny-match';

/** 手动推进的假计时器：单测里不必真等一秒。 */
class ManualScheduler implements Scheduler {
  private queue: Array<() => void> = [];

  after(_delayMs: number, task: () => void): () => void {
    this.queue.push(task);
    return () => {
      this.queue = this.queue.filter((queued) => queued !== task);
    };
  }

  get pending(): number {
    return this.queue.length;
  }

  tick(): void {
    const task = this.queue.shift();
    task?.();
  }
}

const match = new MatchAssembler().assemble(tinyRawMatch());

function setup(): { scheduler: ManualScheduler; engine: MatchEngine; snapshots: MatchSnapshot[] } {
  const scheduler = new ManualScheduler();
  const engine = new MatchEngine(scheduler);
  const snapshots: MatchSnapshot[] = [];
  engine.notifications.on('changed', (snapshot) => snapshots.push(snapshot));
  engine.load(match);
  return { scheduler, engine, snapshots };
}

describe('MatchEngine', () => {
  it('加载后停在开头', () => {
    const { engine } = setup();
    const snapshot = engine.snapshot();
    expect(snapshot?.progress.index).toBe(0);
    expect(snapshot?.progress.total).toBe(match.total);
    expect(snapshot?.home.score).toBe(0);
  });

  it('下一步应用一条事件，比分跟着动', () => {
    const { engine } = setup();
    engine.seek(1);
    engine.next();
    expect(engine.index).toBe(2);
    expect(engine.snapshot()?.home.score).toBe(3);
  });

  it('播放按节拍推进，暂停后不再走', () => {
    const { engine, scheduler } = setup();
    engine.play();
    expect(scheduler.pending).toBe(1);

    scheduler.tick();
    expect(engine.index).toBe(1);

    engine.pause();
    expect(scheduler.pending).toBe(0);
    expect(engine.playing).toBe(false);
  });

  it('跳到末尾等于整场重放，比分是最终比分', () => {
    const { engine } = setup();
    engine.seek(match.total);
    expect(engine.snapshot()?.home.score).toBe(3);
    expect(engine.snapshot()?.away.score).toBe(3);
    expect(engine.snapshot()?.finished).toBe(true);
  });

  it('回退会回滚统计，不是只挪游标', () => {
    const { engine } = setup();
    engine.seek(match.total);
    const edwards = () => engine.snapshot()?.away.players.find((player) => player.name === '爱德华兹');
    expect(edwards()?.points).toBe(3);

    engine.previous();
    expect(engine.index).toBe(match.total - 1);
    expect(edwards()?.points).toBe(2);
  });

  it('播完发出 ended，再点播放从头上演', () => {
    const { engine, scheduler } = setup();
    let ended = 0;
    engine.notifications.on('ended', () => {
      ended += 1;
    });

    engine.seek(match.total - 1);
    engine.play();
    scheduler.tick();

    expect(ended).toBe(1);
    expect(engine.playing).toBe(false);

    engine.play();
    expect(engine.index).toBe(0);
    expect(engine.playing).toBe(true);
  });

  it('速度只接受预设档位', () => {
    const { engine } = setup();
    engine.setSpeed(2);
    expect(engine.speed).toBe(2);
    engine.setSpeed(3);
    expect(engine.speed).toBe(2);
  });

  it('seek 越界会被夹住', () => {
    const { engine } = setup();
    engine.seek(-5);
    expect(engine.index).toBe(0);
    engine.seek(9999);
    expect(engine.index).toBe(match.total);
  });
});
