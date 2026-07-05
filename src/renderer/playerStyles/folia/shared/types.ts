export interface FoliaSyllable {
  text: string
  startTime: number
  endTime: number
  endsWithSpace?: boolean
}

export interface FoliaWord {
  text: string
  startTime: number
  endTime: number
  syllables?: FoliaSyllable[]
}

export interface FoliaLine {
  words: FoliaWord[]
  startTime: number
  endTime: number
  fullText: string
  translation?: string
  renderHints?: any
  isChorus?: boolean
  chorusEffect?: 'bars' | 'circles' | 'beams'
}

export interface FoliaTheme {
  name: string
  backgroundColor: string
  primaryColor: string
  accentColor: string
  secondaryColor: string
  fontStyle: 'sans' | 'serif' | 'mono'
  animationIntensity: 'calm' | 'normal' | 'chaotic'
  wordColors?: { word: string; color: string }[]
}
