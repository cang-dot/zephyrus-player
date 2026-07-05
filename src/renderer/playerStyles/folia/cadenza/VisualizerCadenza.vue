<!--
SPDX-License-Identifier: AGPL-3.0-only
Originally ported from Folia (AGPL-3.0) — see NOTICE
-->
<template>
  <div class="folia-cadenza-root w-full h-full overflow-hidden pointer-events-none select-none">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />
    <div class="absolute inset-0 w-full h-full">
      <span
        v-for="(item, idx) in overlayWords"
        :key="idx"
        class="absolute font-bold will-change-transform"
        :style="item.style"
      >{{ item.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

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

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animFrameId = 0

interface OverlayItem {
  text: string
  style: Record<string, string>
}

const overlayWords = ref<OverlayItem[]>([])

const radiusRatio = computed(() => ctx.getConfigValue?.('foliaCadenzaRadius') ?? 0.25)
const glowIntensity = computed(() => ctx.getConfigValue?.('foliaGlowIntensity') ?? 1)

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

  const line = activeLine.value
  if (!line) {
    overlayWords.value = []
    animFrameId = requestAnimationFrame(drawFrame)
    return
  }

  const t = currentTime.value
  const fontSize = Math.min(48, Math.max(20, w * 0.04))
  ctx2d.font = `700 ${fontSize}px "Noto Sans SC", sans-serif`

  const overlays: OverlayItem[] = []
  const totalWords = line.words.length
  const centerX = w / 2
  const centerY = h / 2
  const radius = Math.min(w, h) * radiusRatio.value
  const glow = glowIntensity.value

  for (let idx = 0; idx < totalWords; idx++) {
    const word = line.words[idx]
    const angleOffset = -Math.PI / 2
    const angle = angleOffset + (totalWords > 1 ? (idx / totalWords) * Math.PI * 2 : 0)
    const xPos = centerX + Math.cos(angle) * radius
    const yPos = centerY + Math.sin(angle) * radius

    const wordT = Math.max(0, Math.min(1, (t - word.startTime) / Math.max(word.endTime - word.startTime, 0.3)))
    const alpha = Math.min(1, wordT * 2)
    const scale = 0.5 + wordT * 0.5
    const isActive = t >= word.startTime && t <= word.endTime

    if (isActive) {
      const glowRadius = fontSize * 1.5 * glow
      ctx2d.shadowColor = accentColor.value
      ctx2d.shadowBlur = glowRadius
      ctx2d.fillStyle = accentColor.value
      ctx2d.globalAlpha = Math.min(1, 0.6 + alpha * 0.4)
      ctx2d.fillText(word.text, xPos - ctx2d.measureText(word.text).width / 2, yPos + fontSize / 3)
      ctx2d.shadowBlur = 0
      ctx2d.globalAlpha = 1
    }

    if (isActive) {
      overlays.push({
        text: word.text,
        style: {
          left: `${xPos}px`,
          top: `${yPos}px`,
          fontSize: `${fontSize * scale}px`,
          color: 'transparent',
          textShadow: `0 0 ${12 * glow}px ${accentColor.value}, 0 0 ${24 * glow}px ${accentColor.value}`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: `${Math.min(1, alpha * 1.2)}`,
          transition: 'text-shadow 0.3s ease, opacity 0.2s ease'
        }
      })
    } else {
      overlays.push({
        text: word.text,
        style: {
          left: `${xPos}px`,
          top: `${yPos}px`,
          fontSize: `${fontSize * scale}px`,
          color: colorWithAlpha(primaryColor.value, alpha * 0.5),
          textShadow: 'none',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: `${alpha * 0.6}`,
          transition: 'color 0.4s ease, opacity 0.3s ease'
        }
      })
    }
  }

  overlayWords.value = overlays
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
.folia-cadenza-root {
  background: transparent;
}
</style>

