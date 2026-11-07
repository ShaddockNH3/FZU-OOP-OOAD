<script setup lang="ts">
import type { StatComparisonRow } from '@/application/read-models';
import { NDataTable, type DataTableColumns } from 'naive-ui';
import { computed, h } from 'vue';

const props = defineProps<{
  rows: StatComparisonRow[];
  homeName: string;
  awayName: string;
}>();

const columns = computed<DataTableColumns<StatComparisonRow>>(() => [
  {
    title: props.homeName,
    key: 'home',
    align: 'right',
    width: 88,
    render: (row) => h('span', { class: 'value home' }, row.home)
  },
  {
    title: '',
    key: 'label',
    align: 'center',
    render: (row) => h('span', { class: 'label' }, row.label)
  },
  {
    title: props.awayName,
    key: 'away',
    align: 'left',
    width: 88,
    render: (row) => h('span', { class: 'value away' }, row.away)
  }
]);
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="props.rows"
    :bordered="false"
    :single-line="false"
    size="small"
    :row-key="(row: StatComparisonRow) => row.label"
  />
</template>

<style scoped>
:deep(.label) {
  color: #5b6a83;
  font-size: 13px;
}

:deep(.value) {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

:deep(.value.home) {
  color: #d7263d;
}

:deep(.value.away) {
  color: #1f4e9c;
}
</style>
