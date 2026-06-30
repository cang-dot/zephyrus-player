<template>
  <teleport to="body">
    <transition name="typo-fade">
      <div
        v-if="isVisible"
        class="magazine-player"
        :style="dynamicBgStyle"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- 左上角：关闭按钮 -->
        <transition name="ctrl-fade">
          <div v-show="controlsVisible" class="control-left">
            <div class="control-btn" @click="close" title="关闭">
              <i class="ri-arrow-down-s-line"></i>
            </div>
          </div>
        </transition>

        <!-- 右上角：功能按钮组 -->
        <transition name="ctrl-fade">
          <div v-show="controlsVisible" class="control-right">
            <n-popover trigger="click" placement="bottom-end" :z-index="99999" raw to="body">
              <template #trigger>
                <div class="control-btn">
                  <i class="ri-settings-3-line"></i>
                </div>
              </template>
              <LyricSettings />
            </n-popover>
            <div class="control-btn" @click="cyclePlayerStyle" :title="playerStyleLabel">
              <i :class="playerStyleIcon"></i>
            </div>
            <div class="control-btn" @click="toggleColorInversion" title="颜色反转">
              <i class="ri-contrast-2-line"></i>
            </div>
            <div v-if="climax.isInClimax.value" class="control-btn climax-btn" @click="climax.cycleMode()">
              <span class="climax-mode-num">{{ climax.currentMode.value }}</span>
            </div>
            <div class="control-btn" @click="toggleFullScreen">
              <i :class="isFullScreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'"></i>
            </div>
          </div>
        </transition>

        <!-- 永久色块：乐队名 -->
        <transition name="block-enter">
          <div
            v-if="bandBlock && bandName"
            class="color-block permanent-block"
            :style="bandBlockStyle"
          >
            <span class="block-text band-name" :style="{ fontSize: (bandBlock?.fontSize || bandTextFontSize) + 'px' }">{{ bandName }}</span>
          </div>
        </transition>

        <!-- 永久色块：歌曲名 -->
        <transition name="block-enter">
          <div
            v-if="titleBlock && songTitle"
            class="color-block permanent-block"
            :style="titleBlockStyle"
          >
            <span class="block-text song-title" :style="{ fontSize: songTextFontSize + 'px' }">{{ songTitle }}</span>
          </div>
        </transition>

        <!-- 装饰色块 -->
        <transition-group name="block-slide">
          <div
            v-for="block in decorBlocks"
            :key="block.id"
            class="color-block decor-block"
            :style="decorBlockStyle(block)"
          ></div>
        </transition-group>

        <!-- 歌词词组 -->
        <transition-group name="word-anim">
          <div
            v-for="word in currentWords"
            :key="word.id"
            class="lyric-word"
            :style="wordStyle(word)"
          >
            {{ word.text }}
          </div>
        </transition-group>

        <!-- 播放栏不再需要背景遮罩，由 PlayBar 自带背景 -->
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import {
  artistList,
  lrcArray,
  nowIndex,
  playMusic,
} from '@/hooks/MusicHook';
import { useCoverColor } from '@/hooks/useCoverColor';
import { usePlayerStore } from '@/store/modules/player';
import { DEFAULT_LYRIC_CONFIG } from '@/types/lyric';
import { loadClimaxForSong } from '@/api/climax';

import {
  splitLyrics,
  scoreWords,
  calculateFontSize,
  GridLayout,
  layoutWords,
  type WordItem,
  type WordLayout,
} from '@/lib/layoutEngine';
import {
  generateColorBlocks,
  createBandNameBlock,
  createSongTitleBlock,
  getSlideInTransform,
  type ColorBlock,
} from '@/lib/colorBlockEngine';
import { createClimaxDriver } from '@/lib/climaxDriver';

import LyricSettings from './LyricSettings.vue';

// ==================== Props & Emits ====================

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  background: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const playerStore = usePlayerStore();
const { primaryColor, primaryColorRgb, averageColor } = useCoverColor();

// ==================== 状态 ====================

const isVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const controlsVisible = ref(true);
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const isFullScreen = ref(false);
const isColorInverted = ref(false);

// ==================== 歌曲信息 ====================

const bandName = computed(() => {
  const artists = artistList.value;
  if (!artists || artists.length === 0) return '';
  return artists.map((a) => a.name).join(' / ');
});

const songTitle = computed(() => playMusic.value?.name || '');

// ==================== 颜色系统 ====================

const accentColor = computed(() => primaryColor.value || '#22c55e');

const bgColor = computed(() => {
  if (isColorInverted.value) return accentColor.value;
  return '#ffffff';
});

