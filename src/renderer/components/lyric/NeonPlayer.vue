<template>
  <teleport to="body">
    <transition name="neon-fade">
      <div
        v-if="isVisible"
        class="neon-player"
        :style="{
          '--neon-color': neonColor,
          '--neon-bright': neonBright,
          '--neon-dim': neonDim,
        }"
        @click="handleTapToggle"
      >
        <!-- 水泥墙背景 -->
        <div class="concrete-bg"></div>

        <!-- 四周霓虹光效 -->
        <div class="ambient-glow" :style="{ opacity: beatGlowOpacity }"></div>

        <!-- 歌词层：逐字霓虹笔画 -->
        <div class="lyrics-layer">
          <div class="neon-lyrics" :style="{ fontSize: lyricFontSize }">
            <template v-for="(char, i) in currentChars" :key="i">
              <span v-if="char === ' '" class="neon-space">&nbsp;</span>
              <neon-stroke-char
                v-else
                :char="char"
                :color="neonColor"
                :style="{ fontSize: '1em', animationDelay: i * 0.1 + 's' }"
              />
            </template>
          </div>

          <!-- 降级：笔画数据未加载时显示纯文字 -->
          <div v-if="!hasAnyStrokes && currentText" class="fallback-lyrics" :style="{ color: neonBright }">
            {{ currentText }}
          </div>
        </div>

        <!-- 顶部控件 -->
        <transition name="ctrl-fade">
          <div v-show="controlsVisible" class="top-controls no-toggle">
            <div class="ctrl-btn" @click="close"><i class="ri-arrow-down-s-line"></i></div>
            <div style="flex:1"></div>
            <div class="ctrl-btn" @click="cycleStyle"><i class="ri-shuffle-line"></i></div>
          </div>
        </transition>

        <!-- 底部控件 -->
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
              <div class="ctrl-btn" @click="handlePrev"><i class="ri-skip-back-fill"></i></div>
              <div class="ctrl-btn play-btn" @click="handlePlayPause">
                <i :class="isPlaying ? 'ri-pause-fill' : 'ri-play-fill'"></i>
              </div>
              <div class="ctrl-btn" @click="handleNext"><i class="ri-skip-forward-fill"></i></div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
/**
 * NeonPlayer — 霓虹模式播放器
 *
 * 设计要素：
 * - 歌词逐字拆笔画，每笔用霓虹灯管效果（发光描边+光晕）
 * - 背景光效反馈：每个霓虹灯管在背景投射模糊光晕
 * - 四周有封面取色+变亮的光效（模拟房间四周灯管）
 * - 黑色水泥墙底图
 * - 霓虹灯和背景光效跟随鼓点轻微闪动
 */
import { computed, onMounted, ref, watch } from 'vue';

import { lrcArray, nowIndex, playMusic } from '@/hooks/MusicHook';
import { useCoverColor } from '@/hooks/useCoverColor';
import { usePlayerStore } from '@/store/modules/player';
import { useStyleEngineStore } from '@/store/modules/styleEngine';
import { secondToMinute } from '@/utils';

import { useTapToggle } from '@/composables/useTapToggle';
import { loadDictionary, getStrokes } from '@/lib/hanziStrokes';

import NeonStrokeChar from './NeonStrokeChar.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  background: { type: String, default: '' },
  overlayMode: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const playerStore = usePlayerStore();
const styleEngine = useStyleEngineStore();
const { primaryColor } = useCoverColor();
const { controlsVisible, handleTapToggle } = useTapToggle();

const isVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) });
const isPlaying = computed(() => playerStore.isPlay);
const currentTime = computed(() => playerStore.playingTime || 0);
const duration = computed(() => (playMusic.value?.dt || playMusic.value?.duration || 0) / 1000);
const progressPercent = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0);

// ==================== 颜色 ====================

const neonColor = computed(() => primaryColor.value || '#00ff88');

/** 亮色变体（灯管内部亮色） */
const neonBright = computed(() => {
  const rgb = neonColor.value.match(/\d+/g);
  if (!rgb) return '#aaffcc';
  return `rgb(${Math.min(255, Number(rgb[0]) + 80)}, ${Math.min(255, Number(rgb[1]) + 80)}, ${Math.min(255, Number(rgb[2]) + 80)})`;
});

/** 暗色变体（环境光） */
const neonDim = computed(() => {
  const rgb = neonColor.value.match(/\d+/g);
  if (!rgb) return '#004422';
  return `rgb(${Math.round(Number(rgb[0]) * 0.3)}, ${Math.round(Number(rgb[1]) * 0.3)}, ${Math.round(Number(rgb[2]) * 0.3)})`;
});

// ==================== 鼓点响应 ====================

const beatGlowOpacity = computed(() => {
  return styleEngine.isBeat ? 0.6 : 0.35;
});

