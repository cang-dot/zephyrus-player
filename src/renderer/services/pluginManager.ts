import { type Component, defineComponent, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import { registerExternalStyle, unregisterStyle } from '@/playerStyles/registry';
import type { InstalledPlugin, PluginStoreItem } from '@/types/plugin';

export type InstallStatus = 'idle' | 'preparing' | 'requesting' | 'downloading' | 'installing' | 'done' | 'error';

export interface InstallProgress {
  status: InstallStatus;
  percent?: number;
}

const activeStyleKeys = new Set<string>();

class PluginManager {
  public registry = reactive<PluginStoreItem[]>([]);
  public installed = reactive<Record<string, InstalledPlugin>>({});
  public loading = reactive({ registry: false, installing: '' });
  public error = reactive({ registry: '' });
  public installProgress = reactive<Record<string, InstallProgress>>({});
  private removeProgressListener: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.api?.plugin?.onInstallProgress) {
      this.removeProgressListener = window.api.plugin.onInstallProgress((data) => {
        const existing = this.installProgress[data.pluginId];
        if (existing) {
          existing.status = data.status as InstallStatus;
          existing.percent = data.percent;
        } else {
          this.installProgress[data.pluginId] = {
            status: data.status as InstallStatus,
            percent: data.percent
          };
        }
      });
    }
  }

  getProgress(pluginId: string): InstallProgress {
    return this.installProgress[pluginId] || { status: 'idle' };
  }

  clearProgress(pluginId: string): void {
    delete this.installProgress[pluginId];
  }

  async loadRegistry(): Promise<void> {
    this.loading.registry = true;
    this.error.registry = '';
    try {
      this.registry.length = 0;
      const items = await window.api.plugin.getRegistry();
      items.forEach((item) => this.registry.push(item));
    } catch (e: any) {
      this.error.registry = e.message || '加载插件列表失败';
    } finally {
      this.loading.registry = false;
    }
  }

  async refreshRegistry(): Promise<void> {
    this.loading.registry = true;
    this.error.registry = '';
    try {
      this.registry.length = 0;
      const items = await window.api.plugin.refreshRegistry();
      items.forEach((item) => this.registry.push(item));
    } catch (e: any) {
      this.error.registry = e.message || '刷新插件列表失败';
    } finally {
      this.loading.registry = false;
    }
  }

  async loadInstalled(): Promise<void> {
    try {
      const items = await window.api.plugin.getInstalled();
      Object.assign(this.installed, items);
      console.log('[PluginManager] 已安装插件:', Object.keys(items));
      // 激活已安装且已启用的播放器样式插件
      for (const pluginId of Object.keys(items)) {
        const plugin = items[pluginId];
        if (plugin?.manifest?.type === 'playerStyle') {
          // 旧插件没有 compiled 且不是 v2，触发补编译
          if (plugin.enabled && !plugin.payload?.compiled && !/^return\s*\{\s*default\s*:/.test(plugin.payload?.js || '')) {
            console.log(`[PluginManager] 旧插件补编译: ${pluginId}`);
            await window.api.plugin.preCompile(pluginId).catch((e) =>
              console.error(`[PluginManager] 补编译失败: ${pluginId}`, e)
            );
            // 重新获取编译后的数据
            const updated = await window.api.plugin.getInstalled();
            Object.assign(this.installed, updated);
          }
          if (plugin.enabled) {
            console.log(`[PluginManager] 启动激活样式: ${pluginId}`);
            this.activatePlayerStyle(pluginId).catch((e) =>
              console.error(`[PluginManager] 启动激活样式失败: ${pluginId}`, e)
            );
          }
        }
      }
    } catch {
      // silent
    }
  }

  async install(item: PluginStoreItem): Promise<void> {
    this.loading.installing = item.id;
    this.installProgress[item.id] = { status: 'preparing' };
    try {
      const raw = JSON.parse(JSON.stringify(item));
      const result = await window.api.plugin.install(raw);
      if (result) {
        (this.installed as any)[item.id] = result;
      }
      if (item.type === 'playerStyle' && result) {
        this.activatePlayerStyle(item.id).catch((e) =>
          console.error(`[PluginManager] 安装后激活样式失败: ${item.id}`, e)
        );
      }
      this.installProgress[item.id] = { status: 'done' };
    } catch (e: any) {
      this.installProgress[item.id] = { status: 'error' };
      throw e;
    } finally {
      this.loading.installing = '';
    }
  }

  async uninstall(pluginId: string): Promise<void> {
    if (activeStyleKeys.has(pluginId)) {
      this.deactivatePlayerStyle(pluginId);
    }
    try {
      await window.api.plugin.uninstall(pluginId);
    } catch (e: any) {
      console.error(`[PluginManager] IPC uninstall failed for ${pluginId}:`, e);
      throw e;
    }
    delete (this.installed as any)[pluginId];
    console.log(`[PluginManager] Removed ${pluginId} from local state`);
  }

  async toggleEnabled(pluginId: string, enabled: boolean): Promise<void> {
    await window.api.plugin.toggleEnabled(pluginId, enabled);
    if ((this.installed as any)[pluginId]) {
      (this.installed as any)[pluginId].enabled = enabled;
    }
    const plugin = this.installed[pluginId];
    if (plugin?.manifest.type === 'playerStyle') {
      if (enabled) {
        this.activatePlayerStyle(pluginId).catch((e) =>
          console.error(`[PluginManager] 启用样式失败: ${pluginId}`, e)
        );
      } else {
        this.deactivatePlayerStyle(pluginId);
      }
    }
  }

  isInstalled(pluginId: string): boolean {
    return !!this.installed[pluginId];
  }

  isEnabled(pluginId: string): boolean {
    return this.installed[pluginId]?.enabled ?? false;
  }

  async activatePlayerStyle(pluginId: string): Promise<void> {
    const plugin = this.installed[pluginId];
    if (!plugin?.payload?.js) return;

    try {
      // v2 格式直接使用 payload.js，旧格式使用 payload.compiled 或运行时编译
      let code: string = plugin.payload.compiled || plugin.payload.js || '';

      // 如果既没有 compiled 也不是 v2，运行时编译（兼容旧插件）
      if (!/return\s*\{\s*default\s*:/.test(code) || /export\s*\{/.test(code)) {
        code = code
          .replace(/^\s*let X;\s*$/gm, '')
          .replace(/^\(function\(\)\{var s=document\.createElement\('style'\);[\s\S]*?\}\)\(\);\s*/m, '')
          .replace(
            /(var\s+__sh_\w+\s*=\s*\{\s*\}\s*;\s*)\(function\s*\(\s*\)\s*\{['"]use strict['"];\s*/g,
            '$1\n'
          )
          .replace(/^\}\)\(\)\s*;?\s*$/gm, '')
          .replace(/\bvar\s+([$\w]+)\s*=\s*var\s+\1\s*=/g, 'var $1 =')
          .replace(/^\s*(const|let)\s+/gm, 'var ')
          .replace(/\bclass\s+([$\w]+)\s*(extends\s+[^{]+?)?\s*\{/g, (_: string, name: string, ext: string) => {
            return `var ${name} = class ${ext ? ext.trim() : ''} {`;
          })
          .replace(
            /export\s*\{\s*([$\w]+)\s+as\s+default\s*\}\s*;?/g,
            'return { default: $1 };'
          );

        // 跨 IIFE 重命名重复 var 声明
        const blocks = code.split(/(?=^\s*var\s+__sh_)/m);
        const declared = new Set<string>();
        code = blocks.map((block) => {
          const decls = [...block.matchAll(/^\s*var\s+([$\w]+)/gm)].map((m) => m[1]);
          let result = block;
          for (const v of decls) {
            if (v.startsWith('__sh_')) continue;
            if (declared.has(v)) {
              let s = 2;
              while (declared.has(`${v}_${s}`)) s++;
              const nv = `${v}_${s}`;
              result = result.replace(new RegExp(`\\bvar\\s+${v}\\b`, 'g'), `var ${nv}`);
              result = result.replace(new RegExp(`\\b${v}\\b`, 'g'), nv);
              declared.add(nv);
            } else {
              declared.add(v);
            }
          }
          return result;
        }).join('');
      }

      console.log(`[PluginManager] 正在加载插件 (new Function): ${pluginId}`);
      let mod: any;
      try {
        const fn = new Function(code);
        mod = fn();
        console.log(`[PluginManager] 插件加载成功: ${pluginId}`, mod);
      } catch (e: any) {
        console.error(`[PluginManager] 加载插件失败: ${pluginId}`, e?.message || e);
        return;
      }

      const exportDefault = mod.default || mod;
      if (!exportDefault || (typeof exportDefault !== 'object' && typeof exportDefault !== 'function')) {
        console.error(`[PluginManager] 插件 ${pluginId} 未导出有效组件`);
        return;
      }

      const hasMount = typeof exportDefault?.mount === 'function';
      const renderMode = hasMount ? 'dom' : 'vue';

      if (renderMode === 'vue') {
        registerExternalStyle({
          key: `plugin-${pluginId}`,
          label: plugin.manifest.name,
          component: exportDefault as Component,
          renderMode: 'vue',
          externalId: pluginId,
          settings: exportDefault.settings
        });
      } else {
        const adapter = createDomAdapter(exportDefault);
        registerExternalStyle({
          key: `plugin-${pluginId}`,
          label: plugin.manifest.name,
          component: adapter,
          renderMode: 'dom',
          externalId: pluginId,
          settings: exportDefault.settings
        });
      }
      activeStyleKeys.add(pluginId);
      console.log(`[PluginManager] 样式已注册: plugin-${pluginId} (renderMode: ${renderMode})`);
    } catch (e: any) {
      console.error(`[PluginManager] 激活播放器样式失败: ${pluginId}`, e?.message || e);
    }
  }

  deactivatePlayerStyle(pluginId: string): void {
    unregisterStyle(`plugin-${pluginId}`);
    activeStyleKeys.delete(pluginId);
  }
}

function createDomAdapter(pluginModule: any): Component {
  let cleanup: (() => void) | void;

  return defineComponent({
    name: 'ExternalDomStyle',
    props: {
      coverUrl: String,
      songName: String,
      artist: String,
      album: String,
      duration: Number,
      currentTime: Number,
      progressPercent: Number,
      isPlaying: Boolean,
      currentLyricLine: String,
      isClimax: Boolean,
      energy: Number,
      coverColor: String,
      accentColor: String,
      lyricLines: Array
    },
    setup(props) {
      const container = ref<HTMLElement | null>(null);

      const ctx = () => ({
        coverUrl: props.coverUrl,
        songName: props.songName,
        artist: props.artist,
        album: props.album,
        duration: props.duration,
        currentTime: props.currentTime,
        progressPercent: props.progressPercent,
        isPlaying: props.isPlaying,
        currentLyricLine: props.currentLyricLine,
        isClimax: props.isClimax,
        energy: props.energy,
        coverColor: props.coverColor,
        accentColor: props.accentColor,
        lyricLines: props.lyricLines,
        togglePlay: () => {},
        seekTo: () => {},
        nextTrack: () => {},
        prevTrack: () => {}
      });

      onMounted(() => {
        if (container.value && pluginModule.mount) {
          cleanup = pluginModule.mount(container.value, ctx());
        }
      });

      watch(
        () => [props.currentTime, props.isPlaying, props.songName, props.progressPercent, props.currentLyricLine],
        () => {
          if (container.value && pluginModule.update) {
            pluginModule.update(container.value, ctx());
          }
        },
        { flush: 'post' }
      );

      onBeforeUnmount(() => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        } else if (pluginModule.cleanup) {
          pluginModule.cleanup();
        }
      });

      return () => h('div', { ref: container, class: 'plugin-dom-root', style: { width: '100%', height: '100%' } });
    }
  });
}

export const pluginManager = new PluginManager();
