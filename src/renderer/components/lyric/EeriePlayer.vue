<template>
  <teleport to="body">
    <transition name="eerie-fade">
      <div
        v-if="isVisible"
        class="eerie-player"
        :style="{
          '--accent-color': accentColor,
          '--accent-dark': accentDark,
          '--bg-color': bgColor,
        }"
        @click="handleTapToggle"
      >
        <!-- 背景层：噪点 / 裂纹 -->
        <canvas ref="bgCanvasRef" class="bg-canvas"></canvas>

        <!-- 报纸滤镜层 -->
        <transition-group name="newspaper-flash" tag="div" class="newspaper-layer">
          <div
            v-for="np in activeNewspapers"
            :key="np.id"
            class="newspaper-item"
            :style="{ backgroundImage: `url(${np.src})` }"
          ></div>
        </transition-group>

        <!-- 歌词层 -->
        <div class="lyrics-layer">
          <!-- 高潮模式：只显示重点词 -->
          <template v-if="isInClimax && climaxKeywords.length > 0">
            <div class="climax-keywords">
              <span
                v-for="(kw, i) in climaxKeywords"
                :key="i"
                class="keyword-char"
                :style="{
                  color: accentColor,
                  fontSize: 'clamp(60px, 12vw, 140px)',
                }"
              >{{ kw.text }}</span>
            </div>
          </template>

          <!-- 正常模式：哑铃型书法字体 -->
          <template v-else-if="currentChars.length > 0">
            <div class="calligraphy-line">
              <span
                v-for="(charData, i) in currentChars"
                :key="i"
                class="calligraphy-char"
                :style="{
                  fontSize: charData.size + 'px',
                  color: accentColor,
                  marginLeft: charData.margin + 'px',
                  marginRight: charData.margin + 'px',
                }"
              >{{ charData.char }}</span>
            </div>
          </template>

          <!-- 空行占位 -->
          <div v-else class="lyrics-empty"></div>
        </div>

        <!-- 顶部控件（tap 弹出） -->
        <transition name="ctrl-fade">
          <div v-show="controlsVisible" class="top-controls no-toggle">
            <div class="ctrl-btn" @click="close">
              <i class="ri-arrow-down-s-line"></i>
            </div>
            <div style="flex:1"></div>
            <div class="ctrl-btn" @click="cycleStyle">
              <i class="ri-shuffle-line"></i>
            </div>
          </div>
        </transition>

        <!-- 底部控件（tap 弹出） -->
        <transition name="ctrl-fade">
          <div v-show="controlsVisible" class="bottom-controls no-toggle">
            <div class="progress-row">
              <span class="time-text">{{ formatTime(currentTime) }}</span>
              <div class="progress-bar-bg" @click="handleSeek">
                <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <span class="time-text">{{ formatTime(duration) }}</span>
            </div>
            <div class="control-buttons">
              <div class="ctrl-btn" @click="handlePrev">
                <i class="ri-skip-back-fill"></i>
              </div>
              <div class="ctrl-btn play-btn" @click="handlePlayPause">
                <i :class="isPlaying ? 'ri-pause-fill' : 'ri-play-fill'"></i>
              </div>
              <div class="ctrl-btn" @click="handleNext">
                <i class="ri-skip-forward-fill"></i>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
/**
 * EeriePlayer — 诡谲模式播放器
 *
 * 设计要素：
 * - 书法字体，哑铃型字号布局（两端大中间小，挤在一起）
 * - 斑驳磨损效果（SVG filter）
 * - 高潮时段只显示重点词，占满屏幕
 * - 前奏：强调色背景 + 噪点
 * - 正片：黑色背景 + 随机裂纹（每次切歌词重绘）
 * - 报纸滤镜：随机闪现 / 高潮轮播
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { lrcArray, nowIndex, playMusic } from '@/hooks/MusicHook';
import { useCoverColor } from '@/hooks/useCoverColor';
import { usePlayerStore } from '@/store/modules/player';
import { useStyleEngineStore } from '@/store/modules/styleEngine';
import { secondToMinute } from '@/utils';

import { useTapToggle } from '@/composables/useTapToggle';
import { drawCracks } from '@/lib/crackRenderer';
import { drawNoise, startNoiseAnimation } from '@/lib/noiseCanvas';

// 报纸纹理清单
import newspaperManifest from '@/assets/textures/newspaper/manifest.json';

// ==================== Props ====================

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  background: { type: String, default: '' },
  overlayMode: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

// ==================== Store & Hooks ====================

const playerStore = usePlayerStore();
const styleEngine = useStyleEngineStore();
const { primaryColor, averageColor } = useCoverColor();
const { controlsVisible, handleTapToggle } = useTapToggle();

// ==================== 状态 ====================

const isVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

const isPlaying = computed(() => playerStore.isPlay);
const currentTime = computed(() => playerStore.playingTime || 0);
const duration = computed(() => (playMusic.value?.dt || playMusic.value?.duration || 0) / 1000);
const progressPercent = computed(() => {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
});

const isInClimax = computed(() => styleEngine.isInClimax);

// ==================== 颜色 ====================

const accentColor = computed(() => primaryColor.value || '#888888');

/** 强调色变暗（用于背景） */
const accentDark = computed(() => {
  // 将 primaryColor 变暗 60%
  const rgb = primaryColor.value?.match(/\d+/g);
  if (!rgb) return '#333333';
  const dim = rgb.map((v: string) => Math.round(Number(v) * 0.4)).join(', ');
  return `rgb(${dim})`;
});