const textColor = computed(() => {
  if (isColorInverted.value) return '#ffffff';
  return accentColor.value;
});

const dynamicBgStyle = computed(() => ({
  '--bg-color': bgColor.value,
  '--text-color': textColor.value,
  '--accent-color': accentColor.value,
  '--accent-rgb': primaryColorRgb.value || '34, 197, 94',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-color)',
}));

// ==================== 高潮驱动 ====================

const climaxSegments = ref<{ start: number; end: number }[]>([]);

const climax = createClimaxDriver(climaxSegments);

// 监听歌曲切换，加载高潮段落
watch(
  () => playMusic.value?.id,
  async (id) => {
    if (!id) {
      climaxSegments.value = [];
      return;
    }
    const result = await loadClimaxForSong(String(id));
    climaxSegments.value = result.segments || [];
  },
  { immediate: true }
);

// 高潮模式下的动态颜色
const climaxColors = computed(() => {
  const state = climax.colorState.value;
  const accent = accentColor.value;
  const avg = averageColor.value;

  switch (climax.currentMode.value) {
    case 1:
      // 模式一：文字和色块颜色在歌曲强调色和封面平均色之间交替
      return {
        text: state.phase ? accent : avg,
        block: state.phase ? avg : accent,
        bg: '#ffffff',
      };
    case 2:
      // 模式二：背景与文字和色块的颜色不断互换
      return state.inverted
        ? { text: '#ffffff', block: '#ffffff', bg: accent }
        : { text: accent, block: accent, bg: '#ffffff' };
    case 3:
      // 模式三：背景颜色在白色、强调色、封面平均色中不断切换
      const bgColors = ['#ffffff', accent, avg];
      const bg = bgColors[state.bgIndex];
      const isLight = bg === '#ffffff';
      return {
        text: isLight ? accent : '#ffffff',
        block: isLight ? accent : '#ffffff',
        bg,
      };
    default:
      return { text: accent, block: accent, bg: '#ffffff' };
  }
});

// ==================== 歌词分词 & 布局 ====================

const currentWords = ref<WordLayout[]>([]);
const decorBlocks = ref<ColorBlock[]>([]);
let grid: GridLayout | null = null;
let prevLyricIndex = -1;

// 永久色块（色块尺寸独立于文字大小）
const bandBlockSize = computed(() => Math.min(window.innerHeight * 0.05, 50));
const songTitleBlockSize = computed(() => Math.min(window.innerHeight * 0.04, 40));

// 文字实际显示字号（标签大小，小于歌词）
const bandTextFontSize = computed(() => Math.min(window.innerHeight * 0.04, 45));
const songTextFontSize = computed(() => Math.min(window.innerHeight * 0.035, 36));

const bandBlock = computed(() =>
  bandName.value ? createBandNameBlock(bandName.value, window.innerWidth, window.innerHeight, bandBlockSize.value) : null
);
// 播放栏高度（动态跟踪）
const playBarHeight = ref(80);

// 定时检测播放栏实际高度
let heightCheckTimer: ReturnType<typeof setInterval> | null = null;

function checkPlayBarHeight() {
  const bar = document.querySelector('.music-play-bar');
  if (bar) {
    const h = bar.getBoundingClientRect().height;
    playBarHeight.value = Math.max(6, h);
  }
}

onMounted(() => {
  heightCheckTimer = setInterval(checkPlayBarHeight, 300);
});

onBeforeUnmount(() => {
  if (heightCheckTimer) clearInterval(heightCheckTimer);
});

// 歌曲名色块位置：对齐播放栏顶部
const titleBlock = computed(() =>
  songTitle.value ? createSongTitleBlock(songTitle.value, window.innerWidth, window.innerHeight, songTitleBlockSize.value, playBarHeight.value) : null
);

