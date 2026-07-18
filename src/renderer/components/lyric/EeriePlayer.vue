<template>
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
                :style="{ color: accentColor, fontSize: climaxFontSizePx }"
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

          <div v-else class="lyrics-empty"></div>
        </div>

        <!-- 通用顶部控件 -->
        <player-controls
          v-if="!overlayMode"
          v-show="controlsVisible"
          :showStyleSwitch="false"
          theme="light"
          class="no-toggle"
          @close="close"
        />
      </div>
    </transition>
</template>

<script setup lang="ts">
/**
 * EeriePlayer — 诡谲模式播放器
 */
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';

import { lrcArray, nowIndex, playMusic } from '@/hooks/MusicHook';
import { useCoverColor } from '@/hooks/useCoverColor';
import { usePlayerStore } from '@/store/modules/player';
import { useStyleEngineStore } from '@/store/modules/styleEngine';
import { DEFAULT_LYRIC_CONFIG, type LyricConfig } from '@/types/lyric';

import { useTapToggle } from '@/composables/useTapToggle';
import { drawCracks } from '@/lib/crackRenderer';
import { startNoiseAnimation } from '@/lib/noiseCanvas';

import newspaperManifest from '@/assets/textures/newspaper/manifest.json';
import PlayerControls from './PlayerControls.vue';

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
const isInClimax = computed(() => styleEngine.isInClimax);

// ==================== 响应式配置 ====================
const config = ref<LyricConfig>({ ...DEFAULT_LYRIC_CONFIG });

function loadConfig() {
  const saved = localStorage.getItem('music-full-config');
  if (saved) {
    try {
      config.value = { ...DEFAULT_LYRIC_CONFIG, ...JSON.parse(saved) };
    } catch {
      config.value = { ...DEFAULT_LYRIC_CONFIG };
    }
  }
}
loadConfig();

function handleConfigUpdate() {
  loadConfig();
}

onMounted(() => {
  window.addEventListener('music-full-config-updated', handleConfigUpdate);
  styleEngine.syncFromPlayerStore();
  styleEngine.syncCoverColors();
  if (playerStore.currentSong?.id) {
    styleEngine.loadClimaxData(String(playerStore.currentSong.id));
  }
});

onUnmounted(() => {
  window.removeEventListener('music-full-config-updated', handleConfigUpdate);
});

// 颜色
const accentColor = computed(() => primaryColor.value || '#888888');
const accentDark = computed(() => {
  const rgb = primaryColor.value?.match(/\d+/g);
  if (!rgb) return '#333333';
  return `rgb(${rgb.map((v: string) => Math.round(Number(v) * 0.4)).join(', ')})`;
});

const isIntro = computed(() => nowIndex.value <= 0);
const bgColor = computed(() => isIntro.value ? accentDark.value : '#0a0a0a');

// 配置值
const eerieFontFamily = computed(() => (config.value as any).eerieFontFamily || 'KaiTi');
const eerieMaxFontSize = computed(() => (config.value as any).eerieMaxFontSize ?? 48);
const eerieMinFontSize = computed(() => (config.value as any).eerieMinFontSize ?? 32);
const eerieClimaxFontSize = computed(() => (config.value as any).eerieClimaxFontSize ?? 100);

// 哑铃型字号：两端大中间小
const currentChars = computed(() => {
  const idx = nowIndex.value;
  if (idx < 0 || idx >= lrcArray.value.length) return [];
  const text = lrcArray.value[idx]?.text || '';
  if (!text) return [];
  const chars = Array.from(text);
  const n = chars.length;
  if (n === 0) return [];
  const maxSize = eerieMaxFontSize.value;
  const minSize = eerieMinFontSize.value;
  return chars.map((char, i) => {
    // 两端大中间小：i=0 和 i=n-1 时 ratio=1（maxSize），i=n/2 时 ratio=0（minSize）
    const ratio = n === 1 ? 1 : 1 - Math.sin(Math.PI * (i / (n - 1)));
    const size = minSize + (maxSize - minSize) * ratio;
    return { char, size, margin: -size * 0.08 };
  });
});

// 字体族
const fontFamily = computed(() => {
  const f = eerieFontFamily.value;
  const fallbacks: Record<string, string> = {
    'KaiTi': "'KaiTi', 'STKaiti', 'Noto Serif SC', serif",
    'STKaiti': "'STKaiti', 'KaiTi', 'Noto Serif SC', serif",
    'FangSong': "'FangSong', 'STFangsong', 'Noto Serif SC', serif",
    'SimSun': "'SimSun', 'STSong', serif",
    'LiSu': "'LiSu', 'STLiti', serif",
    'YouYuan': "'YouYuan', 'STXihei', sans-serif",
  };
  return fallbacks[f] || `${f}, 'KaiTi', serif`;
});

