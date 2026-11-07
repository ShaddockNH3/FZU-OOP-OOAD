<script setup lang="ts">
import type { EventView } from '@/application/read-models';
import { PhBasketball, PhLightning } from '@phosphor-icons/vue';
import { NAlert, NCard, NSkeleton, useMessage } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useMatchSession } from '../composables/use-match-session';
import { MATCH_PRESETS, type MatchPreset } from '../presets';
import CourtStage from './CourtStage.vue';
import MatchPicker from './MatchPicker.vue';
import PlaybackBar from './PlaybackBar.vue';
import RosterTable from './RosterTable.vue';
import ScoreBoard from './ScoreBoard.vue';
import TeamStatsTable from './TeamStatsTable.vue';

const session = useMatchSession();
const { snapshot, match, currentEvent, loading, engine } = session;
const message = useMessage();

const presets: MatchPreset[] = MATCH_PRESETS;

const lastEvent = computed(() => snapshot.value?.lastEvent ?? null);

onMounted(() => {
  void loadPreset(presets[0].url);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});

async function loadPreset(url: string): Promise<void> {
  try {
    await session.loadFromUrl(url);
  } catch (error) {
    message.error(`比赛数据加载失败：${describe(error)}`);
  }
}

async function loadFile(file: File): Promise<void> {
  try {
    await session.loadFromFile(file);
  } catch (error) {
    message.error(`这个表格读不了：${describe(error)}`);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 空格播放/暂停，左右方向键单步。 */
function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

  if (event.code === 'Space') {
    event.preventDefault();
    engine.toggle();
    return;
  }
  if (event.code === 'ArrowRight') {
    event.preventDefault();
    engine.next();
    return;
  }
  if (event.code === 'ArrowLeft') {
    event.preventDefault();
    engine.previous();
  }
}

function eventTone(event: EventView | null): 'default' | 'info' | 'success' | 'warning' {
  if (!event) return 'info';
  if (event.kind === 'SHOT' || event.kind === 'FREE_THROW') {
    return event.description.includes('命中') ? 'success' : 'default';
  }
  if (event.kind === 'FOUL' || event.kind === 'TURNOVER' || event.kind === 'VIOLATION') return 'warning';
  return 'info';
}
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark"><ph-basketball :size="22" weight="fill" /></div>
        <div class="brand-text">
          <h1>篮球比赛事件回放</h1>
          <p>{{ snapshot?.title ?? '等待比赛数据' }}</p>
        </div>
      </div>
      <match-picker :presets="presets" :loading="loading" @preset="loadPreset" @file="loadFile" />
    </header>

    <score-board
      v-if="snapshot"
      :home="snapshot.home"
      :away="snapshot.away"
      :clock="snapshot.clock"
      :playing="snapshot.playing"
    />
    <n-skeleton v-else height="92px" :sharp="false" />

    <main class="workbench">
      <section class="stage-column">
        <court-stage :match="match" :event="currentEvent" />

        <n-alert v-if="lastEvent" :type="eventTone(lastEvent)" :bordered="false" class="event-line">
          <span class="event-time">第 {{ lastEvent.quarter }} 节 · {{ lastEvent.time }}</span>
          <span class="event-text">{{ lastEvent.description }}</span>
        </n-alert>
        <div v-else class="event-hint">
          <ph-lightning :size="15" />
          点击播放，或按空格开始回放这场比赛的逐条事件。
        </div>

        <playback-bar
          v-if="snapshot"
          :index="snapshot.progress.index"
          :total="snapshot.progress.total"
          :playing="snapshot.playing"
          :speed="snapshot.speed"
          @play="engine.play()"
          @pause="engine.pause()"
          @prev="engine.previous()"
          @next="engine.next()"
          @reset="engine.reset()"
          @seek="(index: number) => engine.seek(index)"
          @speed="(value: number) => engine.setSpeed(value)"
        />
      </section>

      <aside class="rail">
        <template v-if="snapshot">
          <n-card title="球队数据对比" size="small">
            <team-stats-table
              :rows="snapshot.comparison"
              :home-name="snapshot.home.shortName"
              :away-name="snapshot.away.shortName"
            />
          </n-card>

          <n-card :title="`${snapshot.home.shortName} 球员数据`" size="small">
            <roster-table :players="snapshot.home.players" />
          </n-card>

          <n-card :title="`${snapshot.away.shortName} 球员数据`" size="small">
            <roster-table :players="snapshot.away.players" />
          </n-card>
        </template>
        <n-skeleton v-else height="240px" :sharp="false" />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #1f4e9c;
  color: #ffffff;
}

.brand-text h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
}

.workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(330px, 1fr);
  gap: 14px;
  align-items: start;
}

.stage-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.event-line {
  animation: pulse-in 0.25s ease-out;
}

.event-time {
  margin-right: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.8;
}

.event-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px dashed var(--line);
  color: var(--ink-soft);
  font-size: 13px;
}

@media (max-width: 1080px) {
  .workbench {
    grid-template-columns: 1fr;
  }
}
</style>
