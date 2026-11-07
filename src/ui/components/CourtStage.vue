<script setup lang="ts">
import type { Match } from '@/domain/game/match';
import type { GameEvent } from '@/domain/events';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { PixiCourt } from '../court/pixi-court';
import { COURT } from '../court/geometry';

const props = defineProps<{
  match: Match | null;
  event: GameEvent | null;
}>();

const host = ref<HTMLDivElement | null>(null);
let court: PixiCourt | null = null;
let disposed = false;

onMounted(async () => {
  if (!host.value) return;
  const created = await PixiCourt.create(host.value);
  if (disposed) {
    created.destroy();
    return;
  }
  court = created;
  if (props.match) court.setRoster(props.match.home, props.match.away);
});

watch(
  () => props.match,
  (next) => {
    if (next && court) court.setRoster(next.home, next.away);
  }
);

watch(
  () => props.event,
  (next) => {
    if (next && court) court.renderEvent(next);
  }
);

onBeforeUnmount(() => {
  disposed = true;
  court?.destroy();
  court = null;
});

const ratio = `${COURT.width} / ${COURT.height}`;
</script>

<template>
  <div class="court-stage" :style="{ aspectRatio: ratio }">
    <div ref="host" class="stage-canvas" />
  </div>
</template>

<style scoped>
.court-stage {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, #fbfdff 0%, #eef3fa 100%);
  border: 1px solid var(--line);
}

.stage-canvas {
  position: absolute;
  inset: 0;
}
</style>
