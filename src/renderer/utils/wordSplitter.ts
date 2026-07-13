/**
 * 词汇分割器 (Word Splitter)
 *
 * 支持 jieba 中文分词 + Intl.Segmenter 降级
 * 用于粗粝模式和狂躁模式的文字动画
 */

let jiebaReady = false;
let jiebaModule: any = null;

/**
 * 初始化 jieba-wasm
 */
async function initJieba(): Promise<void> {
  if (jiebaReady) return;

  try {
    const jieba = await import('jieba-wasm');
    jiebaModule = jieba;
    // 等待 WASM 加载完成
    if (typeof jieba.default === 'function') {
      await jieba.default();
    }
    jiebaReady = true;
  } catch (error) {
    console.warn('[WordSplitter] jieba-wasm 加载失败，使用降级方案:', error);
  }
}

/**
 * 使用 jieba 分词
 */
function splitWithJieba(text: string): string[] {
  if (!jiebaReady || !jiebaModule) return [];

  try {
    // jieba-wasm 的 cut 方法
    const result = jiebaModule.cut(text, false); // 精确模式
    return result.filter((word: string) => word.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * 使用 Intl.Segmenter 分词（浏览器原生）
 */
function splitWithSegmenter(text: string): string[] {
  try {
    const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
    const segments = [...segmenter.segment(text)];
    return segments
      .filter((s) => s.isWordLike)
      .map((s) => s.segment)
      .filter((w) => w.trim().length > 0);
  } catch {
    // 降级：中文按字拆分，英文按空格
    return text
      .split(/(?<=[\u4e00-\u9fff])|(?=[\u4e00-\u9fff])|\s+/)
      .filter(Boolean);
  }
}

/**
 * 分割歌词文本
 *
 * 优先使用 jieba，降级到 Intl.Segmenter
 *
 * @param text - 歌词文本
 * @returns 分词结果数组
 */
export function splitLyrics(text: string): string[] {
  if (!text) return [];

  // 尝试 jieba
  const jiebaResult = splitWithJieba(text);
  if (jiebaResult.length > 0) {
    return jiebaResult;
  }

  // 降级到 Intl.Segmenter
  return splitWithSegmenter(text);
}

/**
 * 检测是否为逐字歌词（YRC 格式）
 *
 * @param lyric - 歌词对象数组
 * @returns 是否包含逐字信息
 */
export function isWordByWordLyric(lyric: any[]): boolean {
  if (!lyric || lyric.length === 0) return false;
  return lyric.some((line) => line.words && line.words.length > 0);
}

/**
 * 获取逐字歌词的词组
 *
 * @param lyricLine - 单行歌词对象
 * @returns 词组数组 [{text, startTime, duration}]
 */
export function getWordByWordGroups(lyricLine: any): Array<{ text: string; startTime: number; duration: number }> {
  if (!lyricLine || !lyricLine.words) return [];

  const groups: Array<{ text: string; startTime: number; duration: number }> = [];
  let currentGroup = { text: '', startTime: 0, duration: 0 };

  for (const word of lyricLine.words) {
    if (word.text === ' ') {
      if (currentGroup.text) {
        groups.push({ ...currentGroup });
        currentGroup = { text: '', startTime: 0, duration: 0 };
      }
      continue;
    }

    if (!currentGroup.text) {
      currentGroup.startTime = word.startTime || 0;
      currentGroup.text = word.text;
      currentGroup.duration = word.duration || 0;
    } else {
      currentGroup.text += word.text;
      currentGroup.duration = (word.startTime || 0) + (word.duration || 0) - currentGroup.startTime;
    }
  }

  if (currentGroup.text) {
    groups.push(currentGroup);
  }

  return groups;
}

// 初始化 jieba
initJieba();
