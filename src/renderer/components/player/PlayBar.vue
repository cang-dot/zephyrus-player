<template>
  <div class="play-bar-root">
    <!-- 浮动进度条 -->
    <div
      class="floating-progress"
      :class="{ 'fp-visible': play || playMusic?.id }"
      :style="barMinimal ? { right: 'auto', width: barCollapsedWidth, left: '24px' } : {}"
    >
      <div class="fp-track">
        <div class="fp-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- 主播放栏 -->
    <div
      class="floating-bar"
      :class="[
        barMinimal ? 'bar-minimal' : '',
        musicFullVisible && MusicFullRef?.musicFullRef?.config?.hidePlayBar
          ? 'animate__animated animate__slideOutDown'
          : ''
      ]"
      :style="barMinimal ? { right: 'auto', width: barCollapsedWidth } : {}"
      @mouseenter="handleBarEnter"
      @mouseleave="handleBarLeave"
    >
      <!-- 左侧：封面 + 歌曲信息 -->
      <div class="bar-left">
        <div class="bar-cover" @click="setMusicFull">
          <n-image :src="getImgUrl(playMusic?.picUrl, '100y100')" class="bar-cover-img" lazy preview-disabled />
          <div v-if="playMusic?.playLoading" class="bar-cover-loading">
            <i class="ri-loader-4-line loading-icon"></i>
          </div>
        </div>
        <div class="bar-song-info">
          <div class="bar-song-title">
            <n-ellipsis line-clamp="1"><p v-html="playMusic?.name || ''"></p></n-ellipsis>
          </div>
          <div class="bar-song-artist">
            <n-ellipsis line-clamp="1">
              <span
                v-for="(a, i) in artistList"
                :key="i"
                class="cursor-pointer hover:text-[var(--accent-color)]"
                @click.stop="handleArtistClick(a.id)"
              >{{ a.name }}{{ i < artistList.length - 1 ? ' / ' : '' }}</span>
            </n-ellipsis>
          </div>
        </div>
      </div>

      <!-- 左侧隐形 spacer（展开时帮助居中） -->
      <div class="bar-spacer" v-if="!barMinimal"></div>

      <!-- 播放控制 -->
      <div class="bar-controls">
        <div class="bar-btn" @click="handlePrev">
          <i class="iconfont icon-prev"></i>
        </div>
        <div class="bar-btn-play" @click="playMusicEvent">
          <i class="iconfont icon" :class="play ? 'icon-stop' : 'icon-play'"></i>
        </div>
        <div class="bar-btn" @click="handleNext">
          <i class="iconfont icon-next"></i>
        </div>
      </div>

      <!-- 右侧隐形 spacer（展开时帮助居中） -->
      <div class="bar-spacer" v-if="!barMinimal"></div>

      <!-- 音量（独立于 actions，防止 popup 被 overflow 裁剪） -->
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

      <!-- 右侧功能按钮（收起时隐藏） -->
      <div
        class="bar-actions"
        :class="{ 'bar-actions-hidden': barMinimal }"
      >
        <div class="bar-action-btn">
          <n-tooltip v-if="!isMobile" trigger="hover" :z-index="9999999">
            <template #trigger>
              <div class="bar-btn" @click="togglePlayMode">
                <i class="iconfont" :class="[playModeIcon, { 'intelligence-active': playMode === 3 }]"></i>
              </div>
            </template>
            {{ playModeText }}
          </n-tooltip>
        </div>

        <div class="bar-action-btn">
          <n-tooltip v-if="!isMobile" trigger="hover" :z-index="9999999">
            <template #trigger>
              <div class="bar-btn" :class="{ 'like-active': isFavorite }" @click="toggleFavorite">
                <i class="iconfont" :class="isFavorite ? 'ri-heart-3-fill' : 'ri-heart-3-line'"></i>
              </div>
            </template>
            {{ t('player.playBar.like') }}
          </n-tooltip>
        </div>

        <div class="bar-action-btn">
          <n-tooltip v-if="isElectron" trigger="hover" :z-index="9999999">
            <template #trigger>
              <div class="bar-btn" @click="playMusic?.id && openLyricWindow()">
                <i class="iconfont ri-netease-cloud-music-line"
                   :class="{ 'text-[var(--accent-color)]': isLyricWindowOpen, 'disabled-icon': !playMusic?.id }"></i>
              </div>
            </template>
            {{ playMusic?.id ? t('player.playBar.lyric') : t('player.playBar.noSongPlaying') }}
          </n-tooltip>
        </div>

        <div class="bar-action-btn">
          <n-tooltip v-if="playMusic?.id && isElectron" trigger="hover" :z-index="9999999">
            <template #trigger>
              <div class="bar-btn"><reparse-popover /></div>
            </template>
            {{ t('player.playBar.reparse') }}
          </n-tooltip>
        </div>

        <div class="bar-action-btn">
          <advanced-controls-popover />
        </div>

        <div class="bar-action-btn">
          <n-tooltip trigger="hover" :z-index="9999999" v-if="isElectron">
            <template #trigger>
              <div class="bar-btn" :class="{ 'disabled-icon': !playMusic?.id }" @click="playMusic?.id && (showClimaxEditor = true)">
                <i class="iconfont ri-soundcloud-fill"></i>
              </div>
            </template>
            标记高潮
          </n-tooltip>
          <climax-editor v-model="showClimaxEditor" />
        </div>

        <div class="bar-action-btn">
          <n-tooltip v-if="metaphorButtonVisible" trigger="hover" :z-index="9999999">
            <template #trigger>
              <div class="bar-btn" :class="{ 'text-[var(--accent-color)]': showMetaphorPanel }" @click="showMetaphorPanel = !showMetaphorPanel">
                <i class="iconfont ri-quill-pen-line"></i>
              </div>
            </template>
            歌词隐喻分析
          </n-tooltip>
        </div>

        <div class="bar-action-btn">
          <n-tooltip trigger="hover" :z-index="9999999">
            <template #trigger>
              <div class="bar-btn" @click="openPlayListDrawer">
                <i class="iconfont icon-list"></i>
              </div>
            </template>
            {{ t('player.playBar.playList') }}
          </n-tooltip>
        </div>
      </div>

      <music-full-wrapper ref="MusicFullRef" v-model="musicFullVisible" :background="background" />
    </div>

    <metaphor-panel
      v-model="showMetaphorPanel"
      :lyrics="lyricsText"
      :song-name="songName"
      :artist="artistName"
      :album-id="albumId"
      @configure="showMetaphorConfig = true"
    />
    <metaphor-config-modal v-model="showMetaphorConfig" />
  </div>
