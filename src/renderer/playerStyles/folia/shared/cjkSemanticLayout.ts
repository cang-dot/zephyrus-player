// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
export interface LyricLayoutUnit {
  text: string
  words: { text: string; startTime: number; endTime: number }[]
  startTime: number
  endTime: number
  isSemantic: boolean
  isSticky?: boolean
}

export function createSingleWordLayoutUnits(
  words: { text: string; startTime: number; endTime: number }[]
): LyricLayoutUnit[] {
  return words.map((w) => ({
    text: w.text,
    words: [w],
    startTime: w.startTime,
    endTime: w.endTime,
    isSemantic: false
  }))
}

const CJK_REGEX = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/
const STICKY_PUNCTUATION_REGEX = /^[,.;:!?锛屻€傦紒锛熴€侊細锛涳級銆戙€嬨€嶃€忋€塡]}'"鈥欌€濃€橾+$/u

function hasCjkText(text: string): boolean {
  return CJK_REGEX.test(text)
}

function isStickyTrailingPunctuation(text: string): boolean {
  return STICKY_PUNCTUATION_REGEX.test(text.trim())
}

function canAttachToPrevious(text: string): boolean {
  return /[\p{L}\p{N}]$/u.test(text.trimEnd())
}

export function buildPostLyricLayoutUnits(
  line: { fullText: string; words: { text: string; startTime: number; endTime: number }[] },
  options: { semantic?: boolean; sticky?: boolean } = {}
): LyricLayoutUnit[] {
  let units = createSingleWordLayoutUnits(line.words)

  if (options.semantic && hasCjkText(line.fullText)) {
    units = buildCjkSemanticLayoutUnits(line, units)
  }

  if (options.sticky) {
    units = applyStickyPunctuation(units)
  }

  return units
}

function buildCjkSemanticLayoutUnits(
  line: { fullText: string; words: { text: string; startTime: number; endTime: number }[] },
  fallback: LyricLayoutUnit[]
): LyricLayoutUnit[] {
  const Segmenter = Intl?.Segmenter
  if (!Segmenter) return fallback

  try {
    const segments = Array.from(
      new Segmenter(undefined, { granularity: 'word' }).segment(line.fullText)
    )
    const nonSpace = segments.filter((s) => !/^\s+$/.test(s.segment))
    if (nonSpace.length <= 1) return fallback

    const result: LyricLayoutUnit[] = []
    let wordIdx = 0
    let collected = ''

    for (const seg of nonSpace) {
      collected = ''
      const startWordIdx = wordIdx
      while (wordIdx < line.words.length && collected.length < seg.segment.length) {
        collected += line.words[wordIdx].text
        wordIdx++
      }
      if (collected !== seg.segment) return fallback

      const segWords = line.words.slice(startWordIdx, wordIdx)
      const first = segWords[0]
      const last = segWords[segWords.length - 1]
      if (!first || !last) return fallback

      const isCjkSemantic = Boolean(
        seg.isWordLike && hasCjkText(seg.segment) && segWords.length > 1
      )

      if (!seg.isWordLike && result.length > 0) {
        const prev = result[result.length - 1]
        prev.text += seg.segment
        prev.words.push(...segWords)
        prev.endTime = last.endTime
      } else {
        result.push({
          text: seg.segment,
          words: segWords,
          startTime: first.startTime,
          endTime: last.endTime,
          isSemantic: isCjkSemantic
        })
      }
    }

    if (wordIdx !== line.words.length || result.length === 0) return fallback
    return result
  } catch {
    return fallback
  }
}

function applyStickyPunctuation(units: LyricLayoutUnit[]): LyricLayoutUnit[] {
  const result: LyricLayoutUnit[] = []

  for (const unit of units) {
    if (
      result.length > 0 &&
      isStickyTrailingPunctuation(unit.text) &&
      canAttachToPrevious(result[result.length - 1].text)
    ) {
      const prev = result[result.length - 1]
      prev.text += unit.text
      prev.words.push(...unit.words)
      prev.endTime = unit.endTime
      prev.isSticky = true
    } else {
      result.push({ ...unit, words: [...unit.words] })
    }
  }

  return result
}

export function buildDisplayWordsFromLayoutUnits(
  units: LyricLayoutUnit[]
): { text: string; startTime: number; endTime: number }[] {
  return units.flatMap((unit) => {
    if (!unit.isSticky || unit.isSemantic) return unit.words
    return [
      {
        text: unit.text,
        startTime: unit.startTime,
        endTime: unit.endTime
      }
    ]
  })
}

