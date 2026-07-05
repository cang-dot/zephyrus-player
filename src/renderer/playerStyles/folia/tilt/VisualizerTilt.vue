<!--
SPDX-License-Identifier: AGPL-3.0-only
Originally ported from Folia (AGPL-3.0) — see NOTICE
-->
<template>
  <div class="folia-tilt-root w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none">
    <div class="relative z-10 w-full h-[70vh] flex flex-col items-center justify-center p-8 gap-4">
      <transition name="folia-fade" mode="out-in">
        <div v-if="showText && segments.length > 0" :key="activeKey" class="flex flex-col items-center gap-3">
          <div
            v-for="(seg, si) in segments"
            :key="si"
            class="flex flex-wrap justify-center gap-[0.15em]"
            :class="seg.isTilt ? 'italic font-light' : 'font-normal'"
            :style="{
              fontSize: seg.isTilt ? 'clamp(2.5rem, 7vw, 5rem)' : 'clamp(1.5rem, 4vw, 3rem)',
              letterSpacing: seg.isTilt ? '0.15em' : '0.08em',
              color: primaryColor
            }"
          >
            <span
              v-for="(char, ci) in seg.chars"
              :key="ci"
              class="inline-block transition-all duration-300"
              :style="getCharStyle(si, ci)"
            >{{ char }}</span>
          </div>
        </div>
        <div v-else key="empty" class="absolute opacity-50" :style="{ color: secondaryColor }">
          鑱嗗惉闊充箰...
        </div>
      </transition>
    </div>
    <div
      v-if="activeLine?.translation && !hideTranslation"
      class="absolute bottom-16 left-1/2 -translate-x-1/2 text-center z-20"
      :style="{ color: secondaryColor, fontSize: 'clamp(1rem, 2.2vw, 1.25rem)', maxWidth: '80vw' }"
    >
      {{ activeLine.translation }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'

import { useStyleContext } from '@/playerStyles/useStyleContext'
import { zephyrusLyricToFolia } from '../shared/lyricAdapter'
import { colorWithAlpha } from '../shared/colorMix'

const ctx = useStyleContext()

const currentTime = computed(() => ctx.nowTime.value)
const currentLineIndex = computed(() => ctx.nowIndex.value)
const rawLyrics = computed(() => ctx.lrcArray.value)
const lrcTimeArray = computed(() => rawLyrics.value.map((item) => item.startTime ?? 0))

const coverColor = computed(() => ctx.getCoverColor())
const primaryColor = computed(() => coverColor.value.primary || '#ffffff')
const secondaryColor = computed(() => colorWithAlpha(primaryColor.value, 0.5))

const lines = computed(() => zephyrusLyricToFolia(rawLyrics.value, lrcTimeArray.value))

const activeLine = computed(() => {
  const idx = currentLineIndex.value
  if (idx < 0 || idx >= lines.value.length) return null
  return lines.value[idx]
})

const activeKey = computed(() => activeLine.value?.startTime ?? 0)

const foliaTiltSplitCount = computed(() => ctx.getConfigValue('foliaTiltSplitCount') ?? 2)
const foliaShowTranslation = computed(() => ctx.getConfigValue('foliaShowTranslation') ?? true)

const charRevealProgress = ref(0)
const tiltSeed = ref(0)

interface Segment {
  chars: string[]
  isTilt: boolean
}

const segments = computed<Segment[]>(() => {
  const line = activeLine.value
  if (!line || !line.fullText) return []

  const text = line.fullText
  const segs: Segment[] = []
  const count = foliaTiltSplitCount.value

  const parts = splitText(text, count)
  parts.forEach((part, i) => {
    segs.push({
      chars: Array.from(part),
      isTilt: i === count - 1
    })
  })
  return segs
})

function splitText(text: string, targetCount: number): string[] {
  if (targetCount <= 1 || text.length < 6) return [text]
  const mid = Math.floor(text.length / 2)
  const candidates = [
    { pos: findSplit(text, mid - 2), score: 0 },
    { pos: findSplit(text, mid), score: 1 },
    { pos: findSplit(text, mid + 2), score: 2 }
  ]
  candidates.sort((a, b) => Math.abs(a.pos - mid) - Math.abs(b.pos - mid))
  const splitPos = candidates[0].pos
  return [text.slice(0, splitPos).trim(), text.slice(splitPos).trim()]
}

function findSplit(text: string, near: number): number {
  const punct = [',', '.', '锛?, '銆?, '銆?, '锛?, '锛?, '!', '?', '锛?, '锛?, ' ', '銆€']
  for (const p of punct) {
    const idx = text.indexOf(p, Math.max(0, near))
    if (idx > 0 && idx < text.length - 1) return idx + 1
    const idx2 = text.lastIndexOf(p, Math.min(text.length - 1, near))
    if (idx2 > 0) return idx2 + 1
  }
  return Math.max(1, near)
}

watch(currentTime, (t) => {
  const line = activeLine.value
  if (!line) {
    charRevealProgress.value = 0
    return
  }
  const totalDur = Math.max(line.endTime - line.startTime, 0.5)
  const elapsed = Math.max(0, t - line.startTime)
  charRevealProgress.value = Math.min(elapsed / totalDur, 1)
})

function getCharStyle(si: number, ci: number): Record<string, string> {
  const totalChars = segments.value.reduce((s, seg) => s + seg.chars.length, 0)
  if (totalChars === 0) return { opacity: '0' }

  const flatIdx = segments.value
    .slice(0, si)
    .reduce((s, seg) => s + seg.chars.length, 0) + ci
  const revealAt = flatIdx / totalChars
  const revealed = charRevealProgress.value >= revealAt
  const delay = revealAt * 0.5

  if (!revealed) {
    return { opacity: '0', transform: 'translateY(8px)', transitionDelay: `${delay}s` }
  }
  return {
    opacity: '1',
    transform: 'translateY(0)',
    color: si === 1 ? accentColor.value : primaryColor.value,
    transitionDelay: `${delay}s`
  }
}

const accentColor = computed(() => {
  const c = ctx.getClimaxState()
  return c.isInClimax ? '#ff6b6b' : primaryColor.value
})

const showText = ref(true)
const hideTranslation = computed(() => !foliaShowTranslation.value)

onMounted(() => {
  tiltSeed.value = Date.now()
})
</script>

<style scoped>
.folia-tilt-root {
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