// 高潮重点词字号
const climaxFontSizePx = computed(() => `${eerieClimaxFontSize.value}px`);

const climaxKeywords = computed(() => styleEngine.currentLineKeywords || []);

// 背景画布
const bgCanvasRef = ref<HTMLCanvasElement | null>(null);
let noiseStopFn: (() => void) | null = null;

function updateBackground() {
  const canvas = bgCanvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(0, 0, w, h);

  if (isIntro.value) {
    if (noiseStopFn) noiseStopFn();
    noiseStopFn = startNoiseAnimation(ctx, w, h, 0.15, 12);
  } else {
    if (noiseStopFn) { noiseStopFn(); noiseStopFn = null; }
    if (!isInClimax.value) {
      drawCracks(ctx, w, h, { count: 6 + Math.floor(Math.random() * 4), opacity: 0.12, color: accentColor.value, maxDepth: 4 });
    }
  }
}

watch(nowIndex, () => nextTick(() => updateBackground()));
watch(isInClimax, () => nextTick(() => updateBackground()));
watch(isVisible, (v) => {
  if (v) nextTick(() => updateBackground());
  else if (noiseStopFn) { noiseStopFn(); noiseStopFn = null; }
});

// 报纸效果
interface NewspaperItem { id: number; src: string; }
const activeNewspapers = ref<NewspaperItem[]>([]);
let newspaperIdCounter = 0;
let climaxNewspaperTimer: ReturnType<typeof setInterval> | null = null;
const newspaperTextures = (newspaperManifest as any).textures || [];
let climaxIndex = 0;

function flashNewspaper(src: string) {
  const id = newspaperIdCounter++;
  activeNewspapers.value.push({ id, src });
  setTimeout(() => { activeNewspapers.value = activeNewspapers.value.filter((n) => n.id !== id); }, 500);
}

function startClimaxNewspapers() {
  if (climaxNewspaperTimer || newspaperTextures.length === 0) return;
  const cycle = () => { flashNewspaper(newspaperTextures[climaxIndex % newspaperTextures.length].src); climaxIndex++; };
  cycle();
  climaxNewspaperTimer = setInterval(cycle, 500);
}

function stopClimaxNewspapers() {
  if (climaxNewspaperTimer) { clearInterval(climaxNewspaperTimer); climaxNewspaperTimer = null; }
}

watch(isInClimax, (c) => { c ? startClimaxNewspapers() : stopClimaxNewspapers(); });
watch(nowIndex, () => {
  if (!isInClimax.value && newspaperTextures.length > 0 && Math.random() < 0.1) {
    flashNewspaper(newspaperTextures[Math.floor(Math.random() * newspaperTextures.length)].src);
  }
});

function close() { isVisible.value = false; }

onBeforeUnmount(() => { if (noiseStopFn) noiseStopFn(); stopClimaxNewspapers(); });
</script>

<style lang="scss" scoped>
.eerie-player {
  position: fixed; inset: 0; z-index: 9998;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  overflow: hidden; background: var(--bg-color);
}

.bg-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
.newspaper-layer { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.newspaper-item {
  position: absolute; inset: 0;
  background-size: cover; background-position: center; background-repeat: no-repeat;
  mix-blend-mode: overlay;
}

.lyrics-layer {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; height: 100%; padding: 20px;
}

.calligraphy-line { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; max-width: 100%; }
.calligraphy-char {
  font-family: v-bind(fontFamily);
  font-weight: 700; line-height: 1.1;
  filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));
  transition: color 0.3s var(--m-ease-out, ease);
  text-shadow: 0 0 2px currentColor;
}

.climax-keywords { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0.1em; width: 100%; }
.keyword-char {
  font-family: v-bind(fontFamily);
  font-weight: 900; line-height: 1;
  text-shadow: 0 0 20px currentColor, 0 0 4px currentColor;
  animation: keyword-pulse 0.8s var(--m-ease-out, ease) infinite alternate;
}
@keyframes keyword-pulse { to { text-shadow: 0 0 30px currentColor, 0 0 8px currentColor; } }

.lyrics-empty { width: 1px; height: 1px; }

.eerie-fade-enter-active, .eerie-fade-leave-active { transition: opacity 0.3s var(--m-ease-out, ease); }
.eerie-fade-enter-from, .eerie-fade-leave-to { opacity: 0; }
.newspaper-flash-enter-active { transition: opacity 0.15s ease; }
.newspaper-flash-leave-active { transition: opacity 0.15s ease; }
.newspaper-flash-enter-from, .newspaper-flash-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .keyword-char { animation: none; }
}
</style>
