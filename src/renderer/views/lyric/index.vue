<template>
  <div
    ref="containerRef"
    class="lyric-window"
    :class="[lyricSetting.theme, { locked: lyricSetting.isLock }]"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 歌词显示（三种模式） -->
    <lyric-display
      :lrc-array="staticData.lrcArray"
      :current-index="currentIndex"
      :font-size="fontSize"
      :scroll-font-size="scrollFontSize"
      :display-mode="displayMode"
      :show-translation="showTranslation"
      :wrapper-style="wrapperStyle"
      :current-group-lines="currentGroupLines"
      :get-word-style="getWordStyle"
      :get-lyric-style="getLyricStyle"
      :get-dynamic-line-style="getDynamicLineStyle"
    />

    <!-- 控制栏 -->
    <lyric-control-bar
      :show-controls="showControls"
      :is-locked="lyricSetting.isLock"
      :song-name="songName"
      :is-play="dynamicData.isPlay"
      :display-mode="displayMode"
      :show-translation="showTranslation"
      :theme="lyricSetting.theme"
      @play-pause="handlePlayPause"
      @prev="handlePrev"
      @next="handleNext"
      @skip-forward="skipForward"
      @skip-backward="skipBackward"
      @cycle-display-mode="cycleDisplayMode"
      @increase-font="increaseFontSize"
      @decrease-font="decreaseFontSize"
      @toggle-translation="toggleTranslation"
      @toggle-theme="checkTheme"
      @update:is-lock="handleLock"
      @close="handleClose"
    />

    <!-- 锁定状态悬浮提示 -->
    <div v-if="lyricSetting.isLock" class="lock-overlay" :class="{ visible: isHovering }">
      <div class="lock-hint">
        <i class="ri-lock-line"></i>
        <span>按下 {{ unlockShortcutDisplay }} 解锁</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import LyricControlBar from './components/LyricControlBar.vue';
import LyricDisplay from './components/LyricDisplay.vue';
import { useLyricControls } from './composables/useLyricControls';
import { useLyricDrag } from './composables/useLyricDrag';
import { useLyricSettings } from './composables/useLyricSettings';
import { useLyricState } from './composables/useLyricState';

defineOptions({ name: 'Lyric' });

// ── Composables ──
const { lyricSetting } = useLyricSettings();
const {
  staticData,
  dynamicData,
  currentIndex,
  fontSize,
  displayMode,
  showTranslation,
  wrapperStyle,
  currentGroupLines,
  getWordStyle,
  getLyricStyle,
  getDynamicLineStyle,
  containerRef,
  scrollFontSize,
  increaseFontSize,
  decreaseFontSize
} = useLyricState(lyricSetting);
const {
  showControls,
  isHovering,
  unlockShortcutDisplay,
  handlePlayPause,
  handlePrev,
  handleNext,
  handleLock,
  handleClose,
  handleMouseEnter,
  handleMouseLeave,
  skipForward,
  skipBackward,
  cycleDisplayMode,
  toggleTranslation,
  checkTheme
} = useLyricControls(lyricSetting);
const { handleMouseDown } = useLyricDrag(lyricSetting);

// ── 计算属性 ──
const songName = computed(() => staticData.value.playMusic?.name || '');
</script>

<style scoped>
html,
body,
#app {
  background-color: transparent !important;
}
</style>

<style lang="scss" scoped>
.lyric-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
  overflow: hidden;
  position: relative;

  // 未锁定：保持半透明黑色背景
  &:not(.locked) {
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(12px);
  }

  // 锁定：默认完全透明
  &.locked {
    background: transparent;
    border-color: transparent;
  }

  // 锁定 + 悬停：半透明黑色背景 + 阴影
  &.locked:hover {
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(12px);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
  }

  // 浅色主题
  &.light:not(.locked) {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(0, 0, 0, 0.08);
  }

  &.light.locked:hover {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.15);
  }

  // 锁定时控制栏始终隐藏
  &.locked .control-bar {
    opacity: 0;
    pointer-events: none;
  }

  // 未锁定：控制栏始终可见
  &:not(.locked) .control-bar {
    opacity: 1;
  }

  // 锁定提示悬浮层
  .lock-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 5;

    &.visible {
      opacity: 1;
    }
  }

  .lock-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    user-select: none;
    white-space: nowrap;
  }

  .light .lock-hint {
    background: rgba(255, 255, 255, 0.6);
    color: rgba(0, 0, 0, 0.85);
  }

  // ── 响应式精简控制栏 ──
  // 隐藏顺序：±0.5s → 明暗 → 排列方式 → 翻译 → ±字号
  @media (max-width: 600px) {
    :deep(.ctrl-skip) { display: none; }
  }

  @media (max-width: 500px) {
    :deep(.ctrl-theme) { display: none; }
  }

  @media (max-width: 400px) {
    :deep(.ctrl-display) { display: none; }
  }

  @media (max-width: 350px) {
    :deep(.ctrl-translate) { display: none; }
  }

  @media (max-width: 300px) {
    :deep(.ctrl-font) { display: none; }
  }
}
</style>