/** 背景色：前奏=强调色，正片=黑色 */
const isIntro = computed(() => nowIndex.value <= 0);
const bgColor = computed(() => {
  if (isIntro.value) return accentDark.value;
  return '#0a0a0a';
});

// ==================== 歌词拆字 + 哑铃型字号 ====================

interface CharData {
  char: string;
  size: number;
  margin: number;
}

const currentChars = computed<CharData[]>(() => {
  const idx = nowIndex.value;
  if (idx < 0 || idx >= lrcArray.value.length) return [];

  const text = lrcArray.value[idx]?.text || '';
  if (!text) return [];

  const chars = Array.from(text);
  const n = chars.length;
  if (n === 0) return [];

  const maxSize = 52;
  const minSize = 20;

  return chars.map((char, i) => {
    // 哑铃型：两端大，中间小
    // size = min + (max - min) * sin(π * i/(n-1))
    let ratio: number;
    if (n === 1) {
      ratio = 1;
    } else {
      ratio = Math.sin(Math.PI * (i / (n - 1)));
    }
    const size = minSize + (maxSize - minSize) * ratio;

    // 负字间距，挤在一起
    const margin = -size * 0.1;

    return { char, size, margin };
  });
});

// ==================== 高潮重点词 ====================

const climaxKeywords = computed(() => {
  return styleEngine.currentLineKeywords || [];
});

// ==================== 背景画布 ====================

const bgCanvasRef = ref<HTMLCanvasElement | null>(null);
let noiseStopFn: (() => void) | null = null;
let crackDrawn = false;

/** 初始化/更新背景 */
function updateBackground() {
  const canvas = bgCanvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  // 清空
  ctx.clearRect(0, 0, w, h);

  // 填充背景色
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(0, 0, w, h);

  // 前奏：噪点
  if (isIntro.value) {
    // 停止裂纹，启动噪点动画
    if (noiseStopFn) noiseStopFn();
    noiseStopFn = startNoiseAnimation(ctx, w, h, 0.15, 12);
  } else {
    // 正片：停止噪点，绘制裂纹
    if (noiseStopFn) {
      noiseStopFn();
      noiseStopFn = null;
    }

    // 高潮不画裂纹
    if (!isInClimax.value) {
      drawCracks(ctx, w, h, {
        count: 6 + Math.floor(Math.random() * 4),
        opacity: 0.12,
        color: accentColor.value,
        maxDepth: 4,
        segmentLength: [40, 100],
      });
    }
  }

  crackDrawn = true;
}

// 切歌词时重绘背景
watch(nowIndex, () => {
  nextTick(() => updateBackground());
});

// 高潮状态变化时重绘
watch(isInClimax, () => {
  nextTick(() => updateBackground());
});

// 可见时初始化
watch(isVisible, (v) => {
  if (v) {
    nextTick(() => updateBackground());
  } else {
    if (noiseStopFn) {
      noiseStopFn();
      noiseStopFn = null;
    }
  }
});

// ==================== 报纸滤镜效果 ====================

interface NewspaperItem {
  id: number;
  src: string;
}

const activeNewspapers = ref<NewspaperItem[]>([]);
let newspaperIdCounter = 0;
let climaxNewspaperTimer: ReturnType<typeof setInterval> | null = null;
let randomNewspaperTimer: ReturnType<typeof ReturnType> | null = null;

const newspaperTextures = (newspaperManifest as any).textures || [];
let climaxNewspaperIndex = 0;

/** 闪现单张报纸（约0.5s） */
function flashNewspaper(src: string) {
  const id = newspaperIdCounter++;
  activeNewspapers.value.push({ id, src });

  setTimeout(() => {
    activeNewspapers.value = activeNewspapers.value.filter((n) => n.id !== id);
  }, 500);
}

/** 高潮轮播报纸 */
function startClimaxNewspapers() {
  if (climaxNewspaperTimer) return;
  if (newspaperTextures.length === 0) return;

  const cycle = () => {
    const tex = newspaperTextures[climaxNewspaperIndex % newspaperTextures.length];
    flashNewspaper(tex.src);
    climaxNewspaperIndex++;
  };

  cycle(); // 立即执行一次
  climaxNewspaperTimer = setInterval(cycle, 500);
}

function stopClimaxNewspapers() {
  if (climaxNewspaperTimer) {
    clearInterval(climaxNewspaperTimer);
    climaxNewspaperTimer = null;
  }
}

