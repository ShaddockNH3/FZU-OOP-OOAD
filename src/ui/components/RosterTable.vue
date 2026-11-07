<script setup lang="ts">
import type { PlayerRow } from '@/application/read-models';
import { NDataTable, type DataTableColumns } from 'naive-ui';
import { computed, h } from 'vue';

const props = defineProps<{ players: PlayerRow[] }>();

const columns: DataTableColumns<PlayerRow> = [
  { title: '号', key: 'number', width: 42, align: 'center' },
  {
    title: '球员',
    key: 'name',
    minWidth: 96,
    render: (row) =>
      h('span', { class: row.onCourt ? 'name starter' : 'name' }, row.onCourt ? row.name : `${row.name} · 替`)
  },
  { title: '得分', key: 'points', width: 56, align: 'center' },
  { title: '投篮', key: 'fieldGoals', width: 62, align: 'center' },
  { title: '三分', key: 'threePointers', width: 62, align: 'center' },
  { title: '罚球', key: 'freeThrows', width: 62, align: 'center' },
  { title: '篮板', key: 'rebounds', width: 56, align: 'center' },
  { title: '助攻', key: 'assists', width: 56, align: 'center' }
];

const data = computed(() => props.players);
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :bordered="false"
    :single-line="false"
    size="small"
    :row-key="(row: PlayerRow) => row.id"
    :max-height="300"
  />
</template>

<style scoped>
:deep(.name) {
  color: #8b97ab;
}

:deep(.name.starter) {
  color: #1c2434;
  font-weight: 600;
}
</style>
