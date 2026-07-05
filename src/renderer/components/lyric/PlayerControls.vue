<template>
  <!-- 左上角：关闭按钮 -->
  <transition name="controls-fade">
    <div v-show="visible" class="player-controls__left" :class="'theme-' + theme">
      <div class="player-controls__btn" @click="$emit('close')" :title="closeTitle">
        <i class="ri-arrow-down-s-line"></i>
      </div>
    </div>
  </transition>

  <!-- 右上角：设置 + 模式切换 + 全屏 -->
  <transition name="controls-fade">
    <div v-show="visible" class="player-controls__right" :class="'theme-' + theme">
      <n-popover trigger="click" placement="bottom-end" :z-index="99999" raw to="body">
        <template #trigger>
          <div class="player-controls__btn">
            <i class="ri-settings-3-line"></i>
          </div>
        </template>
        <lyric-settings />
      </n-popover>
      <div
        v-if="showStyleSwitch"
        class="player-controls__btn"
        @click="$emit('cycleStyle')"
        :title="styleLabel"
      >
        <i :class="styleIcon"></i>
      </div>
      <div class="player-controls__btn" @click="$emit('toggleFullscreen')">
        <i :class="isFullScreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'"></i>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import LyricSettings from './LyricSettings.vue';

interface Props {
  isFullScreen?: boolean;
  styleIcon?: string;
  styleLabel?: string;
  closeTitle?: string;
  showStyleSwitch?: boolean;
  autoHide?: boolean;
  theme?: 'light' | 'dark';
}

const props = withDefaults(defineProps<Props>(), {
  isFullScreen: false,
  styleIcon: '',
  styleLabel: '',
  closeTitle: '关闭',
  showStyleSwitch: true,
  autoHide: false,
  theme: 'light'
});

defineEmits<{
  close: [];
  cycleStyle: [];
  toggleFullscreen: [];
}>();

// 自动隐藏逻辑（仅 autoHide 模式）
const visible = ref(!props.autoHide);
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const HIDE_DELAY = 3000;

function resetHideTimer() {
  if (!props.autoHide) return;
  if (hideTimer) clearTimeout(hideTimer);
  visible.value = true;
  hideTimer = setTimeout(() => {
    visible.value = false;
  }, HIDE_DELAY);
}

function onMouseMove() {
  if (props.autoHide) {
    resetHideTimer();
  }
}

onMounted(() => {
  if (props.autoHide) {
    document.addEventListener('mousemove', onMouseMove);
    resetHideTimer();
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  if (hideTimer) clearTimeout(hideTimer);
});
</script>

<style scoped>
.player-controls__left {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 9999;
}

.player-controls__right {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  gap: 12px;
}

.player-controls__btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: background 0.2s ease;
  color: #fff;
  font-size: 20px;
}

.theme-dark .player-controls__btn {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a1a;
}

.player-controls__btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.theme-dark .player-controls__btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

/* 过渡动画 */
.controls-fade-enter-active,
.controls-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.controls-fade-enter-from,
.controls-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
