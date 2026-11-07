<script setup lang="ts">
import { dateZhCN, NConfigProvider, NMessageProvider, zhCN } from 'naive-ui';
import AppShell from './components/AppShell.vue';
import { themeOverrides } from './theme';
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <app-shell />
    </n-message-provider>
  </n-config-provider>
</template>
