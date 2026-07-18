<template>
  <teleport to="body">
    <transition name="neon-fade">
      <div
        v-if="isVisible"
        class="neon-player"
        :style="{ '--neon-color': neonColor, '--neon-bright': neonBright, '--neon-dim': neonDim }"
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
              <neon-stroke-char v-else :char="char" :color="neonColor" :style="{ fontSize: '1em', animationDelay: i * 0.1 + 's' }" />
            </template>
          </div>

          <!-- 降级：笔画数据未加载时显示纯文字 -->
          <div v-if="!hasAnyStrokes && currentText" class="fallback-lyrics" :style="{ color: neonBright }">
            {{ currentText }}
          </div>
        </div>

        <!-- 通用顶部控件 -->
        <player-controls
          v-if="!overlayMode"
          v-show="controlsVisible"
          :showStyleSwitch="false"
          theme="dark"
          class="no-toggle"
          @close="close"
        />
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { lrcArray, nowIndex } from '@/hooks/MusicHook';
import { useCoverColor } from '@/hooks/useCoverColor';
import { useStyleEngineStore } from '@/store/modules/styleEngine';

import { useTapToggle } from '@/composables/useTapToggle';
import { loadDictionary, getStrokes } from '@/lib/hanziStrokes';

import NeonStrokeChar from './NeonStrokeChar.vue';
import PlayerControls from './PlayerControls.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  background: { type: String, default: '' },
  overlayMode: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const styleEngine = useStyleEngineStore();
const { primaryColor } = useCoverColor();
const { controlsVisible, handleTapToggle } = useTapToggle();

const isVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) });

const neonColor = computed(() => primaryColor.value || '#00ff88');
const neonBright = computed(() => {
  const rgb = neonColor.value.match(/\d+/g);
  if (!rgb) return '#aaffcc';
  return `rgb(${Math.min(255, Number(rgb[0]) + 80)}, ${Math.min(255, Number(rgb[1]) + 80)}, ${Math.min(255, Number(rgb[2]) + 80)})`;
});
const neonDim = computed(() => {
  const rgb = neonColor.value.match(/\d+/g);
  if (!rgb) return '#004422';
  return `rgb(${Math.round(Number(rgb[0]) * 0.3)}, ${Math.round(Number(rgb[1]) * 0.3)}, ${Math.round(Number(rgb[2]) * 0.3)})`;
});

const beatGlowOpacity = computed(() => styleEngine.isBeat ? 0.6 : 0.35);

const currentText = computed(() => {
  const idx = nowIndex.value;
  if (idx < 0 || idx >= lrcArray.value.length) return '';
  return lrcArray.value[idx]?.text || '';
});
const currentChars = computed(() => Array.from(currentText.value || ''));
const lyricFontSize = computed(() => 'clamp(40px, 8vw, 80px)');

const hasAnyStrokes = ref(false);
async function checkStrokes() {
  await loadDictionary();
  for (const char of currentChars.value) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      const s = getStrokes(char);
      if (s && s.length > 0) { hasAnyStrokes.value = true; return; }
    }
  }
  hasAnyStrokes.value = false;
}
watch(currentText, () => checkStrokes());
onMounted(() => checkStrokes());

function close() { isVisible.value = false; }
</script>

<style lang="scss" scoped>
.neon-player { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; background: #0a0a0a; }
.concrete-bg {
  position: absolute; inset: 0; z-index: 0; background-color: #1a1a1a;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
    radial-gradient(circle at 50% 20%, rgba(255,255,255,0.01) 0%, transparent 50%);
  background-size: cover; filter: brightness(0.4) contrast(1.2);
}
.ambient-glow {
  position: absolute; inset: 0; z-index: 1;
  background: radial-gradient(ellipse at center, transparent 30%, var(--neon-dim) 70%, var(--neon-color) 100%);
  opacity: 0.35; mix-blend-mode: screen;
  transition: opacity 0.1s var(--m-ease-out, ease-out); pointer-events: none;
}
.lyrics-layer { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 20px; }
.neon-lyrics { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.05em; line-height: 1.2; }
.neon-space { display: inline-block; width: 0.3em; }
.fallback-lyrics {
  font-family: 'Noto Sans SC', sans-serif; font-weight: 700; font-size: clamp(28px, 5vw, 48px);
  text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor;
  text-align: center;
}
.neon-fade-enter-active, .neon-fade-leave-active { transition: opacity 0.3s var(--m-ease-out, ease); }
.neon-fade-enter-from, .neon-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .ambient-glow { transition: none; } }
</style>
