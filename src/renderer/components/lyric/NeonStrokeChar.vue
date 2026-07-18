<template>
  <svg
    :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
    class="neon-stroke-svg"
    :style="{ '--neon-color': color, '--neon-color-bright': brightColor, '--beat-scale': beatScale }"
  >
    <!-- 定义霓虹光效 filter -->
    <defs>
      <filter :id="filterId" x="-50%" y="-50%" width="200%" height="200%">
        <!-- 外层大范围漫射光 -->
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
        <feMerge>
          <feMergeNode in="blur1" />
          <feMergeNode in="blur2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <!-- 背景光效反馈 -->
      <filter :id="bgFilterId" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
      </filter>
    </defs>

    <!-- 背景光晕层（笔画在背景上的投影光） -->
    <g
      :filter="`url(#${bgFilterId})`"
      :opacity="0.3"
      :transform="`scale(${beatScale})`"
      :transform-origin="`${viewBoxSize / 2} ${viewBoxSize / 2}`"
      class="neon-bg-glow"
    >
      <path
        v-for="(stroke, i) in strokes"
        :key="'bg-' + i"
        :d="stroke"
        :fill="color"
        :opacity="0.5"
        :transform="`scale(${charScale}) translate(${offsetX} ${offsetY})`"
      />
    </g>

    <!-- 霓虹灯管层 -->
    <g
      :filter="`url(#${filterId})`"
      :transform="`scale(${beatScale})`"
      :transform-origin="`${viewBoxSize / 2} ${viewBoxSize / 2}`"
      class="neon-tube"
    >
      <path
        v-for="(stroke, i) in strokes"
        :key="'tube-' + i"
        :d="stroke"
        :fill="brightColor"
        :stroke="color"
        :stroke-width="0.5"
        :transform="`scale(${charScale}) translate(${offsetX} ${offsetY})`"
        :style="{ animationDelay: i * 0.05 + 's' }"
        class="neon-stroke-path"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
/**
 * NeonStrokeChar — 单个汉字的霓虹笔画渲染
 *
 * 将汉字笔画用 SVG path 渲染为霓虹灯管效果：
 * - 每个笔画填充亮色 + 描边强调色
 * - 多层 feGaussianBlur 产生光晕扩散
 * - 背景层投射模糊光晕（光效反馈）
 * - 鼓点命中时 scale 脉冲
 */
import { computed, onMounted, ref } from 'vue';

import { useStyleEngineStore } from '@/store/modules/player';
import { getStrokes, loadDictionary } from '@/lib/hanziStrokes';

const props = defineProps<{
  char: string;
  /** 尺寸（px） */
  size?: number;
  /** 霓虹灯颜色（强调色） */
  color?: string;
}>();

const styleEngine = useStyleEngineStore();

const viewBoxSize = 1024; // makemeahanzi 坐标系
const filterId = `neon-filter-${Math.random().toString(36).slice(2, 9)}`;
const bgFilterId = `neon-bg-filter-${Math.random().toString(36).slice(2, 9)}`;

const strokes = ref<string[]>([]);
const hasStrokes = ref(false);

// 笔画缩放和偏移（makemeahanzi 的 path 坐标范围约 0-1024）
const charScale = 0.9;
const offsetX = 50;
const offsetY = 50;

// 颜色
const color = computed(() => props.color || '#00ff88');
const brightColor = computed(() => {
  // 亮色变体：提亮 50%
  const rgb = color.value.match(/\d+/g);
  if (!rgb) return '#aaffcc';
  return `rgb(${Math.min(255, Number(rgb[0]) + 80)}, ${Math.min(255, Number(rgb[1]) + 80)}, ${Math.min(255, Number(rgb[2]) + 80)})`;
});

// 鼓点脉冲
const beatScale = computed(() => {
  return styleEngine.isBeat ? 1.03 : 1.0;
});

// 加载笔画数据
onMounted(async () => {
  await loadDictionary();
  const s = getStrokes(props.char);
  if (s && s.length > 0) {
    strokes.value = s;
    hasStrokes.value = true;
  }
});

// 监听字符变化
import { watch } from 'vue';
watch(() => props.char, async (newChar) => {
  const s = getStrokes(newChar);
  if (s && s.length > 0) {
    strokes.value = s;
    hasStrokes.value = true;
  } else {
    strokes.value = [];
    hasStrokes.value = false;
  }
});
</script>

<style lang="scss" scoped>
.neon-stroke-svg {
  display: inline-block;
  width: 1em;
  height: 1em;
  overflow: visible;
}

.neon-stroke-path {
  transition: opacity 0.2s ease;
  animation: neon-flicker 4s ease-in-out infinite;
}

@keyframes neon-flicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.7; }
  94% { opacity: 1; }
  96% { opacity: 0.8; }
  97% { opacity: 1; }
}

.neon-tube,
.neon-bg-glow {
  transition: transform 0.1s var(--m-ease-out, ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .neon-stroke-path { animation: none; }
  .neon-tube, .neon-bg-glow { transition: none; }
}
</style>
