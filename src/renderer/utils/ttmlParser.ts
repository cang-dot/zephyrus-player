/**
 * 简化版 TTML 歌词解析器
 * 
 * 基于 applemusic-like-lyrics 的 TTML 解析逻辑简化而来
 * 主要支持：行级时间戳 + 背景词（isBG）标记
 * 
 * 许可证：本文件基于 AGPL-3.0 协议的 applemusic-like-lyrics 项目代码
 */

import type { ILyricText } from '@/types/music';

/**
 * 解析 TTML 格式歌词
 * 支持格式：
 * - [00:25.47]歌词文本
 * - [00:25.47]<00:25.47>逐词歌词
 * - <span ttm:role="x-bg">背景词</span>（HTML标签内的背景词）
 */
export function parseTtml(lyricsStr: string): ILyricText[] {
  const lines = lyricsStr.trim().split('\n');
  const result: ILyricText[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 检测标准 LRC 格式
    const lrcMatch = trimmed.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/);
    if (lrcMatch) {
      const minutes = parseInt(lrcMatch[1], 10);
      const seconds = parseInt(lrcMatch[2], 10);
      const ms = lrcMatch[3] ? parseInt(lrcMatch[3].padEnd(3, '0'), 10) : 0;
      const startTime = minutes * 60000 + seconds * 1000 + ms;
      const text = lrcMatch[4].trim();

      if (text) {
        result.push({
          text,
          trText: '',
          startTime,
          isBG: false
        });
      }
      continue;
    }

    // 检测背景词标记：以 ( 开头的行视为背景词
    const bgMatch = trimmed.match(/^\((.+)\)$/);
    if (bgMatch) {
      const bgText = bgMatch[1].trim();
      if (bgText && result.length > 0) {
        // 关联到上一行歌词
        const lastLine = result[result.length - 1];
        result.push({
          text: bgText,
          trText: '',
          startTime: lastLine.startTime,
          isBG: true
        });
      }
      continue;
    }

    // 纯文本行
    if (trimmed && result.length > 0) {
      const lastLine = result[result.length - 1];
      result.push({
        text: trimmed,
        trText: '',
        startTime: lastLine.startTime,
        isBG: false
      });
    }
  }

  return result;
}

/**
 * 从 HTML 内容中提取背景词
 * 解析格式：<span ttm:role="x-bg">背景词文本</span>
 */
export function extractBackgroundFromHtml(html: string): string | null {
  const bgMatch = html.match(/<span[^>]*ttm:role="x-bg"[^>]*>([^<]*)<\/span>/i);
  if (bgMatch) {
    return bgMatch[1].trim();
  }
  return null;
}

/**
 * 将 TTML 解析结果转换为 lrcArray 格式
 * 背景词作为 isBG=true 的行插入到主歌词之后
 */
export function ttmlToLrcArray(ttmlLines: ILyricText[]): ILyricText[] {
  const result: ILyricText[] = [];
  let lastMainLine: ILyricText | null = null;

  for (const line of ttmlLines) {
    if (line.isBG) {
      // 背景词：紧跟在主歌词后面
      result.push(line);
      lastMainLine = null;
    } else {
      result.push(line);
      lastMainLine = line;
    }
  }

  return result;
}
