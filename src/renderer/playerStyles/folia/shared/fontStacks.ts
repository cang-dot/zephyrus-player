export function resolveThemeFontStack(
  fontStyle: string,
  customFont?: string
): string {
  if (customFont) return customFont
  const stacks: Record<string, string> = {
    default: '"Noto Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    serif: '"Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif',
    mono: '"JetBrains Mono", "Noto Sans Mono", "Cascadia Code", monospace',
    handwritten: '"ZCOOL KuaiLe", "Ma Shan Zheng", "STKaiti", "KaiTi", cursive'
  }
  return stacks[fontStyle] || stacks.default
}

export function resolveThemeTranslationFontStack(
  fontStyle: string
): string {
  return resolveThemeFontStack(fontStyle)
}
