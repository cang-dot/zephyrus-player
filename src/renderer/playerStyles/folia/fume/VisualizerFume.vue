<template>
  <div class="folia-fume-root w-full h-full overflow-hidden pointer-events-none select-none">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

import { useStyleContext } from '@/playerStyles/useStyleContext'
import { zephyrusLyricToFolia } from '../shared/lyricAdapter'

const ctx = useStyleContext()

const currentTime = computed(() => ctx.nowTime.value)
const rawLyrics = computed(() => ctx.lrcArray.value)
const lrcTimeArray = computed(() => rawLyrics.value.map((item) => item.startTime ?? 0))

const coverColor = computed(() => ctx.getCoverColor())
const primaryColor = computed(() => coverColor.value.primary || '#ffffff')
const accentColor = computed(() => {
  const c = ctx.getClimaxState()
  return c.isInClimax ? '#ff6b6b' : primaryColor.value
})

const lines = computed(() => zephyrusLyricToFolia(rawLyrics.value, lrcTimeArray.value))

const totalDuration = computed(() => {
  if (lines.value.length === 0) return 120
  return Math.max(lines.value[lines.value.length - 1]?.endTime || 120, 120)
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animFrameId = 0

interface WordItem {
  text: string
  time: number
  endTime: number
}

const allWords = computed<WordItem[]>(() => {
  const result: WordItem[] = []
  for (const line of lines.value) {
    for (const w of line.words) {
      result.push({ text: w.text, time: w.startTime, endTime: w.endTime })
    }
  }
  return result
})

const scrollSpeed = computed(() => ctx.getConfigValue?.('foliaFumeScrollSpeed') ?? 1)
const fontSizeRatio = computed(() => ctx.getConfigValue?.('foliaFumeFontSize') ?? 0.025)

function drawFrame(): void {
  const canvas = canvasRef.value
  if (!canvas) {
    animFrameId = requestAnimationFrame(drawFrame)
    return
  }
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) {
    animFrameId = requestAnimationFrame(drawFrame)
    return
  }

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (canvas.width !== w * dpr) canvas.width = w * dpr
  if (canvas.height !== h * dpr) canvas.height = h * dpr
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx2d.clearRect(0, 0, w, h)

  const t = currentTime.value
  const fontSize = Math.min(36, Math.max(14, w * fontSizeRatio.value))
  ctx2d.font = `400 ${fontSize}px "Noto Sans SC", PingFang SC, sans-serif`
  ctx2d.textBaseline = 'top'

  const lineH = fontSize * 1.5
  const padX = 24
  const colGap = 16
  const colW = Math.max(fontSize * 6, (w - padX * 2 - colGap) / 3)

  const words = allWords.value
  if (words.length === 0) {
    animFrameId = requestAnimationFrame(drawFrame)
    return
  }

  const totalDurationVal = totalDuration.value
  const baseScrollSpeed = scrollSpeed.value
  const scrollProgress = Math.min(1, t / totalDurationVal)
  const maxScroll = Math.max(0, (words.length / 2) * lineH - h * 0.5)
  const scrollY = scrollProgress * maxScroll * baseScrollSpeed

  const maxItems = words.length
  const itemsPerCol = Math.ceil(maxItems / 3)

  ctx2d.save()

  for (let col = 0; col < 3; col++) {
    const colStart = col * itemsPerCol
    const colEnd = Math.min(colStart + itemsPerCol, maxItems)
    const x = padX + col * (colW + colGap)

    for (let i = colStart; i < colEnd; i++) {
      const word = words[i]
      const row = i - colStart
      const y = row * lineH - scrollY + 40

      if (y < -lineH || y > h + lineH) continue

      const wordProgress = (t - word.time) / Math.max(word.endTime - word.time, 0.5)
      const isPast = wordProgress > 1
      const isNow = wordProgress >= 0 && wordProgress <= 1

      if (isNow) {
        const alpha = Math.min(1, 0.6 + wordProgress * 0.4)
        ctx2d.globalAlpha = alpha
        ctx2d.shadowColor = accentColor.value
        ctx2d.shadowBlur = fontSize * 0.6
        ctx2d.fillStyle = accentColor.value
      } else if (isPast) {
        const fadeAlpha = Math.max(0.08, 0.4 - wordProgress * 0.3)
        ctx2d.globalAlpha = fadeAlpha
        ctx2d.shadowBlur = 0
        ctx2d.fillStyle = primaryColor.value
      } else {
        const alpha = Math.max(0.1, 0.3 + wordProgress * 0.3)
        ctx2d.globalAlpha = alpha
        ctx2d.shadowBlur = 0
        ctx2d.fillStyle = primaryColor.value
      }

      ctx2d.fillText(word.text, x, y)
      ctx2d.shadowBlur = 0
    }
  }

  ctx2d.restore()
  ctx2d.globalAlpha = 1

  animFrameId = requestAnimationFrame(drawFrame)
}

onMounted(() => {
  animFrameId = requestAnimationFrame(drawFrame)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
.folia-fume-root {
  background: transparent;
}
</style>
