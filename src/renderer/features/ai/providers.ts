export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  needApiKey: boolean;
  description: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'pollinations',
    name: 'Pollinations (免费)',
    baseUrl: 'https://text.pollinations.ai/v1',
    defaultModel: 'openai',
    needApiKey: false,
    description: '无需 API 密钥，开箱即用。基于 GPT-OSS-20B，支持中文。'
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'GLM-4.7-Flash',
    needApiKey: true,
    description: '永久免费模型，中文能力优秀。需注册获取 API Key。'
  },
  {
    id: 'agnes',
    name: 'Agnes AI',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    defaultModel: 'agnes-2.0-flash',
    needApiKey: true,
    description: '宣称无限免费，100万 token 上下文。需注册获取 API Key。'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
    needApiKey: true,
    description: '5M tokens 免费额度，推理能力强。需注册获取 API Key。'
  },
  {
    id: 'qwen',
    name: '阿里通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3.6-plus',
    needApiKey: true,
    description: '70M tokens 免费额度，中文原生支持。需注册获取 API Key。'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    needApiKey: true,
    description: '每天 1500 次免费请求。需注册 Google AI Studio 获取 API Key。'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/free',
    needApiKey: true,
    description: '聚合多模型平台，有免费模型池。需注册获取 API Key。'
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    defaultModel: '',
    needApiKey: false,
    description: '自定义 API 地址和模型，兼容 OpenAI 格式。'
  }
];

export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}
