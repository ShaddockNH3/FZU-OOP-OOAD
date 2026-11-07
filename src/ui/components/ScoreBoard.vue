<script setup lang="ts">
import type { TeamSummary } from '@/application/read-models';
import { NCard, NTag } from 'naive-ui';
import { PhTimer } from '@phosphor-icons/vue';

defineProps<{
  home: TeamSummary;
  away: TeamSummary;
  clock: { quarter: number; label: string };
  playing: boolean;
}>();
</script>

<template>
  <n-card class="scoreboard" :bordered="true" content-style="padding: 18px 24px;">
    <div class="board">
      <div class="team home">
        <div class="logo">{{ home.shortName }}</div>
        <div class="meta">
          <div class="name">{{ home.name }}</div>
          <div class="side">主队</div>
        </div>
      </div>

      <div class="center">
        <div class="score">
          <span class="digit">{{ home.score }}</span>
          <span class="dash">:</span>
          <span class="digit">{{ away.score }}</span>
        </div>
        <div class="clock">
          <n-tag size="small" :bordered="false" type="primary">第 {{ clock.quarter }} 节</n-tag>
          <n-tag size="small" :bordered="false">
            <template #icon><ph-timer :size="13" /></template>
            {{ clock.label }}
          </n-tag>
          <n-tag size="small" :bordered="false" :type="playing ? 'success' : 'default'">
            {{ playing ? '播放中' : '已暂停' }}
          </n-tag>
        </div>
      </div>

      <div class="team away">
        <div class="meta right">
          <div class="name">{{ away.name }}</div>
          <div class="side">客队</div>
        </div>
        <div class="logo">{{ away.shortName }}</div>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.team {
  display: flex;
  align-items: center;
  gap: 14px;
}

.team.away {
  justify-content: flex-end;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #eef2f9;
  border: 1px solid var(--line);
  color: #1f4e9c;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.home .logo {
  border-color: #f3ccd3;
  color: #b3223a;
  background: #fdf1f3;
}

.name {
  font-size: 17px;
  font-weight: 700;
}

.meta.right {
  text-align: right;
}

.side {
  font-size: 12px;
  color: var(--ink-soft);
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.score {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  font-size: 40px;
  line-height: 1;
  color: #b07d1a;
}

.dash {
  font-size: 26px;
  color: #cbb37a;
}

.clock {
  display: flex;
  gap: 8px;
}

@media (max-width: 720px) {
  .name {
    font-size: 14px;
  }

  .score {
    font-size: 30px;
  }
}
</style>
