// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import type { ILyricText } from '@/types/music'
import type { FoliaLine, FoliaWord } from './types'

export function zephyrusLyricToFolia(
  lrcArray: ILyricText[],
  lrcTimeArray: number[]
): FoliaLine[] {
  return lrcArray.map((item, idx) => {
    const startTime = lrcTimeArray[idx] ?? item.startTime ?? 0
    const endTime = lrcTimeArray[idx + 1] ?? (item.duration != null ? startTime + item.duration : startTime + 5)
    const fullText = item.text || ''
    const words: FoliaWord[] = []

    if (item.words && item.words.length > 0) {
      let accumulated = 0
      for (const w of item.words) {
        const wStart = startTime + (w.startTime || 0)
        const wEnd = startTime + (w.startTime || 0) + (w.duration || 0.3)
        const wText = fullText.slice(accumulated, accumulated + (w.text || '').length) || w.text || ''
        accumulated += (w.text || '').length
        words.push({
          text: wText,
          startTime: wStart,
          endTime: wEnd
        })
      }
    } else {
      const chars = Array.from(fullText)
      const charDuration = Math.max((endTime - startTime) / Math.max(chars.length, 1), 0.05)
      chars.forEach((char, ci) => {
        words.push({
          text: char,
          startTime: startTime + ci * charDuration,
          endTime: startTime + (ci + 1) * charDuration
        })
      })
    }

    return {
      words,
      startTime,
      endTime: endTime || startTime + 5,
      fullText,
      translation: item.trText || undefined
    }
  })
}