// ==================== 歌词 ====================

const currentText = computed(() => {
  const idx = nowIndex.value;
  if (idx < 0 || idx >= lrcArray.value.length) return '';
  return lrcArray.value[idx]?.text || '';
});

const currentChars = computed(() => {
  const text = currentText.value;
  if (!text) return [];
  return Array.from(text);
});

const lyricFontSize = computed(() => 'clamp(40px, 8vw, 80px)');

// 检查是否有笔画数据（降级判断）
const hasAnyStrokes = ref(false);

async function checkStrokes() {
  await loadDictionary();
  const chars = currentChars.value;
  for (const char of chars) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      const s = getStrokes(char);
      if (s && s.length > 0) {
        hasAnyStrokes.value = true;
        return;
      }
    }
  }
  hasAnyStrokes.value = false;
}

watch(currentText, () => checkStrokes());
onMounted(() => checkStrokes());

// ==================== 播放控制 ====================

function close() { isVisible.value = false; }
function handlePrev() { playerStore.prevPlay(); }
function handleNext() { playerStore.nextPlay(); }
function handlePlayPause() { playerStore.setPlay(playMusic.value); }
function handleSeek(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  playerStore.setPlayTime(((e.clientX - rect.left) / rect.width) * duration.value);
}
function cycleStyle() { window.dispatchEvent(new CustomEvent('music-full-config-updated')); }
function formatTime(s: number): string { return secondToMinute(s); }
</script>

<style lang="scss" scoped>
.neon-player {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  overflow: hidden; background: #0a0a0a;
}

/* 水泥墙背景 */
.concrete-bg {
  position: absolute; inset: 0; z-index: 0;
  background-color: #1a1a1a;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
    radial-gradient(circle at 50% 20%, rgba(255,255,255,0.01) 0%, transparent 50%);
  background-size: cover;
  filter: brightness(0.4) contrast(1.2);
}

/* 四周霓虹光效 */
.ambient-glow {
  position: absolute; inset: 0; z-index: 1;
  background: radial-gradient(
    ellipse at center,
    transparent 30%,
    var(--neon-dim) 70%,
    var(--neon-color) 100%
  );
  opacity: 0.35;
  mix-blend-mode: screen;
  transition: opacity 0.1s var(--m-ease-out, ease-out);
  pointer-events: none;
}

/* 歌词层 */
.lyrics-layer {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; padding: 20px;
}

.neon-lyrics {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
  gap: 0.05em;
  line-height: 1.2;
}

.neon-space {
  display: inline-block;
  width: 0.3em;
}

/* 降级纯文字 */
.fallback-lyrics {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 700;
  font-size: clamp(28px, 5vw, 48px);
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor;
  text-align: center;
}

/* 顶部控件 */
.top-controls {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center;
  padding: calc(var(--safe-area-inset-top, 0px) + 16px) 20px 0; z-index: 10;
  .ctrl-btn {
    @apply flex items-center justify-center w-10 h-10 rounded-full text-xl;
    color: #f0ece4; background: rgba(255,255,255,0.08); cursor: pointer;
    transition: transform var(--m-duration-press, 160ms) var(--m-ease-out, ease-out);
    &:active { transform: scale(0.97); }
  }
}

/* 底部控件 */
.bottom-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 0 24px calc(var(--safe-area-inset-bottom, 0px) + 32px); z-index: 10; }
.progress-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
  .time-text { font-size: 12px; color: #666; flex-shrink: 0; min-width: 36px; }
  .progress-bar-bg {
    flex: 1; height: 2px; background: #333; border-radius: 1px; position: relative; cursor: pointer;
    .progress-bar-fill { position: absolute; left: 0; top: 0; height: 100%; background: var(--neon-color); border-radius: 1px; transition: width 0.1s linear; }
  }
}

.control-buttons {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  .ctrl-btn {
    @apply flex items-center justify-center rounded-full cursor-pointer;
    background: #333; width: 42px; height: 42px;
    transition: transform var(--m-duration-press, 160ms) var(--m-ease-out, ease-out);
    i { font-size: 18px; color: #f0ece4; }
    &:active { transform: scale(0.97); }
    &.play-btn { width: 52px; height: 52px; background: var(--neon-color); i { font-size: 24px; color: #0a0a0a; } }
  }
}

/* 过渡 */
.neon-fade-enter-active, .neon-fade-leave-active { transition: opacity 0.3s var(--m-ease-out, ease); }
.neon-fade-enter-from, .neon-fade-leave-to { opacity: 0; }
.ctrl-fade-enter-active, .ctrl-fade-leave-active { transition: opacity 0.2s var(--m-ease-out, ease); }
.ctrl-fade-enter-from, .ctrl-fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .ambient-glow { transition: none; }
}
</style>
