<template>
  <component
    v-if="!isFullScreenStyle"
    :is="componentToUse"
    v-bind="$attrs"
    :key="playerStyle"
    ref="musicFullRef"
  />
  <Teleport v-else to="#layout-main">
    <component :is="componentToUse" v-bind="$attrs" :key="playerStyle" ref="musicFullRef" />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, onUnmounted, ref } from 'vue';

import MagazineMobilePlayer from '@/components/lyric/MagazineMobilePlayer.vue';
import MusicFull from '@/components/lyric/MusicFull.vue';
import MusicFullMobile from '@/components/lyric/MusicFullMobile.vue';
import { getStyle } from '@/playerStyles';
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

// 监听 localStorage 变化
function handleStorageChange(e: StorageEvent) {
  if (e.key === 'music-full-config') {
    loadConfig();
  }
}

// 自定义事件监听
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

const isFullScreenStyle = computed(() => {
  const style = getStyle(playerStyle.value);
  return style?.isFullScreen ?? false;
});

const componentToUse = computed(() => {
  const style = getStyle(playerStyle.value);
  if (style) {
    // Magazine 在移动端使用专用组件
    if (style.key === 'magazine' && isMobile.value) {
      return markRaw(MagazineMobilePlayer);
    }
    return markRaw(style.component);
  }
  return isMobile.value ? MusicFullMobile : MusicFull;
});

const musicFullRef = ref<InstanceType<typeof MusicFull>>();

defineExpose({
  musicFullRef
});
</script>
