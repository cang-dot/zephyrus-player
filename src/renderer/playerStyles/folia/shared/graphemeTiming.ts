// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import type { FoliaWord } from './types'

export interface GraphemeTiming {
  char: string
  startTime: number
  endTime: number
  wordIndex?: number
}

const graphemeSegmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null

export function splitLyricGraphemes(text: string): string[] {
  if (!text) return []
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment)
  }
  return Array.from(text)
}

function buildEvenGraphemeTimings(
  text: string,
  startTime: number,
  endTime: number,
  wordIndex?: number
): GraphemeTiming[] {
  const graphemes = splitLyricGraphemes(text)
  if (graphemes.length === 0) return []

  const duration = Math.max(endTime - startTime, 0)
  const unitDuration = duration / graphemes.length

  return graphemes.map((char, index) => ({
    char,
    startTime: startTime + unitDuration * index,
    endTime: index === graphemes.length - 1 ? endTime : startTime + unitDuration * (index + 1),
    ...(typeof wordIndex === 'number' ? { wordIndex } : {})
  }))
}

export function buildWordGraphemeTimings(word: FoliaWord, wordIndex?: number): GraphemeTiming[] {
  if (!word.syllables?.length) {
    return buildEvenGraphemeTimings(word.text, word.startTime, word.endTime, wordIndex)
  }

  return word.syllables.flatMap((syllable) =>
    buildEvenGraphemeTimings(syllable.text, syllable.startTime, syllable.endTime, wordIndex)
  )
}

