<template>
  <div
    class="folia-classic-root w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none"
  >
    <div
      class="relative z-10 w-full h-[70vh] flex items-center justify-center p-8"
      :style="breathingStyle"
    >
      <transition name="folia-fade" mode="out-in">
        <div
          v-if="showText && activeLine && displayWords.length > 0"
          :key="activeLine.startTime"
          class="flex flex-wrap w-full max-w-6xl content-center justify-center items-center"
          :style="{ perspective: '1000px', minHeight: '300px' }"
        >
          <span
            v-for="(word, idx) in displayWords"
            :key="`${idx}-${activeLine.startTime}`"
            class="font-bold inline-block origin-center relative will-change-transform whitespace-nowrap"
            :style="getWordStyle(word, idx)"
          >
            <span
              class="absolute inset-0 select-none pointer-events-none block"
              aria-hidden="true"
              :style="getGlowStyle(word, idx)"
            >{{ word.text }}</span>
            <span
              class="relative z-10 block"
              :style="getBodyStyle(word, idx)"
            >{{ word.text }}</span>
            <span
              v-if="isChorus(word, idx)"
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[150%] aspect-square rounded-full border pointer-events-none z-0"
              :class="chorusRippleClass"
              :style="{ borderColor: accentColor }"
            />
          </span>
        </div>

        <div
          v-else
          key="empty"
          class="absolute opacity-50"
          :style="{ color: secondaryColor, fontSize: emptyFontSize }"
        >
          聆听音乐...
        </div>
      </transition>
    </div>

    <div
      v-if="activeLine?.translation && !hideTranslation"
      class="absolute bottom-16 left-1/2 -translate-x-1/2 text-center z-20"
      :style="{ color: secondaryColor, fontSize: translationFontSize, maxWidth: '80vw' }"
    >
      {{ activeLine.translation }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

import { useStyleContext } from '@/playerStyles/useStyleContext'
import { zephyrusLyricToFolia } from '../shared/lyricAdapter'
import { buildLineRenderHints } from '../shared/renderHints'
import { buildPostLyricLayoutUnits, buildDisplayWordsFromLayoutUnits } from '../shared/cjkSemanticLayout'
import { colorWithAlpha } from '../shared/colorMix'

const ctx = useStyleContext()

const currentTime = computed(() => ctx.nowTime.value)
const currentLineIndex = computed(() => ctx.nowIndex.value)
const rawLyrics = computed(() => ctx.lrcArray.value)
const lrcTimeArray = computed(() => {
  const arr: number[] = []
  for (const item of rawLyrics.value) {
    arr.push(item.startTime ?? 0)
  }
  return arr
})

const coverColor = computed(() => ctx.getCoverColor())
const primaryColor = computed(() => coverColor.value.primary || '#ffffff')
const accentColor = computed(() => {
  const c = ctx.getClimaxState()
  return c.isInClimax ? '#ff6b6b' : primaryColor.value
})
const secondaryColor = computed(() => colorWithAlpha(primaryColor.value, 0.5))

const lines = computed(() => zephyrusLyricToFolia(rawLyrics.value, lrcTimeArray.value))

const activeLine = computed(() => {
  const idx = currentLineIndex.value
  if (idx < 0 || idx >= lines.value.length) return null
  return lines.value[idx]
})

const displayWords = computed(() => {
  const line = activeLine.value
  if (!line || line.fullText === '......') return line?.words || []
  const units = buildPostLyricLayoutUnits(line, { semantic: true, sticky: true })
  return buildDisplayWordsFromLayoutUnits(units)
})

const wordStatuses = ref<Record<number, 'waiting' | 'active' | 'passed'>>({})

watch(currentTime, (t) => {
  const line = activeLine.value
  if (!line) {
    wordStatuses.value = {}
    return
  }
  const hints = line.renderHints ?? buildLineRenderHints(line.startTime, line.endTime)
  const wordLookahead = hints.wordRevealMode === 'instant' ? 0.03 : hints.wordRevealMode === 'fast' ? 0.08 : 0.15
  const newStatuses: Record<number, 'waiting' | 'active' | 'passed'> = {}

  for (let i = 0; i < displayWords.value.length; i++) {
    const w = displayWords.value[i]
    if (t >= w.startTime - wordLookahead && t <= w.endTime) {
      newStatuses[i] = 'active'
    } else if (t > w.endTime) {
      newStatuses[i] = 'passed'
    } else {
      newStatuses[i] = 'waiting'
    }
  }
  wordStatuses.value = newStatuses
}, { flush: 'post' })

const showText = ref(true)
const hideTranslation = computed(() => !foliaShowTranslation.value)

const mainFontSize = computed(() => `clamp(2.25rem, 6vw, 4.5rem)`)
const emptyFontSize = computed(() => `clamp(1.5rem, 3.5vw, 2.25rem)`)
const translationFontSize = computed(() => `clamp(1.125rem, 2.6vw, 1.25rem)`)

function seededRandom(seed: number): () => number {
  return () => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }
}

