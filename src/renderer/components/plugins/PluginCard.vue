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
        v-if="!isInstalled"
        variant="primary"
        :loading="installing"
        @click="$emit('install', plugin)"
      >
        {{ t('settings.plugins.install') }}
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

import type { PluginStoreItem } from '@/types/plugin';
import SBtn from '@/views/set/SBtn.vue';

const props = defineProps<{
  plugin: PluginStoreItem;
  isInstalled: boolean;
  installing: boolean;
}>();

defineEmits<{
  install: [plugin: PluginStoreItem];
}>();

const { t } = useI18n();

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
