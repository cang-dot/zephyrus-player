<template>
  <div
    class="flex items-center p-4 transition-colors bg-transparent text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 hover:dark:bg-white/5"
  >
    <div
      class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-3 bg-gray-100 dark:bg-white/10 text-lg"
    >
      <i :class="iconClass"></i>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-base font-medium">{{ plugin.name }}</span>
        <span
          class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 leading-none"
          >{{ plugin.type }}</span
        >
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
        {{ plugin.description }}
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0 ml-4">
      <s-btn @click="openSource">
        <i class="ri-github-line"></i>
        {{ t('settings.plugins.repo') }}
      </s-btn>
      <s-btn
        v-if="!isInstalled && !isError"
        variant="primary"
        :loading="isActive"
        @click="$emit('install', plugin)"
      >
        {{ buttonLabel }}
      </s-btn>
      <s-btn
        v-else-if="isError"
        variant="danger"
        @click="$emit('install', plugin)"
      >
        <i class="ri-refresh-line"></i>
        {{ t('settings.plugins.retry') }}
      </s-btn>
      <s-btn v-else variant="ghost" disabled>
        <i class="ri-check-line"></i>
        {{ t('settings.plugins.installed') }}
      </s-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { InstallProgress, InstallStatus } from '@/services/pluginManager';
import type { PluginStoreItem } from '@/types/plugin';
import SBtn from '@/views/set/SBtn.vue';

const props = defineProps<{
  plugin: PluginStoreItem;
  isInstalled: boolean;
  installing: boolean;
  progress?: InstallProgress;
}>();

defineEmits<{
  install: [plugin: PluginStoreItem];
}>();

const { t } = useI18n();

const status = computed<InstallStatus>(() => props.progress?.status || 'idle');
const isActive = computed(() => status.value !== 'idle' && status.value !== 'done' && status.value !== 'error');
const isError = computed(() => status.value === 'error');

const buttonLabel = computed(() => {
  const s = status.value;
  if (s === 'preparing') return t('settings.plugins.status.preparing');
  if (s === 'requesting') return t('settings.plugins.status.requesting');
  if (s === 'downloading') {
    const pct = props.progress?.percent;
    return pct != null ? `${t('settings.plugins.status.downloading')} ${pct}%` : t('settings.plugins.status.downloading');
  }
  if (s === 'installing') return t('settings.plugins.status.installing');
  return t('settings.plugins.install');
});

const iconClass = computed(() => {
  const map: Record<string, string> = {
    lxMusic: 'ri-music-2-line',
    customApi: 'ri-link',
    playerStyle: 'ri-palette-line',
    theme: 'ri-paint-brush-line',
    translator: 'ri-translate-2'
  };
  return map[props.plugin.type] || 'ri-puzzle-line';
});

const openSource = () => {
  window.open(props.plugin.sourceRepo);
};
</script>