function getWordLayout(_word: { text: string; startTime: number; endTime: number }, index: number, line: { startTime: number }) {
  const seed = line.startTime
  const rng = seededRandom(seed + index)
  const baseSpread = 20
  return {
    x: (rng() - 0.5) * baseSpread * 2,
    y: (rng() - 0.5) * baseSpread * 2,
    rotate: (rng() - 0.5) * 10,
    scale: 1.1 + rng() * 0.2,
    marginRight: '0.8rem'
  }
}

function getWordStatus(index: number): 'waiting' | 'active' | 'passed' {
  return wordStatuses.value[index] || 'waiting'
}

function isChorus(_word: { text: string; startTime: number; endTime: number }, _index: number): boolean {
  return !!activeLine.value?.isChorus
}

function getWordStyle(_word: { text: string; startTime: number; endTime: number }, index: number): Record<string, string> {
  const line = activeLine.value
  if (!line) return {}
  const layout = getWordLayout(_word, index, line)
  const status = getWordStatus(index)

  let transform: string
  let opacity: string
  let transition: string

  if (status === 'waiting') {
    transform = `translate(${layout.x + Math.sin(layout.y) * 50}px, ${layout.y + Math.cos(layout.x) * 30}px) scale(0.5) rotate(${layout.rotate + 20}deg)`
    opacity = '0'
    transition = 'all 0.4s ease'
  } else if (status === 'active') {
    transform = `translate(${layout.x}px, ${layout.y}px) scale(${layout.scale * 1.4}) rotate(${layout.rotate}deg)`
    opacity = '1'
    transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.1s ease'
  } else {
    transform = `translate(${layout.x}px, ${layout.y}px) scale(${layout.scale}) rotate(${layout.rotate}deg)`
    opacity = '0.82'
    transition = 'all 0.5s ease'
  }

  return {
    fontSize: mainFontSize.value,
    marginRight: layout.marginRight,
    transform,
    opacity,
    transition
  }
}

function getBodyStyle(_word: { text: string; startTime: number; endTime: number }, index: number): Record<string, string> {
  const status = getWordStatus(index)

  if (status === 'waiting') {
    return {
      color: primaryColor.value,
      filter: 'blur(10px)',
      transition: 'all 0.4s ease'
    }
  }
  if (status === 'active') {
    return {
      color: accentColor.value,
      filter: 'none',
      transition: 'color 0.2s linear, filter 0.2s ease'
    }
  }
  return {
    color: primaryColor.value,
    filter: 'none',
    transition: 'color 0.8s ease-in-out, filter 0.5s ease'
  }
}

function getGlowStyle(_word: { text: string; startTime: number; endTime: number }, index: number): Record<string, string> {
  const status = getWordStatus(index)

  if (status === 'waiting') {
    return {
      color: 'transparent',
      textShadow: 'none',
      transition: 'all 0.4s ease'
    }
  }
  if (status === 'active') {
    const glow = foliaGlowIntensity.value
    return {
      color: 'transparent',
      textShadow: `0 0 ${12 * glow}px ${accentColor.value}, 0 0 ${24 * glow}px ${accentColor.value}`,
      transition: 'text-shadow 0.3s ease'
    }
  }
  return {
    color: 'transparent',
    textShadow: 'none',
    transition: 'text-shadow 0.9s ease-out'
  }
}

const foliaFloatSpeed = computed(() => ctx.getConfigValue('foliaFloatSpeed') ?? 7)
const foliaGlowIntensity = computed(() => ctx.getConfigValue('foliaGlowIntensity') ?? 1)
const foliaShowTranslation = computed(() => ctx.getConfigValue('foliaShowTranslation') ?? true)

const chorusRippleClass = computed(() => 'folia-ripple')

const breathingStyle = computed(() => ({
  animation: `folia-float ${foliaFloatSpeed.value}s ease-in-out infinite`
}))

const viewportWidth = ref(1200)

function onResize(): void {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.folia-classic-root {
  background: transparent;
}

.folia-ripple {
  animation: folia-ripple-kf 0.5s ease-out forwards;
}

@keyframes folia-ripple-kf {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes folia-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

.folia-fade-enter-active,
.folia-fade-leave-active {
  transition: all 0.3s ease;
}
.folia-fade-enter-from {
  opacity: 0;
  filter: blur(10px);
  transform: scale(0.9);
}
.folia-fade-leave-to {
  opacity: 0;
  filter: blur(20px);
  transform: scale(1.1);
}
</style>
