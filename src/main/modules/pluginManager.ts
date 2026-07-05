import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

import { getStore } from './config';

const REGISTRY_URL =
  'https://raw.githubusercontent.com/cang-dot/zephyrus-player-plugins/main/index.json';
const CACHE_TTL_MS = 3600_000;

interface PluginStoreItem {
  id: string
  name: string
  description: string
  version: string
  type: string
  author: { name: string; url?: string }
  icon?: string
  screenshots?: string[]
  downloadUrl: string
  sourceRepo: string
  homepage?: string
  license?: string
  minAppVersion?: string
  tags?: string[]
  downloads?: number
  submittedAt?: string
  approvedAt?: string
}

interface InstalledPlugin {
  manifest: PluginStoreItem
  enabled: boolean
  installedAt: number
  payload?: Record<string, string>
}

export function initializePluginManager(): void {
  ipcMain.handle('plugin:get-registry', async () => {
    const store = getStore();
    const cached = store.get('plugins.registryCache') as
      | { data: PluginStoreItem[]; cachedAt: number }
      | undefined;

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const response = await fetch(REGISTRY_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const plugins: PluginStoreItem[] = json.plugins || [];

      store.set('plugins.registryCache', { data: plugins, cachedAt: Date.now() });
      return plugins;
    } catch {
      return cached?.data || [];
    }
  });

  ipcMain.handle('plugin:get-installed', async () => {
    const store = getStore();
    const installed = store.get('plugins.installed') as Record<string, InstalledPlugin> | undefined;
    return installed || {};
  });

  ipcMain.handle('plugin:install', async (_, item: PluginStoreItem) => {
    const store = getStore();
    const installed =
      (store.get('plugins.installed') as Record<string, InstalledPlugin> | undefined) || {};

    if (installed[item.id]) {
      throw new Error('插件已安装');
    }

    let payload: Record<string, string> | undefined;

    if (item.type === 'lxMusic' || item.type === 'translator') {
      try {
        const response = await fetch(item.downloadUrl);
        if (!response.ok) throw new Error(`下载失败: HTTP ${response.status}`);
        const content = await response.text();
        payload = { script: content };

        if (item.type === 'lxMusic') {
          const scripts = (store.get('set.lxMusicScripts') as any[]) || [];
          const newScript = {
            id: `plugin_${item.id}_${Date.now()}`,
            name: item.name,
            script: content,
            info: { name: item.name, rawScript: content },
            sources: [],
            enabled: true,
            createdAt: Date.now()
          };
          scripts.push(newScript);
          store.set('set.lxMusicScripts', scripts);
          store.set('set.activeLxMusicApiId', newScript.id);
        }
      } catch (e: any) {
        throw new Error(`下载插件失败: ${e.message}`);
      }
    }

    if (item.type === 'customApi') {
      try {
        const response = await fetch(item.downloadUrl);
        if (!response.ok) throw new Error(`下载失败: HTTP ${response.status}`);
        const content = await response.text();
        payload = { config: content };
        store.set('set.customApiPlugin', content);
        store.set('set.customApiPluginName', item.name);
      } catch (e: any) {
        throw new Error(`下载插件失败: ${e.message}`);
      }
    }

    if (item.type === 'playerStyle') {
      try {
        const response = await fetch(item.downloadUrl);
        if (!response.ok) throw new Error(`下载失败: HTTP ${response.status}`);
        const content = await response.text();
        payload = { js: content };
      } catch (e: any) {
        throw new Error(`下载插件失败: ${e.message}`);
      }
    }

    installed[item.id] = {
      manifest: item,
      enabled: true,
      installedAt: Date.now(),
      payload
    };

    store.set('plugins.installed', installed);
    return installed[item.id];
  });

  ipcMain.handle('plugin:uninstall', async (_, pluginId: string) => {
    const store = getStore();
    const installed =
      (store.get('plugins.installed') as Record<string, InstalledPlugin> | undefined) || {};
    const plugin = installed[pluginId];
    if (!plugin) throw new Error('插件未安装');

    if (plugin.manifest.type === 'lxMusic') {
      const scripts = (store.get('set.lxMusicScripts') as any[]) || [];
      const remaining = scripts.filter(
        (s: any) => !s.name.includes(plugin.manifest.name) && !s.id.includes(pluginId)
      );
      store.set('set.lxMusicScripts', remaining);
      if (remaining.length === 0) {
        store.set('set.activeLxMusicApiId', null);
      } else {
        store.set('set.activeLxMusicApiId', remaining[0].id);
      }
    }

    if (plugin.manifest.type === 'customApi') {
      store.set('set.customApiPlugin', '');
      store.set('set.customApiPluginName', '');
    }

    delete installed[pluginId];
    store.set('plugins.installed', installed);
    return true;
  });

  ipcMain.handle('plugin:toggle-enabled', async (_, pluginId: string, enabled: boolean) => {
    const store = getStore();
    const installed =
      (store.get('plugins.installed') as Record<string, InstalledPlugin> | undefined) || {};
    if (!installed[pluginId]) throw new Error('插件未安装');
    installed[pluginId].enabled = enabled;
    store.set('plugins.installed', installed);
    return true;
  });

  ipcMain.handle('plugin:import-file', async (_, type: string) => {
    const filters: Electron.FileFilter[] =
      type === 'lxMusic'
        ? [{ name: 'JavaScript Files', extensions: ['js'] }]
        : type === 'customApi'
          ? [{ name: 'JSON Files', extensions: ['json'] }]
          : [{ name: 'All Files', extensions: ['*'] }];

    const result = await dialog.showOpenDialog({
      title: '导入插件文件',
      filters,
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        name: path.basename(filePath, path.extname(filePath)),
        content,
        filePath
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle('plugin:refresh-registry', async () => {
    const store = getStore();
    try {
      const response = await fetch(REGISTRY_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const plugins: PluginStoreItem[] = json.plugins || [];
      store.set('plugins.registryCache', { data: plugins, cachedAt: Date.now() });
      return plugins;
    } catch {
      const cached = store.get('plugins.registryCache') as
        | { data: PluginStoreItem[]; cachedAt: number }
        | undefined;
      return cached?.data || [];
    }
  });
}
