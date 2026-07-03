<template>
  <div
    class="music-play-bar"
    :class="[
      setAnimationClass('animate__bounceInUp'),
      musicFullVisible ? 'play-bar-opcity' : '',
      musicFullVisible && isMagazineMode ? 'play-bar-magazine' : '',
      musicFullVisible && playBarCollapsed ? 'play-bar-collapsed' : '',
      musicFullVisible && MusicFullRef?.musicFullRef?.config?.hidePlayBar
        ? 'animate__animated animate__slideOutDown'
        : ''
    ]"
    @mousemove="handlePlayBarMouseMove"
    :style="{
      color: musicFullVisible && isFrenzyMode
        ? '#000000'
        : musicFullVisible && isMagazineMode
          ? '#000000'
          : musicFullVisible
            ? textColors.theme === 'dark'
              ? '#000000'
              : '#ffffff'
            : settingsStore.theme === 'dark'
              ? '#ffffff'
              : '#000000'
    }"
  >
    <div class="music-time custom-slider">
      <div class="climax-track" v-if="climaxStore.hasSegments && allTime > 0">
        <div
          v-for="(seg, i) in climaxStore.segments"
          :key="'climax-' + i"
          class="climax-segment"
          :class="{ 'climax-active': nowTime >= seg.start && nowTime <= seg.end }"
          :style="{
            left: (seg.start / allTime * 100) + '%',
            width: Math.max(0.5, (seg.end - seg.start) / allTime * 100) + '%'
          }"
        ></div>
      </div>
      <div class="slider-hover-tooltip" v-if="showSliderTooltip && !isDragging" :style="{ left: tooltipX + 'px' }">
        <div v-if="hoverLyric" class="slider-hover-lyric">{{ hoverLyric }}</div>
        <div class="slider-hover-time">{{ hoverTimeStr }}</div>
      </div>
      <n-slider
        v-model:value="timeSlider"
        :step="1"
        :max="allTime"
        :min="0"
        :show-tooltip="false"
        @mouseenter="showSliderTooltip = true"
        @mouseleave="showSliderTooltip = false"
        @mousemove="handleSliderMouseMove"
        @dragstart="handleSliderDragStart"
        @dragend="handleSliderDragEnd"
      ></n-slider>
    </div>
    <div class="play-bar-img-wrapper" @click="setMusicFull">
      <n-image
        :src="getImgUrl(playMusic?.picUrl, '100y100')"
        class="play-bar-img"
        lazy
        preview-disabled
      />
      <div v-if="playMusic?.playLoading" class="loading-overlay">
        <i class="ri-loader-4-line loading-icon"></i>
      </div>
      <div class="hover-arrow">
        <div class="hover-content">
          <!-- <i class="ri-arrow-up-s-line text-3xl" :class="{ 'ri-arrow-down-s-line': musicFullVisible }"></i> -->
          <i
            class="text-3xl"
            :class="musicFullVisible ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'"
          ></i>
          <span class="hover-text">{{
            musicFullVisible ? t('player.playBar.collapse') : t('player.playBar.expand')
          }}</span>
        </div>
      </div>
    </div>
    <div class="music-content">
      <div class="music-content-title flex items-center">
        <n-ellipsis class="text-ellipsis" line-clamp="1">
          <p v-html="playMusic?.name || ''"></p>
        </n-ellipsis>
        <span v-if="playbackRate !== 1.0" class="playback-rate-badge"> {{ playbackRate }}x </span>
      </div>
      <div class="music-content-name">
        <n-ellipsis
          class="text-ellipsis"
          line-clamp="1"
          :tooltip="{
            contentStyle: { maxWidth: '600px' },
            zIndex: 99999
          }"
        >
          <span
            v-for="(artists, artistsindex) in artistList"
            :key="artistsindex"
            class="cursor-pointer hover:text-green-500"
            @click="handleArtistClick(artists.id)"
          >
            {{ artists.name }}{{ artistsindex < artistList.length - 1 ? ' / ' : '' }}
          </span>
        </n-ellipsis>
      </div>
    </div>
    <div class="music-buttons">
      <div class="music-buttons-prev" @click="handlePrev">
        <i class="iconfont icon-prev"></i>
      </div>
      <div class="music-buttons-play" @click="playMusicEvent">
        <i class="iconfont icon" :class="play ? 'icon-stop' : 'icon-play'"></i>
      </div>
      <div class="music-buttons-next" @click="handleNext">
        <i class="iconfont icon-next"></i>
      </div>
    </div>
    <div class="audio-button">
      <div class="audio-volume custom-slider" @wheel.prevent="handleVolumeWheel">
        <div class="volume-icon" @click="mute">
          <i class="iconfont" :class="getVolumeIcon"></i>
        </div>
        <div class="volume-slider">
          <div class="volume-percentage" :class="{ 'volume-percentage-disabled': isMuted }">
            {{ Math.round(volumeSlider) }}%
          </div>
          <n-slider
            v-model:value="volumeSlider"
            :step="0.01"
            :tooltip="false"
            :disabled="isMuted"
            vertical
          ></n-slider>
        </div>
      </div>
      <n-tooltip v-if="!isMobile" trigger="hover" :z-index="9999999">
        <template #trigger>
          <i
            class="iconfont"
            :class="[playModeIcon, { 'intelligence-active': playMode === 3 }]"
            @click="togglePlayMode"
          ></i>
        </template>
        {{ playModeText }}
      </n-tooltip>
      <n-tooltip v-if="!isMobile" trigger="hover" :z-index="9999999">
        <template #trigger>
          <i
            class="iconfont"
            :class="{
              'like-active': isFavorite,
              'ri-heart-3-fill': isFavorite,
              'ri-heart-3-line': !isFavorite
            }"
            @click="toggleFavorite"
          ></i>
        </template>
        {{ t('player.playBar.like') }}
      </n-tooltip>
      <n-tooltip v-if="isElectron" class="music-lyric" trigger="hover" :z-index="9999999">
        <template #trigger>
          <i
            class="iconfont ri-netease-cloud-music-line"
            :class="{ 'text-green-500': isLyricWindowOpen, 'disabled-icon': !playMusic?.id }"
            @click="playMusic?.id && openLyricWindow()"
          ></i>
        </template>
        {{ playMusic?.id ? t('player.playBar.lyric') : t('player.playBar.noSongPlaying') }}
      </n-tooltip>
      <n-tooltip v-if="playMusic?.id && isElectron" trigger="hover" :z-index="9999999">
        <template #trigger>
          <reparse-popover v-if="playMusic?.id" />
        </template>
        {{ t('player.playBar.reparse') }}
      </n-tooltip>

      <!-- 高级控制菜单按钮（整合了 EQ、定时关闭、播放速度） -->
      <advanced-controls-popover />

      <!-- 高潮标记按钮 -->
      <n-tooltip trigger="hover" :z-index="9999999" v-if="isElectron">
        <template #trigger>
          <i
            class="iconfont ri-soundcloud-fill text-2xl hover:text-green-500 transition-colors cursor-pointer"
            :class="{ 'disabled-icon': !playMusic?.id }"
            @click="playMusic?.id && (showClimaxEditor = true)"
          ></i>
        </template>
        标记高潮
      </n-tooltip>
      <climax-editor v-model="showClimaxEditor" />

      <n-tooltip trigger="hover" :z-index="9999999">
        <template #trigger>
          <i
            class="iconfont icon-list text-2xl hover:text-green-500 transition-colors cursor-pointer"
            @click="openPlayListDrawer"
          ></i>
        </template>
        {{ t('player.playBar.playList') }}
      </n-tooltip>
    </div>
    <!-- 全屏播放器 -->
    <music-full-wrapper ref="MusicFullRef" v-model="musicFullVisible" :background="background" />
  </div>
