<template>
  <div class="lyric-container">
    <!-- 滚动模式 -->
    <div v-if="displayMode === 'scroll'" class="lyric-scroll">
      <div class="lyric-wrapper" :style="wrapperStyle">
        <template v-if="lrcArray.length > 0">
          <div
            v-for="(line, index) in lrcArray"
            :key="index"
            class="lyric-line"
            :style="getDynamicLineStyle(line, showTranslation)"
            :class="{
              'lyric-line-current': index === currentIndex,
              'lyric-line-passed': index < currentIndex,
              'lyric-line-next': index === currentIndex + 1
            }"
          >
            <div class="lyric-text" :style="{ fontSize: `${fontSize}px` }">
              <div
                v-if="line.hasWordByWord && line.words && line.words.length > 0"
                class="word-by-word-lyric"
              >
                <template v-for="(word, wordIndex) in line.words" :key="wordIndex">
                  <span class="lyric-word" :style="getWordStyle(index, wordIndex, word)">
                    {{ word.text }}</span
                  ><span v-if="word.space" class="lyric-word">&nbsp;</span>
                </template>
              </div>
              <span v-else class="lyric-text-inner" :style="getLyricStyle(index)">
                {{ line.text || '' }}
              </span>
            </div>
            <div
              v-if="showTranslation && line.trText"
              class="lyric-translation"
              :style="{ fontSize: `${fontSize * 0.6}px` }"
            >
              {{ line.trText }}
            </div>
          </div>
        </template>
        <div v-else class="lyric-empty">无歌词</div>
      </div>
    </div>

    <!-- 单行模式 -->
    <div v-else-if="displayMode === 'single'" class="lyric-single-mode">
      <template v-if="lrcArray.length > 0">
        <div class="lyric-line lyric-line-current">
          <div class="lyric-text" :style="{ fontSize: `${fontSize}px` }">
            <div
              v-if="
                lrcArray[currentIndex] != null &&
                lrcArray[currentIndex].hasWordByWord &&
                (lrcArray[currentIndex].words?.length ?? 0) > 0
              "
              class="word-by-word-lyric"
            >
              <template
                v-for="(word, wordIndex) in lrcArray[currentIndex]!.words"
                :key="wordIndex"
              >
                <span class="lyric-word" :style="getWordStyle(currentIndex, wordIndex, word)">
                  {{ word.text }}</span
                ><span v-if="word.space" class="lyric-word">&nbsp;</span>
              </template>
            </div>
            <span v-else class="lyric-text-inner" :style="getLyricStyle(currentIndex)">
              {{ lrcArray[currentIndex]?.text || '' }}
            </span>
          </div>
          <div
            v-if="showTranslation && lrcArray[currentIndex]?.trText"
            class="lyric-translation"
            :style="{ fontSize: `${fontSize * 0.6}px` }"
          >
            {{ lrcArray[currentIndex]?.trText }}
          </div>
        </div>
      </template>
      <div v-else class="lyric-empty">无歌词</div>
    </div>

    <!-- 双行模式 -->
    <div v-else class="lyric-double-mode" :class="{ 'group-fade': isGroupTransitioning }">
      <template v-if="lrcArray.length > 0">
        <div
          v-for="line in currentGroupLines"
          :key="line.index"
          class="lyric-line"
          :class="{ 'lyric-line-current': line.index === currentIndex }"
        >
          <div class="lyric-text" :style="{ fontSize: `${fontSize}px` }">
            <div
              v-if="line.hasWordByWord && line.words && line.words.length > 0"
              class="word-by-word-lyric"
            >
              <template v-for="(word, wordIndex) in line.words" :key="wordIndex">
                <span class="lyric-word" :style="getWordStyle(line.index, wordIndex, word)">
                  {{ word.text }}</span
                ><span v-if="word.space" class="lyric-word">&nbsp;</span>
              </template>
            </div>
            <span v-else class="lyric-text-inner" :style="getLyricStyle(line.index)">
              {{ line.text || '' }}
            </span>
          </div>
          <div
            v-if="showTranslation && line.trText"
            class="lyric-translation"
            :style="{ fontSize: `${fontSize * 0.6}px` }"
          >
            {{ line.trText }}
          </div>
        </div>
      </template>
      <div v-else class="lyric-empty">无歌词</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LyricLine } from '../composables/useLyricState';

defineProps<{
  displayMode: 'scroll' | 'single' | 'double';
  lrcArray: LyricLine[];
  currentIndex: number;
  fontSize: number;
  showTranslation: boolean;
  wrapperStyle: Record<string, string>;
  getDynamicLineStyle: (line: LyricLine, withTranslation?: boolean) => Record<string, string>;
  getWordStyle: (
    lineIndex: number,
    wordIndex: number,
    word: { text: string; startTime: number; duration: number }
  ) => Record<string, string>;
  getLyricStyle: (index: number) => Record<string, string>;
  currentGroupLines: Array<LyricLine & { index: number }>;
  isGroupTransitioning: boolean;
}>();
</script>

<style lang="scss" scoped>
.lyric-container {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 100;
}

.lyric-single-mode {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;

  .lyric-line {
    width: 100%;
    text-align: center;
  }
}

.lyric-double-mode {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  transition: opacity 0.15s ease;

  &.group-fade {
    opacity: 0;
  }

  .lyric-line {
    width: 100%;
    text-align: center;
    opacity: 0.55;
    transition: opacity 0.25s ease;

    &.lyric-line-current {
      opacity: 1;
      transform: scale(1.03);
    }
  }
}

.lyric-scroll {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
}

.lyric-wrapper {
  will-change: transform;
  padding: 20vh 0;
  transform-origin: center center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyric-line {
  padding: 4px 20px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &.lyric-line-current {
    transform: scale(1.05);
    opacity: 1;

    .lyric-text {
      text-shadow: none;

      .lyric-text-inner {
        filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
        -webkit-font-smoothing: antialiased;
      }
    }
  }

  &.lyric-line-passed {
    opacity: 0.6;
  }
}

.lyric-text {
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-all;
  transition: transform 0.2s ease;
  line-height: 1.4;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-shadow:
    0 0 2px rgba(0, 0, 0, 0.8),
    0 1px 1px rgba(0, 0, 0, 0.6),
    0 0 4px rgba(255, 255, 255, 0.2);

  .lyric-text-inner {
    transition: background 0.3s ease;
  }

  .word-by-word-lyric {
    display: inline-block;
    text-align: center;

    .lyric-word {
      display: inline-block;
      font-weight: inherit;
      font-size: inherit;
      letter-spacing: inherit;
      line-height: inherit;
      position: relative;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  }
}

.lyric-translation {
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  transition: font-size 0.2s ease;
  line-height: 1.4;
  text-shadow:
    0 0 2px rgba(0, 0, 0, 0.7),
    0 1px 1px rgba(0, 0, 0, 0.5),
    0 0 4px rgba(255, 255, 255, 0.2),
    1px 1px 1px rgba(0, 0, 0, 0.4),
    -1px -1px 1px rgba(0, 0, 0, 0.4);
}

.lyric-empty {
  text-align: center;
  color: var(--text-secondary);
  font-size: 16px;
  padding: 20px;
  text-shadow:
    0 0 2px rgba(0, 0, 0, 0.7),
    0 1px 1px rgba(0, 0, 0, 0.5),
    0 0 4px rgba(255, 255, 255, 0.2);
}
</style>
