import { computed, ref, type Ref } from 'vue'

import type { FoliaLine } from './types'
import { buildLineRenderHints } from './renderHints'

export function useFoliaRuntime(lines: Ref<FoliaLine[]>, currentTime: Ref<number>) {
  const currentLineIndex = computed(() => {
    const t = currentTime.value
    let best = -1
    for (let i = 0; i < lines.value.length; i++) {
      const line = lines.value[i]
      if (t >= line.startTime && t < line.endTime) {
        return i
      }
      if (t >= line.endTime && (best === -1 || line.endTime > lines.value[best].endTime)) {
        best = i
      }
    }
    return best
  })

  const activeLine = computed<FoliaLine | null>(() => {
    const idx = currentLineIndex.value
    if (idx < 0 || idx >= lines.value.length) return null
    return lines.value[idx]
  })

  const upcomingLine = computed<FoliaLine | null>(() => {
    const idx = currentLineIndex.value
    if (idx < 0 || idx >= lines.value.length - 1) return null
    return lines.value[idx + 1]
  })

  const recentCompletedLine = computed<FoliaLine | null>(() => {
    const t = currentTime.value
    let best: FoliaLine | null = null
    for (const line of lines.value) {
      if (line.endTime <= t) {
        if (!best || line.endTime > best.endTime) {
          best = line
        }
      }
    }
    return best
  })

  const preparedLines = ref(new Set<FoliaLine>())

  function shouldPreheatLine(line: FoliaLine, window: number): boolean {
    if (preparedLines.value.has(line)) return false
    const diff = line.startTime - currentTime.value
    return diff <= window && diff > -line.endTime + line.startTime
  }

  function markPrepared(line: FoliaLine): void {
    const next = new Set(preparedLines.value)
    next.add(line)
    preparedLines.value = next
  }

  function getLineRenderEndTime(line: FoliaLine): number {
    const hints = line.renderHints ?? buildLineRenderHints(line.startTime, line.endTime)
    return hints.renderEndTime
  }

  return {
    currentLineIndex,
    activeLine,
    upcomingLine,
    recentCompletedLine,
    shouldPreheatLine,
    markPrepared,
    getLineRenderEndTime
  }
}
