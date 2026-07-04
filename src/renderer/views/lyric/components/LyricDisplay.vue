<template>
  <div class="lyric-display">
    <div v-if="lrcArray && lrcArray.length > 0" class="lyric-content">
      <!-- 逐字歌词 -->
      <div v-if="wordByWord" class="word-by-word">
        <span
          v-for="(word, i) in words"
          :key="i"
          class="lyric-word"
          :style="getWordStyle(currentIndex, i, word)"
        >{{ word.text }}</span>
      </div>
      <!-- 普通歌词 -->
      <div v-else class="lyric-text" :style="{ fontSize: `${fontSize}px` }">
        {{ currentText }}
      </div>
    </div>
    <div v-else class="lyric-empty">无歌词</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Word {
  text: string;
  startTime: number;
  duration: number;
  space?: boolean;
}

interface LyricLine {
  text: string;
  trText: string;
  words?: Word[];
  hasWordByWord?: boolean;
}

interface Props {
  lrcArray?: LyricLine[];
  currentIndex: number;
  fontSize?: number;
  getWordStyle?: (lineIndex: number, wordIndex: number, word: Word) => Record<string, string>;
  getLyricStyle?: (lineIndex: number) => Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  lrcArray: () => [],
  fontSize: 28,
  getWordStyle: () => ({}),
  getLyricStyle: () => ({})
});

const currentText = computed(() => {
  const line = props.lrcArray[props.currentIndex];
  return line?.text || '';
});

const wordByWord = computed(() => {
  const line = props.lrcArray[props.currentIndex];
  return line?.hasWordByWord && line?.words && line.words.length > 0;
});

const words = computed(() => {
  const line = props.lrcArray[props.currentIndex];
  return line?.words || [];
});
</script>

<style lang="scss" scoped>
.lyric-display {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
}

.lyric-content {
  text-align: center;
  max-width: 85%;
}

.lyric-text {
  color: #fff;
  line-height: 1.4;
}

.lyric-word {
  display: inline-block;
  transition: color 0.15s ease;
}

.lyric-empty {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}
</style>