/** 正片随机闪现报纸（10% 概率/每次切歌词） */
function maybeRandomNewspaper() {
  if (isInClimax.value) return;
  if (newspaperTextures.length === 0) return;
  if (Math.random() < 0.1) {
    const tex = newspaperTextures[Math.floor(Math.random() * newspaperTextures.length)];
    flashNewspaper(tex.src);
  }
}

// 监听高潮状态
watch(isInClimax, (climax) => {
  if (climax) {
    startClimaxNewspapers();
  } else {
    stopClimaxNewspapers();
  }
});

// 监听切歌词
watch(nowIndex, () => {
  maybeRandomNewspaper();
});

// ==================== 播放控制 ====================

function close() {
  isVisible.value = false;
}

function handlePrev() { playerStore.prevPlay(); }
function handleNext() { playerStore.nextPlay(); }
function handlePlayPause() { playerStore.setPlay(playMusic.value); }

function handleSeek(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  playerStore.setPlayTime(percent * duration.value);
}

function cycleStyle() {
  window.dispatchEvent(new CustomEvent('music-full-config-updated'));
}

function formatTime(s: number): string {
  return secondToMinute(s);
}

// ==================== 生命周期 ====================

onBeforeUnmount(() => {
  if (noiseStopFn) noiseStopFn();
  stopClimaxNewspapers();
});
</script>

<style lang="scss" scoped>
.eerie-player {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-color);
}

/* 背景画布 */
.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 报纸滤镜层 */
.newspaper-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.newspaper-item {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  mix-blend-mode: overlay;
}

/* 歌词层 */
.lyrics-layer {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}

/* 书法歌词行 */
.calligraphy-line {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 100%;
}

.calligraphy-char {
  font-family: 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
  font-weight: 700;
  line-height: 1.1;
  /* 斑驳磨损效果 */
  filter: url(#eerie-worn) drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
  transition: color 0.3s var(--m-ease-out, ease);
  text-shadow: 0 0 2px currentColor;
}

/* 高潮重点词 */
.climax-keywords {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.1em;
  width: 100%;
}

.keyword-char {
  font-family: 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 20px currentColor, 0 0 4px currentColor;
  animation: keyword-pulse 0.8s var(--m-ease-out, ease) infinite alternate;
}

@keyframes keyword-pulse {
  to {
    text-shadow: 0 0 30px currentColor, 0 0 8px currentColor;
  }
}

.lyrics-empty {
  width: 1px;
  height: 1px;
}

/* 顶部控件 */
.top-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: calc(var(--safe-area-inset-top, 0px) + 16px) 20px 0;
  z-index: 10;

  .ctrl-btn {
    @apply flex items-center justify-center;
    @apply w-10 h-10 rounded-full;
    @apply text-xl;
    color: #f0ece4;
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: transform var(--m-duration-press, 160ms) var(--m-ease-out, ease-out);
    &:active { transform: scale(0.97); }
  }
}

/* 底部控件 */
.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 24px calc(var(--safe-area-inset-bottom, 0px) + 32px);
  z-index: 10;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  .time-text {
    font-size: 12px;
    color: #666;
    flex-shrink: 0;
    min-width: 36px;
  }

  .progress-bar-bg {
    flex: 1;
    height: 2px;
    background: #333;
    border-radius: 1px;
    position: relative;
    cursor: pointer;

    .progress-bar-fill {
      position: absolute;
      left: 0; top: 0;
      height: 100%;
      background: var(--accent-color);
      border-radius: 1px;
      transition: width 0.1s linear;
    }
  }
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  .ctrl-btn {
    @apply flex items-center justify-center rounded-full cursor-pointer;
    background: #444;
    width: 42px; height: 42px;
    transition: transform var(--m-duration-press, 160ms) var(--m-ease-out, ease-out);

    i { font-size: 18px; color: #f0ece4; }
    &:active { transform: scale(0.97); }

    &.play-btn {
      width: 52px; height: 52px;
      background: var(--accent-color);
      i { font-size: 24px; color: #fff; }
    }
  }
}

/* 过渡动画 */
.eerie-fade-enter-active,
.eerie-fade-leave-active {
  transition: opacity 0.3s var(--m-ease-out, ease);
}
.eerie-fade-enter-from,
.eerie-fade-leave-to { opacity: 0; }

.ctrl-fade-enter-active,
.ctrl-fade-leave-active {
  transition: opacity 0.2s var(--m-ease-out, ease);
}
.ctrl-fade-enter-from,
.ctrl-fade-leave-to { opacity: 0; }

.newspaper-flash-enter-active {
  transition: opacity 0.15s ease;
}
.newspaper-flash-leave-active {
  transition: opacity 0.15s ease;
}
.newspaper-flash-enter-from,
.newspaper-flash-leave-to { opacity: 0; }

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .keyword-char { animation: none; }
  .eerie-fade-enter-active, .eerie-fade-leave-active,
  .ctrl-fade-enter-active, .ctrl-fade-leave-active {
    transition: opacity 0.2s ease;
  }
}
</style>
