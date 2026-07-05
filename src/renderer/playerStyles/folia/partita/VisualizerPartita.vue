<template>
  <div class="folia-partita-root w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none">
    <div class="relative z-10 w-full max-w-6xl h-[70vh] flex gap-4 items-center justify-center p-8">
      <transition name="folia-fade" mode="out-in">
        <div v-if="showText && chunkList.length > 0" :key="activeKey" class="flex gap-6 h-full items-center justify-center flex-wrap">
          <div
            v-for="(chunk, ci) in chunkList"
            :key="ci"
            class="flex flex-wrap justify-center gap-x-2 gap-y-1"
            :style="{
              transform: `translateY(${chunk.offset}px)`,
              transition: 'transform 0.5s ease'
            }"
          >
            <span
              v-for="(wd, wi) in chunk.words"
              :key="wi"
              class="font-bold inline-block transition-all duration-500"
              :style="getWordStyle(wd, chunk.wordIndex + wi)"
            >{{ wd.text }}</span>
          </div>
        </div>
        <div v-else key="empty" class="absolute opacity-50" :style="{ color: secondaryColor }">
          聆听音乐...
        </div>
      </transition>
    </div>
    <div
      v-if="activeLine?.translation && foliaShowTranslation"
      class="absolute bottom-16 left-1/2 -translate-x-1/2 text-center z-20"
      :style="{ color: secondaryColor, fontSize: 'clamp(1rem, 2.2vw, 1.25rem)', maxWidth: '80vw' }"
    >
      {{ activeLine.translation }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useStyleContext } from '@/playerStyles/useStyleContext'
import { zephyrusLyricToFolia } from '../shared/lyricAdapter'
import { buildPostLyricLayoutUnits, buildDisplayWordsFromLayoutUnits } from '../shared/cjkSemanticLayout'
import { colorWithAlpha } from '../shared/colorMix'
import { buildLineRenderHints } from '../shared/renderHints'

const ctx = useStyleContext()

const currentTime = computed(() => ctx.nowTime.value)
const currentLineIndex = computed(() => ctx.nowIndex.value)
const rawLyrics = computed(() => ctx.lrcArray.value)
const lrcTimeArray = computed(() => rawLyrics.value.map((item) => item.startTime ?? 0))

const coverColor = computed(() => ctx.getCoverColor())
const primaryColor = computed(() => coverColor.value.primary || '#ffffff')
const secondaryColor = computed(() => colorWithAlpha(primaryColor.value, 0.5))
const accentColor = computed(() => {
  const c = ctx.getClimaxState()
  return c.isInClimax ? '#ff6b6b' : primaryColor.value
})

const lines = computed(() => zephyrusLyricToFolia(rawLyrics.value, lrcTimeArray.value))

const activeLine = computed(() => {
  const idx = currentLineIndex.value
  if (idx < 0 || idx >= lines.value.length) return null
  return lines.value[idx]
})

const activeKey = computed(() => activeLine.value?.startTime ?? 0)

const displayWords = computed(() => {
  const line = activeLine.value
  if (!line) return []
  const units = buildPostLyricLayoutUnits(line, { semantic: true, sticky: true })
  return buildDisplayWordsFromLayoutUnits(units)
})

interface ChunkItem {
  words: { text: string; startTime: number; endTime: number }[]
  offset: number
  wordIndex: number
}

const chunkList = computed<ChunkItem[]>(() => {
  const words = displayWords.value
  if (words.length === 0) return []

  const chunkSize = Math.max(1, Math.ceil(words.length / foliaPartitaChunks.value))
  const chunks: ChunkItem[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize)
    chunks.push({
      words: chunkWords,
      offset: (chunks.length % 2 === 0 ? -1 : 1) * 10 * (chunks.length + 1),
      wordIndex: i
    })
  }
  return chunks
})

const wordStatuses = ref<Record<string, 'waiting' | 'active' | 'passed'>>({})

watch(currentTime, (t) => {
  if (!activeLine.value) return
  const hints = activeLine.value.renderHints ?? buildLineRenderHints(activeLine.value.startTime, activeLine.value.endTime)
  const wordLookahead = hints.wordRevealMode === 'instant' ? 0.03 : hints.wordRevealMode === 'fast' ? 0.08 : 0.15
  const newStatuses: Record<string, 'waiting' | 'active' | 'passed'> = {}

  displayWords.value.forEach((w, i) => {
    if (t >= w.startTime - wordLookahead && t <= w.endTime) {
      newStatuses[i] = 'active'
    } else if (t > w.endTime) {
      newStatuses[i] = 'passed'
    } else {
      newStatuses[i] = 'waiting'
    }
  })
  wordStatuses.value = newStatuses
}, { flush: 'post' })

function getWordStatus(idx: number): 'waiting' | 'active' | 'passed' {
  return wordStatuses.value[idx] || 'waiting'
}

function getWordStyle(_wd: { text: string; startTime: number; endTime: number }, idx: number): Record<string, string> {
  const status = getWordStatus(idx)

  if (status === 'waiting') {
    return {
      opacity: '0.3',
      color: primaryColor.value,
      transform: 'translateY(-10px) scale(0.8)',
      filter: 'blur(4px)'
    }
  }
  if (status === 'active') {
    return {
      opacity: '1',
      color: accentColor.value,
      transform: 'translateY(0) scale(1)',
      filter: 'none',
      textShadow: `0 0 12px ${accentColor.value}`
    }
  }
  return {
    opacity: '0.6',
    color: primaryColor.value,
    transform: 'translateY(5px) scale(0.95)',
    filter: 'none'
  }
}

const foliaPartitaChunks = computed(() => ctx.getConfigValue('foliaPartitaChunks') ?? 3)
const foliaShowTranslation = computed(() => ctx.getConfigValue('foliaShowTranslation') ?? true)

const showText = ref(true)
</script>

<style scoped>
.folia-partita-root {
  background: transparent;
}
.folia-fade-enter-active,
.folia-fade-leave-active {
  transition: all 0.35s ease;
}
.folia-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.folia-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
