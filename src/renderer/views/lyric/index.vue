<template>
  <div
    class="lyric-window"
    :class="[lyricSetting.theme, { lyric_lock: lyricSetting.isLock }]"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dblclick="cycleDisplayMode"
    @wheel="handleWheel"
  >
    <div class="drag-overlay"></div>

    <!-- 顶部控制栏 -->
    <LyricControlBar
      :show-controls="showControls"
      :display-mode="displayMode"
      :is-locked="lyricSetting.isLock"
      :theme="lyricSetting.theme"
      :has-translation="hasTranslation"
      :show-translation="showTranslation"
      :show-theme-color-panel="showThemeColorPanel"
      :current-highlight-color="currentHighlightColor"
      :play-music-name="staticData.playMusic?.name || ''"
      :is-play="dynamicData.isPlay"
      @update:display-mode="cycleDisplayMode"
      @update:theme="checkTheme"
      @update:show-translation="lyricSetting.showTranslation = !lyricSetting.showTranslation"
      @update:is-lock="handleLock"
      @update:show-theme-color-panel="toggleThemeColorPanel"
      @color-change="handleColorChange"
      @play-pause="handlePlayPause"
      @prev="handlePrev"
      @next="handleNext"
      @increase-font="increaseFontSize"
      @decrease-font="decreaseFontSize"
      @close="handleClose"
    />

    <!-- 主题色选择面板 -->
    <ThemeColorPanel
      :visible="showThemeColorPanel"
      :current-color="currentHighlightColor"
      :theme="lyricSetting.theme"
      @color-change="handleColorChange"
      @close="handleThemeColorPanelClose"
    />

    <!-- 歌词显示区域 -->
    <div ref="containerRef" class="lyric-container">
      <LyricDisplay
        :display-mode="displayMode"
        :lrc-array="staticData.lrcArray"
        :current-index="currentIndex"
        :font-size="fontSize"
        :show-translation="showTranslation"
        :wrapper-style="wrapperStyle"
        :get-dynamic-line-style="getDynamicLineStyle"
        :get-word-style="getWordStyle"
        :get-lyric-style="getLyricStyle"
        :current-group-lines="currentGroupLines"
        :is-group-transitioning="isGroupTransitioning"
      />
    </div>

    <!-- 悬停信息 tooltip -->
    <LyricTooltip
      :visible="showTooltip"
      :play-music="staticData.playMusic"
      :current-time="dynamicData.nowTime"
      :all-time="staticData.allTime"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import LyricControlBar from './components/LyricControlBar.vue';
import LyricDisplay from './components/LyricDisplay.vue';
import LyricTooltip from './components/LyricTooltip.vue';
import ThemeColorPanel from '@/components/lyric/ThemeColorPanel.vue';

import { useLyricControls } from './composables/useLyricControls';
import { useLyricDrag } from './composables/useLyricDrag';
import { useLyricSettings } from './composables/useLyricSettings';
import { useLyricState } from './composables/useLyricState';
import { useLyricTheme } from './composables/useLyricTheme';

defineOptions({ name: 'Lyric' });

// ── Composables ──
const { lyricSetting, saveLyricSettings } = useLyricSettings();
const {
  containerRef,
  staticData,
  dynamicData,
  currentIndex,
  fontSize,
  hasTranslation,
  currentGroupLines,
  isGroupTransitioning,
  displayMode,
  showTranslation,
  wrapperStyle,
  getDynamicLineStyle,
  getWordStyle,
  getLyricStyle,
  increaseFontSize,
  decreaseFontSize
} = useLyricState(lyricSetting);
const {
  currentHighlightColor,
  showThemeColorPanel,
  toggleThemeColorPanel,
  handleColorChange,
  handleThemeColorPanelClose,
  initializeThemeColor,
  validateAndFixColorSettings,
  updateThemeColorWithTransition
} = useLyricTheme(lyricSetting);
const {
  showControls,
  handlePlayPause,
  handlePrev,
  handleNext,
  handleLock,
  handleClose,
  checkTheme,
  handleMouseEnter,
  handleMouseLeave
} = useLyricControls(lyricSetting);
const { handleMouseDown, isDragging } = useLyricDrag(lyricSetting);

// ── 双击切换显示模式 ──
const cycleDisplayMode = () => {
  const modes = ['scroll', 'single', 'double'] as const;
  const current = modes.indexOf(displayMode.value);
  lyricSetting.value.displayMode = modes[(current + 1) % modes.length];
};

// ── 滚轮调字体 ──
const handleWheel = (e: WheelEvent) => {
  if (lyricSetting.value.isLock) return;
  if (e.deltaY < 0) increaseFontSize();
  else decreaseFontSize();
};

// ── 悬停信息 tooltip ──
const showTooltip = ref(false);
let tooltipShowTimer: ReturnType<typeof setTimeout> | null = null;
let tooltipHideTimer: ReturnType<typeof setTimeout> | null = null;

const handleWindowMouseMove = (e: MouseEvent) => {
  const isNearTop = e.clientY < 80;
  const isNearBottom = e.clientY > window.innerHeight - 80;

  if (isNearTop || isNearBottom) {
    if (tooltipHideTimer) {
      clearTimeout(tooltipHideTimer);
      tooltipHideTimer = null;
    }
    if (!showTooltip.value && !tooltipShowTimer) {
      tooltipShowTimer = setTimeout(() => {
        showTooltip.value = true;
        tooltipShowTimer = null;
      }, 300);
    }
  } else {
    if (tooltipShowTimer) {
      clearTimeout(tooltipShowTimer);
      tooltipShowTimer = null;
    }
    if (showTooltip.value && !tooltipHideTimer) {
      tooltipHideTimer = setTimeout(() => {
        showTooltip.value = false;
        tooltipHideTimer = null;
      }, 500);
    }
  }
};

// ── 生命周期 ──
onMounted(() => {
  initializeThemeColor();
  validateAndFixColorSettings();
  window.addEventListener('mousemove', handleWindowMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleWindowMouseMove);
  if (tooltipShowTimer) clearTimeout(tooltipShowTimer);
  if (tooltipHideTimer) clearTimeout(tooltipHideTimer);
});
</script>

<style scoped>
html,
body,
#app {
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}
</style>

<style lang="scss" scoped>
.lyric-window {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: transparent !important;
  user-select: none;
  transition: background-color 0.3s ease;
  cursor: default;
  border-radius: 14px;

  &.color-transitioning {
    .lyric-text-inner {
      transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .control-button {
      i {
        transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
    }
  }

  &:active {
    cursor: grabbing;
  }

  &.lyric_lock {
    cursor: pointer;

    &:active {
      cursor: pointer;
    }
  }
}

.drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.lyric-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}
</style>
