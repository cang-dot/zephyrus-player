<template>
  <div
    class="lyric-window"
    :class="[lyricSetting.theme, { locked: lyricSetting.isLock }]"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 控制栏 -->
    <div class="control-bar" :class="{ show: showControls }">
      <div class="control-bar__left">
        <span class="music-icon">♪</span>
        <span class="song-name">{{ staticData.playMusic?.name || '' }}</span>
      </div>
      <div class="control-bar__center">
        <button class="ctrl-btn" title="快退 0.5s" @click="skipBackward">
          <span class="skip-label">-0.5s</span>
        </button>
        <button class="ctrl-btn" title="快进 0.5s" @click="skipForward">
          <span class="skip-label">+0.5s</span>
        </button>
        <button class="ctrl-btn" @click="handlePrev">
          <i class="ri-skip-back-fill"></i>
        </button>
        <button class="ctrl-btn play-btn" @click="handlePlayPause">
          <i :class="dynamicData.isPlay ? 'ri-pause-fill' : 'ri-play-fill'"></i>
        </button>
        <button class="ctrl-btn" @click="handleNext">
          <i class="ri-skip-forward-fill"></i>
        </button>
      </div>
      <div class="control-bar__right">
        <button class="ctrl-btn" @click="handleLock">
          <i :class="lyricSetting.isLock ? 'ri-lock-line' : 'ri-lock-unlock-line'"></i>
        </button>
        <button class="ctrl-btn" @click="handleClose">
          <i class="ri-close-line"></i>
        </button>
      </div>
    </div>

    <!-- 歌手信息 -->
    <div class="artist-info" v-if="songArtist">
      {{ songName }} - {{ songArtist }}
    </div>

    <!-- 当前歌词 -->
    <div class="current-lyric">
      <div v-if="currentLyricText" class="lyric-text" :style="{ fontSize: `${fontSize}px` }">
        <div
          v-if="currentWordByWord && currentWords.length > 0"
          class="word-by-word"
        >
          <span
            v-for="(word, i) in currentWords"
            :key="i"
            class="lyric-word"
            :style="getWordStyle(currentIndex, i, word)"
          >{{ word.text }}</span>
        </div>
        <span v-else class="lyric-text-inner" :style="getLyricStyle(currentIndex)">
          {{ currentLyricText }}
        </span>
      </div>
      <div v-else class="lyric-empty">无歌词</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

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
  getWordStyle,
  getLyricStyle
} = useLyricState(lyricSetting);
const {
  showControls,
  handlePlayPause,
  handlePrev,
  handleNext,
  handleLock,
  handleClose,
  handleMouseEnter,
  handleMouseLeave,
  skipForward,
  skipBackward
} = useLyricControls(lyricSetting);
const { handleMouseDown } = useLyricDrag(lyricSetting);

// ── 计算属性 ──
const songName = computed(() => staticData.value.playMusic?.name || '');
const songArtist = computed(() => {
  const song = staticData.value.playMusic;
  if (!song) return '';
  const artists = song.ar || song.artists || [];
  return artists.map((a: any) => a.name).join(' / ');
});

const currentLyricText = computed(() => {
  const arr = staticData.value.lrcArray;
  const idx = currentIndex.value;
  if (arr && idx >= 0 && idx < arr.length) {
    return arr[idx]?.text || '';
  }
  return '';
});

const currentWordByWord = computed(() => {
  const arr = staticData.value.lrcArray;
  const idx = currentIndex.value;
  if (arr && idx >= 0 && idx < arr.length) {
    return arr[idx]?.hasWordByWord && arr[idx]?.words && arr[idx]!.words!.length > 0;
  }
  return false;
});

const currentWords = computed(() => {
  const arr = staticData.value.lrcArray;
  const idx = currentIndex.value;
  if (arr && idx >= 0 && idx < arr.length) {
    return arr[idx]?.words || [];
  }
  return [];
});
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
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
  overflow: hidden;
  position: relative;

  &.light {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(0, 0, 0, 0.08);
  }

  &.locked .control-bar {
    opacity: 0;
    pointer-events: none;
  }

  &:hover .control-bar.show {
    opacity: 1;
  }
}

// 控制栏
.control-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  z-index: 10;
  opacity: 1;
  transition: opacity 0.25s ease;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__center {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.music-icon {
  font-size: 16px;
  color: var(--highlight-color, #1db954);
}

.song-name {
  font-size: 13px;
  color: var(--highlight-color, #1db954);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-size: 18px;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .skip-label {
    font-size: 11px;
    font-weight: 500;
  }
}

.light .ctrl-btn {
  color: rgba(0, 0, 0, 0.6);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #000;
  }
}

// 歌手信息
.artist-info {
  font-size: 16px;
  font-weight: 600;
  color: var(--highlight-color, #1db954);
  text-align: center;
  margin-bottom: 12px;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 当前歌词
.current-lyric {
  text-align: center;
  max-width: 85%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lyric-text {
  line-height: 1.4;
  color: #fff;
  transition: all 0.3s ease;
}

.light .lyric-text {
  color: #1a1a1a;
}

.lyric-word {
  display: inline-block;
  transition: color 0.15s ease;
}

.lyric-text-inner {
  display: inline;
}

.lyric-empty {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

.light .lyric-empty {
  color: rgba(0, 0, 0, 0.3);
}
</style>