// 重新布局当前歌词
function relayoutLyric(index: number) {
  if (index === prevLyricIndex) return;
  prevLyricIndex = index;

  const line = lrcArray.value[index];
  if (!line?.text) {
    currentWords.value = [];
    decorBlocks.value = [];
    return;
  }

  // 分词
  const words = splitLyrics(line.text);
  if (words.length === 0) return;

  // 评分
  const scores = scoreWords(words);

  // 构建 WordItem
  const items: WordItem[] = words.map((text, i) => ({
    text,
    importance: scores[i],
    fontSize: calculateFontSize(scores[i], 28, 64),
  }));

  // 创建网格
  const w = window.innerWidth;
  const h = window.innerHeight;
  grid = new GridLayout(w, h, 12, 8);

  // 标记永久色块占用的格子
  if (bandBlock.value) {
    const b = bandBlock.value;
    grid.occupyArea(
      Math.floor(b.x / grid.cellW),
      Math.floor(b.y / grid.cellH),
      Math.ceil(b.width / grid.cellW),
      Math.ceil(b.height / grid.cellH)
    );
  }
  if (titleBlock.value) {
    const b = titleBlock.value;
    grid.occupyArea(
      Math.floor(b.x / grid.cellW),
      Math.floor(b.y / grid.cellH),
      Math.ceil(b.width / grid.cellW),
      Math.ceil(b.height / grid.cellH)
    );
  }

  // 分配歌词位置
  const layouts = layoutWords(items, grid, 2);
  currentWords.value = layouts;

  // 生成装饰色块（每句 2-4 个）
  const blockCount = Math.min(4, Math.max(2, Math.floor(Math.random() * 3) + 2));
  const permanentBlocks: ColorBlock[] = [];
  if (bandBlock.value) permanentBlocks.push(bandBlock.value);
  if (titleBlock.value) permanentBlocks.push(titleBlock.value);
  decorBlocks.value = generateColorBlocks(grid, layouts, permanentBlocks, blockCount);
}

// 监听歌词切换
watch(nowIndex, (index) => {
  relayoutLyric(index);
});

// 切歌时清空歌词并重置状态
watch(() => playMusic.value?.id, () => {
  currentWords.value = [];
  decorBlocks.value = [];
  prevLyricIndex = -1;
  // 下一帧重新布局（等 lrcArray 更新后）
  nextTick(() => {
    relayoutLyric(nowIndex.value);
  });
});

// 窗口尺寸变化时重新布局
function handleResize() {
  prevLyricIndex = -1;
  relayoutLyric(nowIndex.value);
}

// ==================== 样式计算 ====================

const bandBlockStyle = computed(() => {
  if (!bandBlock.value) return {};
  const b = bandBlock.value;
  const colors = climax.isInClimax.value ? climaxColors.value : null;
  // 反转时：色块白色，文字强调色
  if (isColorInverted.value) {
    return {
      left: `${b.x}px`, top: `${b.y}px`,
      width: `${b.width}px`, height: `${b.height}px`,
      backgroundColor: '#ffffff',
      color: accentColor.value,
    };
  }
  return {
    left: `${b.x}px`, top: `${b.y}px`,
    width: `${b.width}px`, height: `${b.height}px`,
    backgroundColor: colors ? colors.block : accentColor.value,
    color: colors ? colors.text : '#ffffff',
  };
});

const titleBlockStyle = computed(() => {
  if (!titleBlock.value) return {};
  const b = titleBlock.value;
  const colors = climax.isInClimax.value ? climaxColors.value : null;
  if (isColorInverted.value) {
    return {
      left: `${b.x}px`, top: `${b.y}px`,
      width: `${b.width}px`, height: `${b.height}px`,
      backgroundColor: '#ffffff',
      color: accentColor.value,
    };
  }
  return {
    left: `${b.x}px`, top: `${b.y}px`,
    width: `${b.width}px`, height: `${b.height}px`,
    backgroundColor: colors ? colors.block : accentColor.value,
    color: colors ? colors.text : '#ffffff',
  };
});

function decorBlockStyle(block: ColorBlock) {
  const colors = climax.isInClimax.value ? climaxColors.value : null;
  const bgColor = isColorInverted.value ? '#ffffff' : (colors ? colors.block : accentColor.value);
  return {
    left: `${block.x}px`, top: `${block.y}px`,
    width: `${block.width}px`, height: `${block.height}px`,
    backgroundColor: bgColor,
    transform: getSlideInTransform(block.edge),
    animationDelay: `${block.delay}ms`,
    '--slide-from': getSlideInTransform(block.edge),
  };
}

function wordStyle(word: WordLayout) {
  const colors = climax.isInClimax.value ? climaxColors.value : null;
  return {
    left: `${word.x}px`,
    top: `${word.y}px`,
    fontSize: `${word.fontSize}px`,
    color: colors ? colors.text : textColor.value,
    animationDelay: `${word.delay}ms`,
  };
}

// ==================== 播放器样式循环 ====================

const playerStyles = [
  { key: 'default', icon: 'ri-music-2-line', label: '默认' },
  { key: 'classic', icon: 'ri-disc-line', label: '经典' },
  { key: 'stage', icon: 'ri-live-line', label: '舞台' },
  { key: 'magazine', icon: 'ri-layout-masonry-line', label: '杂志' },
];

const currentStyleIndex = computed(() => {
  const saved = localStorage.getItem('music-full-config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return playerStyles.findIndex((s) => s.key === (parsed.playerStyle || 'default'));
    } catch { return 0; }
  }
  return 0;
});

