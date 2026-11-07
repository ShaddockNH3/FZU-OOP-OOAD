<script setup lang="ts">
import { SPEEDS } from '@/application/match-engine';
import {
  PhArrowCounterClockwise,
  PhPause,
  PhPlay,
  PhSkipBack,
  PhSkipForward
} from '@phosphor-icons/vue';
import { NButton, NRadioButton, NRadioGroup, NSlider } from 'naive-ui';

const props = defineProps<{
  index: number;
  total: number;
  playing: boolean;
  speed: number;
}>();

const emit = defineEmits<{
  play: [];
  pause: [];
  prev: [];
  next: [];
  reset: [];
  seek: [index: number];
  speed: [value: number];
}>();
</script>

<template>
  <div class="bar">
    <div class="transport">
      <n-button quaternary circle title="上一步" @click="emit('prev')">
        <template #icon><ph-skip-back :size="18" /></template>
      </n-button>

      <n-button v-if="!props.playing" type="primary" circle title="播放" @click="emit('play')">
        <template #icon><ph-play :size="18" weight="fill" /></template>
      </n-button>
      <n-button v-else type="primary" circle title="暂停" @click="emit('pause')">
        <template #icon><ph-pause :size="18" weight="fill" /></template>
      </n-button>

      <n-button quaternary circle title="下一步" @click="emit('next')">
        <template #icon><ph-skip-forward :size="18" /></template>
      </n-button>

      <n-button quaternary circle title="重置" @click="emit('reset')">
        <template #icon><ph-arrow-counter-clockwise :size="18" /></template>
      </n-button>
    </div>

    <div class="progress">
      <n-slider
        :min="0"
        :max="Math.max(props.total, 1)"
        :value="props.index"
        :step="1"
        :tooltip="false"
        @update:value="(value: number) => emit('seek', value)"
      />
      <span class="counter">{{ props.index }} / {{ props.total }}</span>
    </div>

    <n-radio-group
      :value="props.speed"
      size="small"
      @update:value="(value: number) => emit('speed', value)"
    >
      <n-radio-button v-for="item in SPEEDS" :key="item" :value="item">{{ item }}x</n-radio-button>
    </n-radio-group>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.transport {
  display: flex;
  align-items: center;
  gap: 4px;
}

.progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 260px;
  min-width: 200px;
}

.counter {
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
  font-size: 13px;
  white-space: nowrap;
}
</style>
