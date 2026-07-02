<template>
  <component
    v-if="!isFullScreenStyle"
    :is="componentToUse"
    v-bind="$attrs"
    :key="playerStyle"
    ref="musicFullRef"
  />
  <Teleport v-else to="#layout-main">
    <component
      :is="componentToUse"
      v-bind="$attrs"
      :key="playerStyle"
      ref="musicFullRef"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import MusicFull from '@/components/lyric/MusicFull.vue';
import MusicFullMobile from '@/components/lyric/MusicFullMobile.vue';
import StagePlayer from '@/components/lyric/StagePlayer.vue';
import TypographicPlayer from '@/components/lyric/TypographicPlayer.vue';
import FrenzyPlayer from '@/components/lyric/FrenzyPlayer.vue';
import { DEFAULT_LYRIC_CONFIG } from '@/types/lyric';
import { isMobile } from '@/utils';

// 响应式配置状态
const playerStyle = ref<string>(DEFAULT_LYRIC_CONFIG.playerStyle);

// 从 localStorage 读取配置
function loadConfig() {
  const saved = localStorage.getItem('music-full-config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      playerStyle.value = parsed.playerStyle || DEFAULT_LYRIC_CONFIG.playerStyle;
    } catch {
      playerStyle.value = DEFAULT_LYRIC_CONFIG.playerStyle;
    }
  }
}

// 初始化加载
loadConfig();

// 监听 localStorage 变化（storage 事件只在其他标签页触发）
function handleStorageChange(e: StorageEvent) {
  if (e.key === 'music-full-config') {
    loadConfig();
  }
}

// 自定义事件监听（同页面内的配置变化通知）
function handleConfigUpdate() {
  loadConfig();
}

onMounted(() => {
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('music-full-config-updated', handleConfigUpdate);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('music-full-config-updated', handleConfigUpdate);
});

const isFullScreenStyle = computed(() =>
  playerStyle.value === 'frenzy'
);

const componentToUse = computed(() => {
  if (playerStyle.value === 'stage') return StagePlayer;
  if (playerStyle.value === 'magazine') return TypographicPlayer;
  if (playerStyle.value === 'frenzy') return FrenzyPlayer;
  return isMobile.value ? MusicFullMobile : MusicFull;
});

const musicFullRef = ref<InstanceType<typeof MusicFull>>();

defineExpose({
  musicFullRef
});
</script>