</template>

<script lang="ts" setup>
import { useThrottleFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ClimaxEditor from '@/components/ClimaxEditor.vue';
import MusicFullWrapper from '@/components/lyric/MusicFullWrapper.vue';
import AdvancedControlsPopover from '@/components/player/AdvancedControlsPopover.vue';
import ReparsePopover from '@/components/player/ReparsePopover.vue';
import MetaphorConfigModal from '@/features/lyric-metaphor/MetaphorConfigModal.vue';
import MetaphorPanel from '@/features/lyric-metaphor/MetaphorPanel.vue';
import { isFeatureEnabled } from '@/features/store';
import {
  allTime, artistList, isLyricWindowOpen, lrcArray, nowTime, openLyric, playMusic
} from '@/hooks/MusicHook';
import { useArtist } from '@/hooks/useArtist';
import { useCoverColor } from '@/hooks/useCoverColor';
import { useFavorite } from '@/hooks/useFavorite';
import { usePlaybackControl } from '@/hooks/usePlaybackControl';
import { usePlayMode } from '@/hooks/usePlayMode';
import { useVolumeControl } from '@/hooks/useVolumeControl';
import { audioService } from '@/services/audioService';
import { useClimaxStore } from '@/store/modules/climax';
import { usePlayerStore } from '@/store/modules/player';
import { useSettingsStore } from '@/store/modules/settings';
import { getImgUrl, isElectron, isMobile, secondToMinute, setAnimationClass } from '@/utils';

const playerStore = usePlayerStore();
const climaxStore = useClimaxStore();
const settingsStore = useSettingsStore();
useCoverColor();
const { t } = useI18n();

const { isPlaying: play, playMusicEvent, handleNext, handlePrev } = usePlaybackControl();
const { isMuted, volumeSlider, volumeIcon: getVolumeIcon, mute, handleVolumeWheel } = useVolumeControl();
const { isFavorite, toggleFavorite } = useFavorite();
const { playMode, playModeIcon, playModeText, togglePlayMode } = usePlayMode();
const { playbackRate } = storeToRefs(playerStore);

const background = ref('#000');
watch(() => playerStore.playMusic, async () => {
  if (playMusic?.value?.backgroundColor) background.value = playMusic.value.backgroundColor as string;
}, { immediate: true, deep: true });

watch(() => playMusic.value?.id, async (newId) => {
  if (newId) climaxStore.loadSegments(String(newId));
  else climaxStore.clear();
}, { immediate: true });

// ==================== 进度条 ====================
const progressPercent = computed(() => {
  if (allTime.value <= 0) return 0;
  return (nowTime.value / allTime.value) * 100;
});

useThrottleFn((value: number) => {
  audioService.seek(value);
  nowTime.value = value;
}, 50);

const MusicFullRef = ref<any>(null);
const showClimaxEditor = ref(false);
const showMetaphorPanel = ref(false);
const showMetaphorConfig = ref(false);

const musicFullVisible = computed({
  get: () => playerStore.musicFull,
  set: (value) => playerStore.setMusicFull(value)
});

const setMusicFull = () => {
  musicFullVisible.value = !musicFullVisible.value;
  playerStore.setMusicFull(musicFullVisible.value);
  if (musicFullVisible.value) settingsStore.showArtistDrawer = false;
};

// ==================== 收起逻辑 ====================
const barMinimal = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
let currentCollapseDelay = 5000;
const barCollapsedWidth = ref('auto');

function measureCollapsedWidth() {
  nextTick(() => {
    const el = document.querySelector('.floating-bar') as HTMLElement | null;
    if (!el) return;
    // 临时隐藏所有收起时隐藏的元素
    const volume = el.querySelector('.audio-volume') as HTMLElement | null;
    if (volume) volume.style.display = 'none';
    const actions = el.querySelector('.bar-actions') as HTMLElement | null;
    if (actions) actions.style.display = 'none';
    const spacers = el.querySelectorAll('.bar-spacer');
    spacers.forEach((s: any) => (s as HTMLElement).style.display = 'none');

    el.style.width = 'fit-content';
    el.style.right = 'auto';
    const w = el.offsetWidth;

    // 恢复
    if (volume) volume.style.display = '';
    if (actions) actions.style.display = '';
    spacers.forEach((s: any) => (s as HTMLElement).style.display = '');
    el.style.width = '';
    el.style.right = '';
    barCollapsedWidth.value = Math.max(w, 320) + 'px';
  });
}

function resetCollapseTimer() {
  if (collapseTimer) clearTimeout(collapseTimer);
  barMinimal.value = false;
  collapseTimer = setTimeout(() => {
    measureCollapsedWidth();
    barMinimal.value = true;
  }, currentCollapseDelay);
}

function clearCollapseTimer() {
  if (collapseTimer) clearTimeout(collapseTimer);
  barMinimal.value = false;
}

const handleBarEnter = () => {
  if (barMinimal.value) {
    barMinimal.value = false;
    if (collapseTimer) clearTimeout(collapseTimer);
  }
};

const handleBarLeave = () => {
  resetCollapseTimer();
};

watch(musicFullVisible, (visible) => {
  if (visible) {
    try {
      const saved = localStorage.getItem('music-full-config');
      if (saved) {
        const cfg = JSON.parse(saved);
        if (cfg.playerStyle === 'frenzy') { barMinimal.value = false; return; }
      }
    } catch {}
    currentCollapseDelay = 3000;
    resetCollapseTimer();
  } else {
    clearCollapseTimer();
  }
});

watch(musicFullVisible, (visible) => {
  if (!visible) {
    currentCollapseDelay = 5000;
    nextTick(() => resetCollapseTimer());
  }
});

const HOVER_ZONE = 24;
const handleWindowMouseMove = (e: MouseEvent) => {
  if (musicFullVisible.value) return;
  if (e.clientY >= window.innerHeight - HOVER_ZONE && barMinimal.value) {
    barMinimal.value = false;
    currentCollapseDelay = 5000;
    resetCollapseTimer();
  }
};

onMounted(() => {
  window.addEventListener('mousemove', handleWindowMouseMove);
  resetCollapseTimer();
});

onUnmounted(() => {
  if (collapseTimer) clearTimeout(collapseTimer);
  window.removeEventListener('mousemove', handleWindowMouseMove);
});

const openLyricWindow = () => openLyric();
const { navigateToArtist } = useArtist();
const handleArtistClick = (id: number) => { musicFullVisible.value = false; navigateToArtist(id); };
const openPlayListDrawer = () => playerStore.setPlayListDrawerVisible(true);
const metaphorButtonVisible = computed(() => isFeatureEnabled('lyric-metaphor') && !!playMusic?.value?.name);
const lyricsText = computed(() => lrcArray.value.map((l) => l.text).join('\n'));
const songName = computed(() => playMusic?.value?.name || '');
const albumId = computed(() => playMusic?.value?.al?.id ?? playMusic?.value?.album?.id ?? null);
const artistName = computed(() => Array.isArray(artistList.value) ? artistList.value.map((a: any) => a.name).join(' / ') : '');
</script>

<style lang="scss" scoped>
// ==================== 浮动进度条 ====================
.floating-progress {
  position: fixed;
  bottom: 93px;
  left: 24px;
  right: 24px;
  height: 6px;
  border-radius: 12px;
  z-index: 10000;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.4s cubic-bezier(0.2, 0, 0.1, 1),
              transform 0.4s cubic-bezier(0.2, 0, 0.1, 1),
              width 0.45s cubic-bezier(0.2, 0, 0, 1);

  &.fp-visible {
    opacity: 1;
    transform: translateY(0);
  }
}
.fp-track { width: 100%; height: 100%; border-radius: 12px; background: rgba(0,0,0,0.06); overflow: hidden; }
:global(.dark) .fp-track { background: rgba(255,255,255,0.08); }
.fp-fill { height: 100%; border-radius: 12px; background: var(--accent-color, #888); transition: width 0.3s linear; }

// ==================== 主浮动栏 ====================
.floating-bar {
  position: fixed;
  bottom: 16px;
  left: 24px;
  right: 24px;
  height: 64px;
  border-radius: 16px;
  z-index: 9999;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: var(--bg-light, #fff);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  transition: width 0.45s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.45s cubic-bezier(0.2, 0, 0, 1),
              background 0.2s ease;

  :global(.dark) & { background: var(--bg-dark, #1a1a1a); box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2); }
  &.bar-minimal {
    padding: 0 16px;
    .audio-volume { display: none; }
    .bar-spacer { display: none; }
  }
  &.animate__slideOutDown { animation-duration: 0.3s !important; }
}

// ==================== 左侧组 ====================
.bar-left { display: flex; align-items: center; flex-shrink: 0; gap: 0; }

// ==================== 封面 ====================
.bar-cover { position: relative; cursor: pointer; flex-shrink: 0; }
.bar-cover-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; }
.bar-cover-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(0,0,0,0.5); z-index: 2; }
.loading-icon { font-size: 20px; color: #fff; animation: spin 1s linear infinite; }

// ==================== 歌曲信息 ====================
.bar-song-info { flex: 1; min-width: 0; margin-left: 16px; overflow: hidden; }
.bar-song-title { font-size: 14px; font-weight: 500; line-height: 1.4; display: block; }
.bar-song-artist { font-size: 12px; opacity: 0.55; margin-top: 2px; line-height: 1.3; display: block; }

// ==================== 隐形 spacer ====================
.bar-spacer { flex: 1; min-width: 24px; }

// ==================== 播放控制 ====================
.bar-controls { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.bar-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease; color: inherit; flex-shrink: 0;
  &:hover { background: rgba(0,0,0,0.06); :global(.dark) & { background: rgba(255,255,255,0.08); } }
  .iconfont { font-size: 20px; transition: color 0.2s ease; &:hover { color: var(--accent-color, #888); } }
  &.like-active { color: #ef4444 !important; &:hover { color: #dc2626 !important; } }
}
.bar-btn-play {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 50%; cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  background: rgba(0,0,0,0.06); flex-shrink: 0;
  :global(.dark) & { background: rgba(255,255,255,0.08); }
  &:hover { transform: scale(1.05); background: rgba(0,0,0,0.1); :global(.dark) & { background: rgba(255,255,255,0.12); } }
  .iconfont { font-size: 24px; transition: color 0.2s ease; &:hover { color: var(--accent-color, #888); } }
}

// ==================== 音量（恢复原始） ====================
.audio-volume {
  @apply flex items-center relative flex-shrink-0;
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
    @apply hover:text-[var(--accent-color)];
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

// ==================== 右侧功能按钮 ====================
.bar-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; overflow: hidden; }
.bar-action-btn { flex-shrink: 0; transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 1, 1); }
.bar-actions-hidden .bar-action-btn {
  opacity: 0; transform: translateX(12px); pointer-events: none;
}
$items: 8;
@for $i from 1 through $items {
  .bar-actions-hidden .bar-action-btn:nth-child(#{$items - $i + 1}) {
    transition-delay: #{($i - 1) * 0.03}s;
  }
}

// ==================== 工具类 ====================
.like-active { color: #ef4444 !important; }
.intelligence-active { color: var(--accent-color) !important; }
.disabled-icon { opacity: 0.5; cursor: not-allowed !important; &:hover { color: inherit !important; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

// ==================== 移动端 ====================
.mobile {
  .floating-bar { bottom: 60px; left: 12px; right: 12px; height: 56px; padding: 0 16px; }
  .floating-progress { bottom: 68px; left: 12px; right: 12px; }
  .bar-spacer { display: none; }
  .bar-controls .icon-prev, .bar-controls .icon-next { display: none; }
}
</style>

<style>
.n-slider-handle-indicator { display: none !important; }
</style>
