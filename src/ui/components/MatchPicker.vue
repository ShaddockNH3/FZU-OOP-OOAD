<script setup lang="ts">
import { PhTrophy, PhUploadSimple } from '@phosphor-icons/vue';
import { NButton, NUpload, type UploadCustomRequestOptions } from 'naive-ui';
import type { MatchPreset } from '../presets';

const props = defineProps<{
  presets: MatchPreset[];
  loading: boolean;
}>();

const emit = defineEmits<{ preset: [url: string]; file: [file: File] }>();

function handleUpload(options: UploadCustomRequestOptions): void {
  const file = options.file.file;
  if (file) emit('file', file);
  options.onFinish();
}
</script>

<template>
  <div class="picker">
    <n-button
      v-for="preset in props.presets"
      :key="preset.url"
      size="small"
      :disabled="props.loading"
      @click="emit('preset', preset.url)"
    >
      <template #icon><ph-trophy :size="15" /></template>
      {{ preset.label }}
    </n-button>

    <n-upload
      :show-file-list="false"
      :disabled="props.loading"
      accept=".xlsx,.xls"
      :custom-request="handleUpload"
    >
      <n-button size="small" type="primary" ghost :loading="props.loading">
        <template #icon><ph-upload-simple :size="15" /></template>
        自定义表格
      </n-button>
    </n-upload>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