</template>

<script lang="ts" setup>
import { useThrottleFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import MusicFullWrapper from '@/components/lyric/MusicFullWrapper.vue';
import ClimaxEditor from '@/components/ClimaxEditor.vue';
import AdvancedControlsPopover from '@/components/player/AdvancedControlsPopover.vue';
import ReparsePopover from '@/components/player/ReparsePopover.vue';
import {
  allTime,
  artistList,
  getLyricTextAtTime,
  isLyricWindowOpen,
  nowTime,
  openLyric,
  playMusic,
  textColors
} from '@/hooks/MusicHook';
import { useArtist } from '@/hooks/useArtist';
import { useFavorite } from '@/hooks/useFavorite';
import { useCoverColor } from '@/hooks/useCoverColor';
import { usePlaybackControl } from '@/hooks/usePlaybackControl';
import { usePlayMode } from '@/hooks/usePlayMode';
import { useVolumeControl } from '@/hooks/useVolumeControl';
import { audioService } from '@/services/audioService';
import { usePlayerStore } from '@/store/modules/player';
import { useClimaxStore } from '@/store/modules/climax';
import { useSettingsStore } from '@/store/modules/settings';
import { getImgUrl, isElectron, isMobile, secondToMinute, setAnimationClass } from '@/utils';

const playerStore = usePlayerStore();
const climaxStore = useClimaxStore();
const settingsStore = useSettingsStore();
const { primaryColor: accentColor } = useCoverColor();
const { t } = useI18n();

// 播放控制
const { isPlaying: play, playMusicEvent, handleNext, handlePrev } = usePlaybackControl();

// 音量控制
const {
  isMuted,
  volumeSlider,
  volumeIcon: getVolumeIcon,
  mute,
  handleVolumeWheel
} = useVolumeControl();

// 收藏
const { isFavorite, toggleFavorite } = useFavorite();

// 播放模式
const { playMode, playModeIcon, playModeText, togglePlayMode } = usePlayMode();

// 播放速度控制
const { playbackRate } = storeToRefs(playerStore);

// 背景颜色
const background = ref('#000');

watch(
  () => playerStore.playMusic,
  async () => {
    if (playMusic && playMusic.value && playMusic.value.backgroundColor) {
      background.value = playMusic.value.backgroundColor as string;
    }
  },
  { immediate: true, deep: true }
);

// 加载当前歌曲的高潮段落
watch(
  () => playMusic.value?.id,
  async (newId) => {
    if (newId) {
      climaxStore.loadSegments(String(newId));
    } else {
      climaxStore.clear();
    }
  },
  { immediate: true }
);

// 节流版本的 seek 函数
const throttledSeek = useThrottleFn((value: number) => {
  audioService.seek(value);
  nowTime.value = value;
}, 50);

// 拖动时的临时值
const dragValue = ref(0);
const isDragging = ref(false);

const timeSlider = computed({
  get: () => (isDragging.value ? dragValue.value : nowTime.value),
  set: (value) => {
    if (isDragging.value) {
      dragValue.value = value;
      return;
    }
    throttledSeek(value);
  }
});

const handleSliderDragStart = () => {
  isDragging.value = true;
  dragValue.value = nowTime.value;
};

const handleSliderDragEnd = () => {
  isDragging.value = false;
  audioService.seek(dragValue.value);
  nowTime.value = dragValue.value;
};

const MusicFullRef = ref<any>(null);
const showSliderTooltip = ref(false);
const showClimaxEditor = ref(false);
const hoverTimeSec = ref(0);
const tooltipX = ref(0);
const hoverLyric = ref<string | null>(null);
const hoverTimeStr = ref('');

const handleSliderMouseMove = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  hoverTimeSec.value = percent * allTime.value;
  tooltipX.value = e.clientX - rect.left;
  hoverTimeStr.value = `${secondToMinute(hoverTimeSec.value)} / ${secondToMinute(allTime.value)}`;
  hoverLyric.value = getLyricTextAtTime(hoverTimeSec.value);
};