const playerStyleIcon = computed(() => playerStyles[currentStyleIndex.value]?.icon || playerStyles[0].icon);
const playerStyleLabel = computed(() => playerStyles[currentStyleIndex.value]?.label || playerStyles[0].label);

function cyclePlayerStyle() {
  const next = (currentStyleIndex.value + 1) % playerStyles.length;
  const newStyle = playerStyles[next].key;
  const saved = localStorage.getItem('music-full-config');
  const config = saved ? JSON.parse(saved) : {};
  config.playerStyle = newStyle;
  localStorage.setItem('music-full-config', JSON.stringify(config));
  window.dispatchEvent(new Event('music-full-config-updated'));
}

// ==================== 交互 ====================

function toggleColorInversion() {
  isColorInverted.value = !isColorInverted.value;
}

function close() {
  playerStore.setMusicFull(false);
  isVisible.value = false;
}

async function toggleFullScreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      isFullScreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullScreen.value = false;
    }
  } catch {}
}

function handleFullScreenChange() {
  isFullScreen.value = !!document.fullscreenElement;
}

function handleMouseMove() {
  controlsVisible.value = true;
  resetHideTimer();
}

function handleMouseLeave() {
  resetHideTimer();
}

function resetHideTimer() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { controlsVisible.value = false; }, 3000);
}

// ==================== 生命周期 ====================

onMounted(() => {
  resetHideTimer();
  document.addEventListener('fullscreenchange', handleFullScreenChange);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  document.removeEventListener('fullscreenchange', handleFullScreenChange);
  window.removeEventListener('resize', handleResize);
  climax.stopListening();
  if (document.fullscreenElement) document.exitFullscreen();
});
</script>

<style scoped lang="scss">
.typo-fade-enter-active { transition: opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1); }
.typo-fade-leave-active { transition: opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.typo-fade-enter-from, .typo-fade-leave-to { opacity: 0; }

.ctrl-fade-enter-active {
  transition: opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1),
              transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.ctrl-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.32, 0.72, 0, 1),
              transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
.ctrl-fade-enter-from, .ctrl-fade-leave-to { opacity: 0; transform: translateY(-16px); }

.magazine-player {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 9998;
  cursor: default;
  font-family: var(--current-font-family, 'Inter', system-ui, sans-serif);
}

// ==================== 控制按钮 ====================

.control-left {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 9999;
}

.control-right {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(var(--accent-rgb), 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);

  i { font-size: 18px; }

  &:hover {
    background: rgba(var(--accent-rgb), 0.2);
    transform: scale(1.1);
  }
  &:active { transform: scale(0.95); }
}

.climax-btn {
  background: rgba(var(--accent-rgb), 0.3);
  border-color: rgba(var(--accent-rgb), 0.5);

  .climax-mode-num {
    font-size: 14px;
    font-weight: 700;
  }
}

// ==================== 色块 ====================

.color-block {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.permanent-block {
  padding: 12px 20px;
  transition: background-color 0.3s, color 0.3s;
}

.block-text {
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
}

.band-name {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  overflow: visible;
}

.song-title {
  white-space: nowrap;
}

// ==================== 底部播放栏背景遮罩 ====================

.play-bar-bg {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 0;
  background: rgba(0, 0, 0, 0.08);
  pointer-events: none;
}

// 装饰色块入场动画
.block-enter-enter-active { transition: all 0.6s cubic-bezier(0.32, 0.72, 0, 1); }
.block-enter-leave-active { transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.block-enter-enter-from { opacity: 0; transform: translateX(-30px); }
.block-enter-leave-to { opacity: 0; transform: translateX(30px); }

.decor-block {
  transition: background-color 0.3s;
  animation: block-slide-in 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes block-slide-in {
  from { transform: var(--slide-from); opacity: 0; }
  to { transform: translate(0, 0); opacity: 1; }
}

.block-slide-enter-active {
  animation: block-slide-in 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
.block-slide-leave-active {
  animation: block-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) reverse forwards;
}

// ==================== 歌词词组 ====================

.lyric-word {
  position: absolute;
  z-index: 20;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  transition: color 0.3s;
  animation: word-enter 0.6s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes word-enter {
  from {
    filter: blur(12px);
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    filter: blur(0);
    transform: scale(1);
    opacity: 1;
  }
}

.word-anim-enter-active {
  animation: word-enter 0.6s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
.word-anim-leave-active {
  animation: word-enter 0.3s cubic-bezier(0.32, 0.72, 0, 1) reverse forwards;
}
</style>
