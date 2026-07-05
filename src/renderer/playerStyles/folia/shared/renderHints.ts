export type LineTimingClass = 'normal' | 'short' | 'micro'
export type LineTransitionMode = 'normal' | 'fast' | 'none'
export type WordRevealMode = 'normal' | 'fast' | 'instant'

export interface LineRenderHints {
  rawDuration: number
  timingClass: LineTimingClass
  renderEndTime: number
  lineTransitionMode: LineTransitionMode
  wordRevealMode: WordRevealMode
}

export const MICRO_LINE_DURATION_THRESHOLD = 0.10
export const SHORT_LINE_DURATION_THRESHOLD = 0.18
export const MICRO_LINE_RENDER_FLOOR = 0.067

function getTimingClass(rawDuration: number): LineTimingClass {
  if (rawDuration < MICRO_LINE_DURATION_THRESHOLD) return 'micro'
  if (rawDuration < SHORT_LINE_DURATION_THRESHOLD) return 'short'
  return 'normal'
}

function getLineTransitionMode(timingClass: LineTimingClass): LineTransitionMode {
  if (timingClass === 'micro') return 'none'
  if (timingClass === 'short') return 'fast'
  return 'normal'
}

function getWordRevealMode(timingClass: LineTimingClass): WordRevealMode {
  if (timingClass === 'micro') return 'instant'
  if (timingClass === 'short') return 'fast'
  return 'normal'
}

export function buildLineRenderHints(startTime: number, endTime: number): LineRenderHints {
  const rawDuration = Math.max(endTime - startTime, 0)
  const timingClass = getTimingClass(rawDuration)
  const lineTransitionMode = getLineTransitionMode(timingClass)
  const wordRevealMode = getWordRevealMode(timingClass)
  const lastWordEnd = endTime

  let renderEndTime: number

  if (lineTransitionMode === 'none') {
    renderEndTime = Math.max(endTime, startTime + MICRO_LINE_RENDER_FLOOR)
  } else {
    const exitDuration = Math.min(0.32, Math.max(0.18, Math.max(rawDuration, 0.12) * 0.18))
    const linePassHold = wordRevealMode === 'instant' ? 0 : 0.06
    const linePassStart = Math.max(lastWordEnd, startTime) + linePassHold
    const exitStart = Math.max(linePassStart, endTime - exitDuration)
    renderEndTime = Math.max(endTime, exitStart + exitDuration)
  }

  return { rawDuration, timingClass, renderEndTime, lineTransitionMode, wordRevealMode }
}

export interface RenderHintLineLike {
  startTime: number
  endTime: number
  words?: { endTime: number }[]
  renderHints?: LineRenderHints
}

export function getLineRenderHints<T extends RenderHintLineLike>(line: T | null | undefined): LineRenderHints | null {
  if (!line) return null
  return line.renderHints ?? buildLineRenderHints(line.startTime, line.endTime)
}

export function getLineRenderEndTime<T extends RenderHintLineLike>(line: T | null | undefined): number {
  if (!line) return Number.NEGATIVE_INFINITY
  return getLineRenderHints(line)?.renderEndTime ?? line.endTime
}