const musicFullVisible = computed({
  get: () => playerStore.musicFull,
  set: (value) => {
    playerStore.setMusicFull(value);
  }
});

const setMusicFull = () => {
  musicFullVisible.value = !musicFullVisible.value;
  playerStore.setMusicFull(musicFullVisible.value);
  if (musicFullVisible.value) {
    settingsStore.showArtistDrawer = false;
  }
};

// ==================== 播放栏自动收起 ====================

const playBarCollapsed = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
const COLLAPSE_DELAY = 5000; // 5秒无操作后收起
const HOVER_ZONE = 40; // 底部 40px 触发区域

function resetCollapseTimer() {
  if (collapseTimer) clearTimeout(collapseTimer);
  playBarCollapsed.value = false;
  collapseTimer = setTimeout(() => {
    playBarCollapsed.value = true;
  }, COLLAPSE_DELAY);
}

function clearCollapseTimer() {
  if (collapseTimer) clearTimeout(collapseTimer);
  playBarCollapsed.value = false;
}

// 检测播放器模式（用于样式，不再限制自动收起）
const isMagazineMode = ref(false);
const isFrenzyMode = ref(false);
function updatePlayerMode() {
  try {
    const saved = localStorage.getItem('music-full-config');
    if (saved) {
      const config = JSON.parse(saved);
      isMagazineMode.value = config.playerStyle === 'magazine';
      isFrenzyMode.value = config.playerStyle === 'frenzy';
      return;
    }
  } catch {}
  isMagazineMode.value = false;
  isFrenzyMode.value = false;
}
updatePlayerMode();
window.addEventListener('music-full-config-updated', updatePlayerMode);
onUnmounted(() => {
  window.removeEventListener('music-full-config-updated', updatePlayerMode);
});

