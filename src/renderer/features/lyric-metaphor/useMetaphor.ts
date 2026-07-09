import { ref } from 'vue';

import { chatCompletion, type ChatMessage } from '@/features/ai/client';
import { getProvider } from '@/features/ai/providers';
import { isFeatureEnabled } from '@/features/store';

const STORAGE = 'lyric-metaphor-config';

interface MetaphorConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export function getMetaphorConfig(): MetaphorConfig {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as MetaphorConfig;
  } catch {}
  return { provider: 'pollinations', apiKey: '', model: 'openai', baseUrl: '' };
}

export function saveMetaphorConfig(config: MetaphorConfig) {
  localStorage.setItem(STORAGE, JSON.stringify(config));
}

export interface MetaphorState {
  loading: boolean;
  error: string;
  result: string;
  cached: boolean;
}

const cacheStore = new Map<string, string>();

export function useMetaphor() {
  const loading = ref(false);
  const error = ref('');
  const result = ref('');
  const cached = ref(false);

  async function analyze(
    lyrics: string,
    songName: string,
    artist: string
  ): Promise<void> {
    if (!isFeatureEnabled('lyric-metaphor')) {
      error.value = '歌词隐喻分析功能未启用，请在 设置 > 额外功能 中开启';
      return;
    }

    const cacheKey = `${artist}|${songName}|${lyrics.slice(0, 100)}`;
    const cachedResult = cacheStore.get(cacheKey);
    if (cachedResult) {
      result.value = cachedResult;
      cached.value = true;
      error.value = '';
      return;
    }

    loading.value = true;
    error.value = '';
    result.value = '';
    cached.value = false;

    const config = getMetaphorConfig();

    if (!config.provider && !config.baseUrl) {
      config.provider = 'pollinations';
      saveMetaphorConfig(config);
    }

    const provider = getProvider(config.provider);
    const systemPrompt = `你是一位专业的歌词分析专家。你的任务是：
1. 分析歌词中使用的修辞手法（隐喻、明喻、拟人、象征、双关等）
2. 解释每个隐喻的含义和背后的情感
3. 分析修辞手法如何增强歌曲的主题表达
4. 整体评价歌词的艺术效果

请用中文回答，使用 Markdown 格式排版。如果歌词没有明显的隐喻，也请如实说明。`;

    const userPrompt = `请分析以下歌词的修辞手法和隐喻含义：

**歌曲名称**：${songName}
**歌手**：${artist}

**歌词**：
${lyrics}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const res = await chatCompletion({
        providerId: provider ? config.provider : 'custom',
        apiKey: config.apiKey || undefined,
        model: config.model || provider?.defaultModel || 'openai',
        baseUrl: config.baseUrl || provider?.baseUrl,
        messages
      });
      result.value = res.content;
      cacheStore.set(cacheKey, res.content);
    } catch (e: any) {
      error.value = e?.message || '分析失败，请重试';
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    loading.value = false;
    error.value = '';
    result.value = '';
    cached.value = false;
  }

  return { loading, error, result, cached, analyze, clear };
}

export function clearMetaphorCache() {
  cacheStore.clear();
}
