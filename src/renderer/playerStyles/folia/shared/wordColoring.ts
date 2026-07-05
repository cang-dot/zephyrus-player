// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
export function resolveWordColor(
  wordText: string,
  wordColors?: { word: string; color: string }[],
  fallbackColor?: string
): string {
  if (!wordColors || wordColors.length === 0) return fallbackColor || '#ffffff'
  const match = wordColors.find(
    (wc) => wordText.toLowerCase().includes(wc.word.toLowerCase())
  )
  return match?.color || fallbackColor || '#ffffff'
}