// 所有模式都启用自动收起（Frenzy 除外）
watch(musicFullVisible, (visible) => {
  if (visible) {
    // 检查当前是否为全屏样式模式
    try {
      const saved = localStorage.getItem('music-full-config');
      if (saved) {
        const cfg = JSON.parse(saved);
        if (cfg.playerStyle === 'frenzy') {
          playBarCollapsed.value = false;
          return;
        }
      }
    } catch {}
    resetCollapseTimer();
  } else {
    clearCollapseTimer();
  }
});

// 鼠标在播放栏上移动时重置计时器
const handlePlayBarMouseMove = () => {
  if (musicFullVisible.value) {
    resetCollapseTimer();
  }
};

// 全局鼠标移动检测底部边缘
const handleWindowMouseMove = (e: MouseEvent) => {
  if (!musicFullVisible.value) return;

  const isNearBottom = e.clientY >= window.innerHeight - HOVER_ZONE;
  if (isNearBottom && playBarCollapsed.value) {
    resetCollapseTimer();
  }
};

onMounted(() => {
  window.addEventListener('mousemove', handleWindowMouseMove);
});

onUnmounted(() => {
  if (collapseTimer) clearTimeout(collapseTimer);
  window.removeEventListener('mousemove', handleWindowMouseMove);
});

const openLyricWindow = () => {
  openLyric();
};

const { navigateToArtist } = useArtist();

const handleArtistClick = (id: number) => {
  musicFullVisible.value = false;
  navigateToArtist(id);
};

const openPlayListDrawer = () => {
  playerStore.setPlayListDrawerVisible(true);
};
</script>

<style lang="scss" scoped>
.text-ellipsis {
  width: 100%;
}

.slider-hover-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
  text-align: center;

  .slider-hover-lyric {
    font-size: 12px;
    color: #fff;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }

  .slider-hover-time {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-family: monospace;
  }
}

