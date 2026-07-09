<template>
  <n-modal
    :show="modelValue"
    title="AI 设置"
    preset="card"
    style="width: 480px; max-width: 90vw;"
    :mask-closable="false"
    @update:show="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">AI 提供商</label>
        <n-select
          v-model:value="config.provider"
          :options="providerOptions"
          @update:value="onProviderChange"
        />
        <p class="text-xs text-gray-400 mt-1">{{ currentProviderDesc }}</p>
      </div>

      <div v-if="needsApiKey">
        <label class="block text-sm font-medium mb-1">API 密钥</label>
        <n-input
          v-model:value="config.apiKey"
          type="password"
          show-password-on="click"
          placeholder="输入 API 密钥"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">模型名称</label>
        <n-input
          v-model:value="config.model"
          :placeholder="defaultModelPlaceholder"
        />
        <p class="text-xs text-gray-400 mt-1">留空则使用默认模型</p>
      </div>

      <div v-if="config.provider === 'custom'">
        <label class="block text-sm font-medium mb-1">API 地址</label>
        <n-input
          v-model:value="config.baseUrl"
          placeholder="https://your-api.com/v1"
        />
        <p class="text-xs text-gray-400 mt-1">完整的 Base URL，需兼容 OpenAI 格式</p>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <s-btn @click="handleCancel">取消</s-btn>
        <s-btn type="primary" @click="handleSave">保存</s-btn>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import { AI_PROVIDERS, getProvider } from '@/features/ai/providers';
import { getMetaphorConfig, saveMetaphorConfig } from '@/features/lyric-metaphor/useMetaphor';

import SBtn from '@/views/set/SBtn.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const config = reactive(getMetaphorConfig());

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const saved = getMetaphorConfig();
      config.provider = saved.provider;
      config.apiKey = saved.apiKey;
      config.model = saved.model;
      config.baseUrl = saved.baseUrl;
    }
  }
);

const providerOptions = AI_PROVIDERS.map((p) => ({
  label: p.name,
  value: p.id
}));

const needsApiKey = computed(() => {
  if (config.provider === 'custom') return false;
  const p = getProvider(config.provider);
  return p?.needApiKey ?? false;
});

const currentProviderDesc = computed(() => {
  const p = getProvider(config.provider);
  return p?.description || '';
});

const defaultModelPlaceholder = computed(() => {
  const p = getProvider(config.provider);
  if (config.provider === 'custom') return '输入模型名称';
  return p?.defaultModel || '';
});

function onProviderChange(providerId: string) {
  const p = getProvider(providerId);
  if (p) {
    config.model = p.defaultModel;
    config.baseUrl = '';
  }
}

function handleCancel() {
  emit('update:modelValue', false);
}

function handleSave() {
  saveMetaphorConfig({ ...config });
  emit('saved');
  emit('update:modelValue', false);
}
</script>
