import { onBeforeUnmount, ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import { createContainer } from '@/app/container';
import type { MatchEngine } from '@/application/match-engine';
import type { MatchSnapshot } from '@/application/read-models';
import type { RawMatch } from '@/application/ports';
import type { Match } from '@/domain/game/match';
import type { GameEvent } from '@/domain/events';

export interface MatchSession {
  readonly snapshot: ShallowRef<MatchSnapshot | null>;
  readonly match: ShallowRef<Match | null>;
  readonly currentEvent: ShallowRef<GameEvent | null>;
  readonly loading: Ref<boolean>;
  readonly engine: MatchEngine;
  loadFromUrl(url: string): Promise<void>;
  loadFromFile(file: File): Promise<void>;
}

/**
 * 界面与播放器之间的唯一粘合层。
 *
 * 组件只订阅快照，不碰引擎内部状态；引擎也不认识 Vue。
 */
export function useMatchSession(): MatchSession {
  const container = createContainer();
  const engine = container.createEngine();

  const snapshot = shallowRef<MatchSnapshot | null>(null);
  const match = shallowRef<Match | null>(null);
  const currentEvent = shallowRef<GameEvent | null>(null);
  const loading = ref(false);

  const offChanged = engine.notifications.on('changed', (next) => {
    snapshot.value = next;
  });
  const offApplied = engine.notifications.on('applied', ({ event }) => {
    currentEvent.value = event;
  });

  async function load(fetchRaw: () => Promise<RawMatch>): Promise<void> {
    loading.value = true;
    try {
      const raw = await fetchRaw();
      const assembled = container.assembler.assemble(raw);
      match.value = assembled;
      currentEvent.value = null;
      engine.load(assembled);
    } finally {
      loading.value = false;
    }
  }

  onBeforeUnmount(() => {
    offChanged();
    offApplied();
    engine.destroy();
  });

  return {
    snapshot,
    match,
    currentEvent,
    loading,
    engine,
    loadFromUrl: (url) => load(() => container.matchSource.loadFromUrl(url)),
    loadFromFile: (file) => load(() => container.matchSource.loadFromFile(file))
  };
}