.music-play-bar {
  @apply h-20 w-full absolute bottom-0 left-0 flex items-center box-border px-6 py-2 pt-3;
  @apply bg-light dark:bg-dark shadow-2xl shadow-gray-300;
  z-index: 9999;
  animation-duration: 0.5s !important;

  &.play-bar-opcity {
    @apply bg-transparent !important;
    box-shadow: 0 0 20px 5px #0000001d;
    color: #000000;

    // 杂志模式：强制所有子元素继承黑色（:deep 穿透子组件）
    &.play-bar-magazine {
      :deep(*) {
        color: #000000 !important;
      }
    }

    // 各元素悬停时变强调色
    :deep(.music-content-title),
    :deep(.music-content-name),
    :deep(.music-buttons-prev),
    :deep(.music-buttons-next),
    :deep(.music-buttons-play),
    :deep(.audio-button .iconfont) {
      transition: color 0.2s ease;
      &:hover {
        color: var(--accent-color, #22c55e) !important;
      }
    }
  }

// 排版模式收起状态：只显示进度条
  &.play-bar-collapsed {
    height: 6px !important;
    padding: 0 !important;
    background: rgba(0, 0, 0, 0.1) !important;
    transition: height 0.3s ease;
    --play-bar-height: 6px;

    .music-time {
      width: 100%;
      padding: 0 4px;
      height: 6px;
      display: flex;
      align-items: center;
    }

    .play-bar-img-wrapper,
    .music-content,
    .music-buttons,
    .audio-button {
      display: none !important;
    }
  }

  &.animate__slideOutDown {
    animation-duration: 0.3s !important;
  }

  .music-content {
    width: 200px;
    @apply ml-4;

    &-title {
      @apply text-base;
    }

    &-name {
      @apply text-xs mt-1 opacity-80;
    }
  }
}

.play-bar-img {
  @apply w-14 h-14 rounded-2xl;
}

.music-buttons {
  @apply mx-6 flex-1 flex justify-center;

  .iconfont {
    @apply text-2xl transition;
    @apply hover:text-green-500;
  }

  .icon {
    @apply text-3xl;
    @apply hover:text-green-500;
  }

  @apply flex items-center;

  > div {
    @apply cursor-pointer;
  }

  &-play {
    @apply flex justify-center items-center w-20 h-12 rounded-full mx-4 transition text-gray-500;
    @apply bg-gray-100 bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-60 hover:bg-gray-200;
  }
}

.audio-volume {
  @apply flex items-center relative;
  &:hover {
    .volume-slider {
      @apply opacity-100 visible;
    }
  }
  .volume-icon {
    @apply cursor-pointer;
  }

  .iconfont {
    @apply text-2xl transition;
    @apply hover:text-green-500;
  }

  .volume-slider {
    @apply absolute opacity-0 invisible transition-all duration-300 bottom-[30px] left-1/2 -translate-x-1/2 h-[180px] px-2 py-4 rounded-xl;
    @apply bg-light dark:bg-dark-200;
    @apply border border-gray-200 dark:border-gray-700;

    .volume-percentage {
      @apply absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium bg-light dark:bg-dark-200 px-2 py-1 rounded-md;
      @apply border border-gray-200 dark:border-gray-700;
      @apply text-gray-800 dark:text-white;
      white-space: nowrap;

      &.volume-percentage-disabled {
        @apply text-gray-400 dark:text-gray-500;
      }
    }
  }
}

.audio-button {
  @apply flex items-center;

  .iconfont {
    @apply text-2xl transition cursor-pointer mx-3;
    @apply hover:text-green-500;
  }
}

.music-play {
  &-list {
    height: 50vh;
    width: 300px;
    @apply relative rounded-3xl overflow-hidden py-2;
    &-back {
      backdrop-filter: blur(20px);
      @apply absolute top-0 left-0 w-full h-full;
      @apply bg-light dark:bg-black bg-opacity-75;
    }
    &-content {
      @apply mx-2;
    }
  }
}

.mobile {
  .music-play-bar {
    @apply px-4 bottom-[56px] transition-all duration-300;
  }
  .music-time {
    display: none;
  }
  .ri-netease-cloud-music-line {
    display: none;
  }
  .audio-volume {
    display: none;
  }
  .audio-button {
    @apply mx-0;
  }
  .music-buttons {
    @apply m-0;
    &-prev,
    &-next {
      display: none;
    }
    &-play {
      @apply m-0;
    }
  }
  .music-content {
    flex: 1;
  }
}

// 自定义滑块样式
.custom-slider {
  :deep(.n-slider) {
    --n-rail-height: 4px;
    --n-rail-color: theme('colors.gray.200');
    --n-rail-color-dark: theme('colors.gray.700');
    --n-fill-color: var(--accent-color, #22c55e);
    --n-fill-color-hover: var(--accent-color, #22c55e);
    --n-handle-size: 12px;
    --n-handle-color: var(--accent-color, #22c55e);

    &.n-slider--vertical {
      height: 100%;

      .n-slider-rail {
        width: 4px;
      }

      &:hover {
        .n-slider-rail {
          width: 6px;
        }

        .n-slider-handle {
          width: 14px;
          height: 14px;
        }
      }
    }

    .n-slider-rail {
      @apply overflow-hidden transition-all duration-200;
      @apply bg-gray-500 dark:bg-dark-300 bg-opacity-10 !important;
    }

    .n-slider-handle {
      @apply transition-all duration-200;
      opacity: 0;
    }

    &:hover {
      .n-slider-handle {
        opacity: 1;
      }
    }

    // 确保悬停时提示样式正确
    .n-slider-tooltip {
      @apply bg-dark-200 text-white text-xs py-1 px-2 rounded;
      z-index: 999999;
    }
  }

  :deep(.n-slider-handle .n-slider-tooltip) {
    display: none !important;
  }
}

.play-bar-img-wrapper {
  @apply relative cursor-pointer w-14 h-14;

  .hover-arrow {
    @apply absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 rounded-2xl;
    background: rgba(0, 0, 0, 0.5);

    .hover-content {
      @apply flex flex-col items-center justify-center;

      i {
        @apply text-white mb-0.5;
      }

      .hover-text {
        @apply text-white text-xs scale-90;
      }
    }
  }

  &:hover {
    .hover-arrow {
      @apply opacity-100;
    }
  }
}

.tooltip-content {
  @apply text-sm py-1 px-2;
}

.play-bar-img {
  @apply w-14 h-14 rounded-2xl;
}

.like-active {
  @apply text-red-500 hover:text-red-600 !important;
}

.intelligence-active {
  @apply text-green-500 hover:text-green-600 !important;
}

.disabled-icon {
  @apply opacity-50 cursor-not-allowed !important;
  &:hover {
    @apply text-inherit !important;
  }
}

.icon-loop,
.icon-single-loop {
  font-size: 1.5rem;
}

.music-time .n-slider {
  position: absolute;
  top: 0;
  left: 0;
  padding: 0;
  border-radius: 0;
}

// 高潮段落标记
.climax-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  pointer-events: none;
  z-index: 1;
}

.climax-segment {
  position: absolute;
  height: 100%;
  background: rgba(var(--accent-color-rgb, 34, 197, 94), 0.4);
  border-radius: 2px;
  transition: background-color 0.3s;
}

.climax-segment.climax-active {
  background: rgba(var(--accent-color-rgb, 34, 197, 94), 0.8);
  box-shadow: 0 0 6px rgba(var(--accent-color-rgb, 34, 197, 94), 0.5);
}

.music-eq {
  @apply p-4 rounded-3xl;
  backdrop-filter: blur(20px);
  @apply bg-light dark:bg-black bg-opacity-75;
}

.music-play-list-content {
  @apply mx-2;

  .delete-btn {
    @apply p-2 rounded-full transition-colors duration-200 cursor-pointer;
    @apply hover:bg-red-50 dark:hover:bg-red-900/20;

    .iconfont {
      @apply text-lg;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-overlay {
  @apply absolute inset-0 flex items-center justify-center rounded-2xl;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.loading-icon {
  font-size: 24px;
  color: white;
  animation: spin 1s linear infinite;
}

.play-speed {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 8px;
}

.speed-button {
  font-size: 14px;
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--hover-color);
}

.speed-button:hover {
  background: var(--hover-color-dark);
}

.playback-rate-badge {
  @apply ml-2 px-1.5 h-4 flex items-center text-xs rounded bg-green-500 bg-opacity-15 text-green-600 dark:text-green-400;
  font-weight: 500;
  vertical-align: 1px;
}
</style>

<style>
.n-slider-handle-indicator {
  display: none !important;
}
</style>
