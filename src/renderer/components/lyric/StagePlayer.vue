<template>
  <teleport to="body">
    <transition name="stage-fade">
      <div
        v-if="isVisible"
        class="stage-player"
        :style="{ '--accent': accentColor, '--accent-rgb': accentColorRgb }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- 背景层：封面模糊 + 烟雾 -->
        <div class="background-cover" :style="backgroundCoverStyle"></div>
        <div class="background-smoke smoke-1" :style="smokeStyle1"></div>
        <div class="background-smoke smoke-2" :style="smokeStyle2"></div>
        <div class="background-smoke smoke-3" :style="smokeStyle3"></div>
        <div class="background-smoke smoke-4" :style="smokeStyle4"></div>
        <div class="background-vignette"></div>
        <!-- 浮动粒子 -->
        <div class="particles-container" ref="particlesContainer"></div>

        <!-- 左上角：关闭按钮 -->
        <transition name="close-fade">
          <div v-show="controlsVisible" class="control-left">
            <div class="control-btn" @click="close" title="关闭舞台">
              <i class="ri-arrow-down-s-line"></i>
            </div>
          </div>
        </transition>

        <!-- 右上角：功能按钮组 -->
        <transition name="close-fade">
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
            <div class="control-btn" @click="toggleFullScreen">
              <i :class="isFullScreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'"></i>
            </div>
          </div>
        </transition>

        <!-- 顶部：歌曲信息 -->
        <transition name="info-fade">
          <div v-show="controlsVisible" class="song-info-top">
            <div class="song-name">{{ playMusic?.name }}</div>
            <div class="song-artist">
              <span
                v-for="(item, index) in artistList"
                :key="index"
                class="artist-name"
              >
                {{ item.name }}{{ index < artistList.length - 1 ? ' / ' : '' }}
              </span>
            </div>
          </div>
        </transition>

        <!-- 中央：歌词显示区 -->
        <div class="lyric-container">
          <div
            ref="lyricRef"
            class="single-lyric"
            :style="lyricStyle"
          >
            {{ displayText }}
          </div>
          <!-- 翻译歌词 -->
          <transition name="tr-fade">
            <div
              v-if="currentLine?.trText && controlsVisible"
              class="lyric-translation"
            >
              {{ currentLine.trText }}
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
/**
 * StagePlayer 舞台播放器组件
 *
 * 全屏沉浸式歌词播放界面，包含：
 * - 封面取色烟雾背景
 * - 封面取色强调色（歌词/按钮）
 * - 普通/节奏两种歌词动画模式
 * - 3秒无鼠标操作自动隐藏控件
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import gsap from 'gsap';

import {
  allTime,
  artistList,
  lrcArray,
  nowIndex,
  nowTime,
  playMusic,
  setAudioTime
} from '@/hooks/MusicHook';
import { usePlayerStore } from '@/store/modules/player';
import type { IWordData, ILyricText } from '@/types/music';
import { getImgUrl } from '@/utils';

// 舞台动画预设库
import { normalAnimations, powerAnimations, softAnimations } from '@/utils/stageAnimations';
import { AnimationSelector } from '@/utils/animationSelector';
import { DEFAULT_LYRIC_CONFIG } from '@/types/lyric';

import LyricSettings from './LyricSettings.vue';

const animationSelector = new AnimationSelector(7);

// 从 localStorage 读取动画强度设置
const animationIntensity = computed<'soft' | 'normal' | 'power'>(() => {
  try {
    const saved = localStorage.getItem('music-full-config');
    if (saved) {
      const config = JSON.parse(saved);
      return config.animationIntensity || 'normal';
    }
  } catch {}
  return 'normal';
});

// 根据强度获取动画集合
const currentAnimations = computed(() => {
  switch (animationIntensity.value) {
    case 'soft': return softAnimations;
    case 'power': return powerAnimations;
    default: return normalAnimations;
  }
});

// ==================== Props & Emits ====================

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  background: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

const playerStore = usePlayerStore();

// ==================== 响应式状态 ====================

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const currentLine = computed<ILyricText | undefined>(() => lrcArray.value[nowIndex.value]);
const currentLineKey = computed(() => `${nowIndex.value}-${currentLine.value?.text}`);

const controlsVisible = ref(true);
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let prevLineIndex = -1;

// ==================== 播放器样式切换 ====================

const playerStyles = [
  { key: 'default' as const, icon: 'ri-music-2-line', label: '默认' },
  { key: 'classic' as const, icon: 'ri-disc-line', label: '经典' },
  { key: 'stage' as const, icon: 'ri-live-line', label: '舞台' }
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

// ==================== 封面取色 ====================

const accentColor = ref('rgb(220, 200, 170)');
const accentColorRgb = ref('220, 200, 170');
const smokeColor = ref('#c8b896');
const smokeColor2 = ref('#b8a886');

watch(
  () => playMusic.value?.picUrl,
  async (picUrl) => {
    if (!picUrl) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImgUrl(picUrl, '50y50');
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;

      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      const pixelCount = data.length / 4;
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);

      // 强调色：偏暖金色调，高亮度
      // 提高红绿比例，降低蓝色，生成温暖的金色
      const warmR = Math.min(255, Math.round(r * 1.5 + 30));
      const warmG = Math.min(255, Math.round(g * 1.3 + 20));
      const warmB = Math.min(255, Math.round(b * 0.8 + 40));
      accentColor.value = `rgb(${warmR}, ${warmG}, ${warmB})`;
      accentColorRgb.value = `${warmR}, ${warmG}, ${warmB}`;

      // 烟雾色：更亮
      const sbr = Math.min(255, Math.round(r * 1.6));
      const sbg = Math.min(255, Math.round(g * 1.5));
      const sbb = Math.min(255, Math.round(b * 1.2));
      smokeColor.value = `rgb(${sbr}, ${sbg}, ${sbb})`;
      smokeColor2.value = `rgb(${Math.min(255, sbr - 20)}, ${Math.min(255, sbg - 15)}, ${Math.min(255, sbb - 10)})`;
    } catch {}
  },
  { immediate: true }
);

const backgroundCoverStyle = computed(() => {
  const picUrl = playMusic.value?.picUrl;
  if (!picUrl) return {};
  return {
    backgroundImage: `url(${getImgUrl(picUrl, '1000y1000')})`,
    filter: 'blur(50px) brightness(1) saturate(1.4)',
    opacity: 0.35,
    transform: 'scale(1.2)'
  };
});

const smokeStyle1 = computed(() => ({
  background: `radial-gradient(ellipse at 25% 75%, ${smokeColor.value} 0%, transparent 55%)`
}));

const smokeStyle2 = computed(() => ({
  background: `radial-gradient(ellipse at 75% 25%, ${smokeColor2.value} 0%, transparent 50%)`
}));

const smokeStyle3 = computed(() => ({
  background: `radial-gradient(ellipse at 50% 50%, ${smokeColor.value} 0%, transparent 45%)`
}));

const smokeStyle4 = computed(() => ({
  background: `radial-gradient(ellipse at 80% 80%, ${smokeColor2.value} 0%, transparent 40%)`
}));

// ==================== 歌词样式（响应式字号） ====================

const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

function updateWindowSize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

onMounted(() => {
  window.addEventListener('resize', updateWindowSize);
  updateWindowSize();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWindowSize);
});

// 字号相对于窗口高度：约 5.5% 的高度，限制在 28px ~ 72px 之间
const lyricFontSize = computed(() => {
  const vh = windowHeight.value;
  const size = Math.round(vh * 0.055);
  return Math.max(28, Math.min(72, size));
});

const lyricStyle = computed(() => ({
  fontFamily: 'var(--current-font-family)',
  fontSize: `${lyricFontSize.value}px`,
  fontWeight: 'var(--lyric-font-weight, 700)',
  letterSpacing: 'var(--lyric-letter-spacing, 0px)',
  lineHeight: 'var(--lyric-letter-height, 1.4)'
}));

// ==================== 计算属性 ====================

const isFullScreen = ref(false);
const lyricRef = ref<HTMLElement | null>(null);
const particlesContainer = ref<HTMLElement | null>(null);
const displayText = ref('');
let currentTimeline: gsap.core.Timeline | null = null;
let particleInterval: ReturnType<typeof setInterval> | null = null;
let lastProcessedIndex = -1;
let pendingRafId: number | null = null;

// ==================== 歌词动画 ====================

// ==================== 歌词动画触发 ====================

// 切歌时清空歌词显示
let prevSongId: string | undefined;
watch(
  () => playMusic.value?.id,
  (newId) => {
    if (newId !== prevSongId) {
      prevSongId = newId;
      displayText.value = '';
      lastProcessedIndex = -1;
      const el = lyricRef.value;
      if (el) {
        gsap.set(el, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          filter: 'none',
          autoAlpha: 0,
          clearProps: 'transform'
        });
      }
    }
  }
);

// 当舞台播放器变为可见时，同步显示当前歌词
watch(
  () => isVisible.value,
  (visible) => {
    if (visible) {
      nextTick(() => {
        const line = currentLine.value;
        if (line && displayText.value !== line.text) {
          displayText.value = line.text;
          lastProcessedIndex = nowIndex.value;
        }
      });
    }
  }
);

// 安全网：确保 displayText 始终与 currentLine 同步
watch(
  () => currentLine.value,
  (line) => {
    if (!line) return;
    if (displayText.value !== line.text && displayText.value.length === 0) {
      displayText.value = line.text;
      lastProcessedIndex = nowIndex.value;
    }
  }
);

// 动画方向映射：根据动画索引和强度决定初始位置
function getAnimationDirection(animIndex: number): { x?: number; y?: number; scale?: number; blur?: number } {
  const intensity = animationIntensity.value;
  const mult = intensity === 'power' ? 1.8 : intensity === 'soft' ? 0.5 : 1;
  const dirs: Record<number, { x?: number; y?: number; scale?: number; blur?: number }> = {
    0: { x: Math.round(80 * mult) },   // slideRight
    1: { x: Math.round(-80 * mult) },  // slideLeft
    2: { y: Math.round(-50 * mult) },  // slideTop
    3: { y: Math.round(50 * mult) },   // slideBottom
    4: {},                               // fadeIn
    5: { scale: intensity === 'power' ? 0.3 : intensity === 'soft' ? 0.8 : 0.5 }, // scaleIn
    6: { blur: intensity === 'power' ? 20 : intensity === 'soft' ? 5 : 12 },       // blurIn
  };
  return dirs[animIndex] || {};
}

watch(
  () => nowIndex.value,
  (newIndex, oldIndex) => {
    if (newIndex === oldIndex) return;
    prevLineIndex = newIndex;

    const el = lyricRef.value;
    if (!el) return;

    // 取消之前的 requestAnimationFrame
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId);
      pendingRafId = null;
    }

    // 中断之前的动画
    if (currentTimeline) {
      currentTimeline.kill();
      currentTimeline = null;
    }

    const animIndex = animationSelector.select(newIndex);
    const direction = getAnimationDirection(animIndex);

    // 划入动画（索引0-3）使用直接隐藏，其他使用渐隐
    const isSlideIn = animIndex >= 0 && animIndex <= 3;
    const hasCurrentText = displayText.value.length > 0;

    if (hasCurrentText) {
      if (isSlideIn) {
        // 滑入动画：先重置所有属性，然后隐藏
        gsap.set(el, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          filter: 'none',
          autoAlpha: 0,
          clearProps: 'transform'
        });
        nextTick(() => {
          // 检查索引是否仍是最新的
          if (nowIndex.value !== newIndex) return;
          const text = currentLine.value?.text || '';
          displayText.value = text;
          lastProcessedIndex = newIndex;
          pendingRafId = requestAnimationFrame(() => {
            if (nowIndex.value !== newIndex) return;
            applyEnterAnimation(el, text, animIndex, direction);
          });
        });
      } else {
        const exitTl = gsap.timeline();
        exitTl.to(el, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' });
        exitTl.call(() => {
          // 退出动画完成后，重置所有属性
          gsap.set(el, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            filter: 'none',
            autoAlpha: 0,
            clearProps: 'transform'
          });
        });
        exitTl.call(() => {
          nextTick(() => {
            // 检查索引是否仍是最新的
            if (nowIndex.value !== newIndex) return;
            const text = currentLine.value?.text || '';
            lastProcessedIndex = newIndex;
            applyEnterAnimation(el, text, animIndex, direction);
          });
        });
        currentTimeline = exitTl;
      }
    } else {
      nextTick(() => {
        // 检查索引是否仍是最新的
        if (nowIndex.value !== newIndex) return;
        const text = currentLine.value?.text || '';
        lastProcessedIndex = newIndex;
        applyEnterAnimation(el, text, animIndex, direction);
      });
    }
  }
);

function applyEnterAnimation(
  el: HTMLElement,
  text: string,
  animIndex: number,
  direction: { x?: number; y?: number; scale?: number; blur?: number }
) {
  // 强制重置所有可能被动画设置的属性到默认值
  // 注意：不设置 autoAlpha，由动画本身控制
  gsap.set(el, {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    filter: 'none',
    clearProps: 'transform'
  });

  // 设置位置/缩放/模糊（不动画透明度，由动画本身控制）
  const initProps: gsap.TweenVars = { duration: 0 };
  if (direction.x !== undefined) initProps.x = direction.x;
  if (direction.y !== undefined) initProps.y = direction.y;
  if (direction.scale !== undefined) initProps.scale = direction.scale;
  if (direction.blur !== undefined) initProps.filter = `blur(${direction.blur}px)`;
  gsap.set(el, initProps);

  // 更新文字
  displayText.value = text;

  // 下一帧执行入场动画（动画内部会从 autoAlpha:0 → autoAlpha:1）
  requestAnimationFrame(() => {
    const animFn = currentAnimations.value[animIndex];
    if (animFn && typeof animFn === 'function') {
      try {
        const tl = animFn(el, { duration: 0.7 });
        currentTimeline = tl;
      } catch {}
    }
  });
}

// ==================== 控件自动隐藏 ====================

function handleMouseMove() {
  controlsVisible.value = true;
  resetHideTimer();
}

function handleMouseLeave() {
  resetHideTimer();
}

function resetHideTimer() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    controlsVisible.value = false;
  }, 3000);
}

// ==================== 播放控制 ====================

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
  } catch (e) {
    console.error('全屏切换失败:', e);
  }
}

function handleFullScreenChange() {
  isFullScreen.value = !!document.fullscreenElement;
}

onMounted(() => {
  resetHideTimer();
  document.addEventListener('fullscreenchange', handleFullScreenChange);
  startParticles();
});

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (particleInterval) {
    clearInterval(particleInterval);
    particleInterval = null;
  }
  if (pendingRafId !== null) {
    cancelAnimationFrame(pendingRafId);
    pendingRafId = null;
  }
  document.removeEventListener('fullscreenchange', handleFullScreenChange);
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
});

// ==================== 粒子系统 ====================

function startParticles() {
  if (particleInterval) clearInterval(particleInterval);
  particleInterval = setInterval(() => {
    if (!particlesContainer.value) return;
    createParticle();
  }, 800);
}

function createParticle() {
  if (!particlesContainer.value) return;
  const particle = document.createElement('div');
  particle.className = 'particle';
  
  // 随机大小 2-6px
  const size = Math.random() * 4 + 2;
  // 随机水平位置
  const startX = Math.random() * 100;
  // 随机动画时长 8-15秒
  const duration = Math.random() * 7 + 8;
  // 随机延迟
  const delay = Math.random() * 2;
  
  particle.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${startX}%;
    bottom: -10px;
    animation: particleFloat ${duration}s ${delay}s linear infinite;
    opacity: 0;
  `;
  
  particlesContainer.value.appendChild(particle);
  
  // 15秒后移除粒子
  setTimeout(() => {
    particle.remove();
  }, (duration + delay) * 1000);
}
</script>

<style scoped lang="scss">
// ==================== 过渡 ====================

.stage-fade-enter-active { transition: opacity 0.6s cubic-bezier(0.32, 0.72, 0, 1); }
.stage-fade-leave-active { transition: opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.stage-fade-enter-from, .stage-fade-leave-to { opacity: 0; }

.close-fade-enter-active, .info-fade-enter-active {
  transition: opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1),
              transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}
.close-fade-leave-active, .info-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1),
              transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.close-fade-enter-from, .info-fade-enter-from { opacity: 0; transform: translateY(-20px); }
.close-fade-leave-to, .info-fade-leave-to { opacity: 0; transform: translateY(-20px); }

.tr-fade-enter-active, .tr-fade-leave-active { transition: opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.tr-fade-enter-from, .tr-fade-leave-to { opacity: 0; }

// ==================== 容器 ====================

.stage-player {
  --accent: rgb(180, 150, 100);
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #1a1510;
  z-index: 9998;
  cursor: default;
}

// ==================== 背景 ====================

.background-cover {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  pointer-events: none;
  will-change: transform;
  animation: coverPulse 8s ease-in-out infinite alternate;
}

@keyframes coverPulse {
  0% { transform: scale(1.15); filter: blur(50px) brightness(0.9) saturate(1.4); }
  100% { transform: scale(1.25); filter: blur(50px) brightness(1.1) saturate(1.6); }
}

.background-smoke {
  position: absolute;
  inset: -20%;
  pointer-events: none;
  will-change: transform;
  transition: background 2s ease;
  mix-blend-mode: screen;
}

.smoke-1 {
  animation: smoke1Drift 18s ease-in-out infinite alternate,
             smokeBreath 6s ease-in-out infinite;
}

.smoke-2 {
  animation: smoke2Drift 22s ease-in-out infinite alternate,
             smokeBreath 8s ease-in-out infinite 2s;
}

.smoke-3 {
  animation: smoke3Drift 28s ease-in-out infinite alternate,
             smokeBreath 10s ease-in-out infinite 4s;
}

.smoke-4 {
  animation: smoke4Drift 25s ease-in-out infinite alternate,
             smokeBreath 7s ease-in-out infinite 1s;
}

@keyframes smoke1Drift {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  100% { transform: translate(5%, -4%) scale(1.1) rotate(8deg); }
}

@keyframes smoke2Drift {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  100% { transform: translate(-4%, 5%) scale(1.15) rotate(-6deg); }
}

@keyframes smoke3Drift {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  100% { transform: translate(3%, 3%) scale(1.08) rotate(10deg); }
}

@keyframes smoke4Drift {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  100% { transform: translate(-3%, -5%) scale(1.12) rotate(-8deg); }
}

@keyframes smokeBreath {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.background-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%);
  animation: vignettePulse 10s ease-in-out infinite alternate;
}

@keyframes vignettePulse {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

// ==================== 粒子 ====================

.particles-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgb(var(--accent-rgb));
  pointer-events: none;
  will-change: transform, opacity;
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
    transform: translateY(-10vh) translateX(5px) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translateY(-50vh) translateX(-10px) scale(0.8);
  }
  90% {
    opacity: 0.1;
    transform: translateY(-90vh) translateX(15px) scale(0.5);
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) translateX(0) scale(0);
  }
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
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);

  i { font-size: 18px; }

  &:hover {
    background: rgba(0, 0, 0, 0.35);
    color: rgb(var(--accent-rgb));
    transform: scale(1.1);
  }

  &:active { transform: scale(0.95); }
}

// ==================== 顶部歌曲信息 ====================

.song-info-top {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 9999;

  .song-name {
    font-size: 15px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
  }

  .song-artist {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 2px;

    .artist-name {
      cursor: pointer;
      transition: color 0.2s;
      &:hover { color: rgba(255, 255, 255, 0.8); }
    }
  }
}

// ==================== 歌词 ====================

.lyric-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  pointer-events: none;
}

.single-lyric {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 700;
  text-align: center;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.lyric-word {
  display: inline-block;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.lyric-translation {
  margin-top: 16px;
  font-size: clamp(16px, 2.5vw, 24px);
  color: rgba(255, 255, 255, 0.45);
  font-weight: 400;
  text-align: center;
}
</style>
