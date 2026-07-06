<template>
  <setting-section :title="t('settings.sections.plugins')">
    <div class="flex gap-1 mb-4 p-0.5 bg-gray-100 dark:bg-white/5 rounded-lg">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
        :class="[
          activeTab === tab.key
            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 浏览商店 -->
    <div v-show="activeTab === 'browse'">
      <div
        v-if="manager.loading.registry"
        class="flex items-center justify-center py-8 text-sm text-gray-400"
      >
        <i class="ri-loader-4-line animate-spin mr-2"></i>
        {{ t('common.loading') }}
      </div>
      <div
        v-else-if="manager.error.registry"
        class="flex flex-col items-center justify-center py-8 text-sm text-gray-400"
      >
        <i class="ri-error-warning-line text-2xl mb-2"></i>
        <p>{{ manager.error.registry }}</p>
        <s-btn class="mt-3" @click="refreshRegistry">
          {{ t('common.retry') }}
        </s-btn>
      </div>
      <div
        v-else-if="manager.registry.length === 0"
        class="flex items-center justify-center py-8 text-sm text-gray-400"
      >
        <i class="ri-inbox-line text-2xl mr-2"></i>
        {{ t('settings.plugins.empty') }}
      </div>
      <div v-else class="space-y-px">
        <plugin-card
          v-for="plugin in manager.registry"
          :key="plugin.id"
          :plugin="plugin"
          :is-installed="manager.isInstalled(plugin.id)"
          :installing="manager.loading.installing === plugin.id"
          :progress="manager.getProgress(plugin.id)"
          @install="handleInstall"
          @uninstall="handleUninstall"
        />
      </div>
    </div>

    <!-- 已安装 -->
    <div v-show="activeTab === 'installed'" class="space-y-px">
      <plugin-card
        v-for="plugin in installedPlugins"
        :key="plugin.manifest.id"
        :plugin="plugin.manifest"
        :is-installed="true"
        :installing="false"
        @uninstall="handleUninstall"
      />
      <div
        v-if="installedPlugins.length === 0"
        class="flex items-center justify-center py-8 text-sm text-gray-400"
      >
        <i class="ri-inbox-line text-2xl mr-2"></i>
        {{ t('settings.plugins.empty') }}
      </div>
    </div>

    <!-- 导入 -->
    <div v-show="activeTab === 'import'" class="space-y-4">
      <div class="flex flex-col items-center justify-center py-8 text-sm text-gray-400">
        <i class="ri-upload-cloud-line text-3xl mb-3"></i>
        <p class="mb-1">{{ t('settings.plugins.importHint') }}</p>
        <div class="flex gap-2 mt-2">
          <s-btn @click="importLxMusic"> <i class="ri-file-js-line"></i> lxMusic </s-btn>
          <s-btn @click="importCustomApi"> <i class="ri-file-json-line"></i> customApi </s-btn>
        </div>
      </div>
    </div>

    <!-- 本地开发 -->
    <div
      v-show="activeTab === 'localDev'"
      class="flex flex-col items-center justify-center py-8 text-sm text-gray-400"
    >
      <i class="ri-code-s-slash-line text-3xl mb-3"></i>
      <p>{{ t('settings.plugins.comingSoon') }}</p>
    </div>
  </setting-section>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import PluginCard from '@/components/plugins/PluginCard.vue';
import { pluginManager } from '@/services/pluginManager';
import type { PluginStoreItem } from '@/types/plugin';

import { SETTINGS_MESSAGE_KEY } from '../keys';
import SBtn from '../SBtn.vue';
import SettingSection from '../SettingSection.vue';

const { t } = useI18n();
const message = inject(SETTINGS_MESSAGE_KEY)!;
const manager = pluginManager;

const tabs = [
  { key: 'browse', label: t('settings.plugins.tabs.browse') },
  { key: 'installed', label: t('settings.plugins.tabs.installed') },
  { key: 'import', label: t('settings.plugins.tabs.import') },
  { key: 'localDev', label: t('settings.plugins.tabs.localDev') }
];

const activeTab = ref('browse');

const installedPlugins = computed(() => Object.values(manager.installed).filter((p) => p.enabled));

async function handleInstall(plugin: PluginStoreItem): Promise<void> {
  try {
    manager.clearProgress(plugin.id);
    await manager.install(plugin);
    message.success(`${t('common.success')}: ${plugin.name}`);
  } catch (e: any) {
    message.error(`${plugin.name}: ${e.message || t('settings.plugins.installFailed')}`);
  }
}

async function handleUninstall(plugin: PluginStoreItem): Promise<void> {
  try {
    await manager.uninstall(plugin.id);
    message.success(`${t('common.success')}: ${plugin.name}`);
  } catch (e: any) {
    message.error(`${plugin.name}: ${e.message || t('settings.plugins.uninstallFailed')}`);
  }
}

async function importLxMusic(): Promise<void> {
  const result = await window.api.plugin.importFile('lxMusic');
  if (result) {
    message.success(`${t('common.success')}: ${result.name}`);
  }
}

async function importCustomApi(): Promise<void> {
  const result = await window.api.plugin.importFile('customApi');
  if (result) {
    message.success(`${t('common.success')}: ${result.name}`);
  }
}

async function refreshRegistry(): Promise<void> {
  await manager.refreshRegistry();
}

onMounted(() => {
  manager.loadRegistry();
  manager.loadInstalled();
});
</script>
