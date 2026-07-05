import { type Component, defineComponent, h, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';

import { registerExternalStyle, unregisterStyle } from '@/playerStyles/registry';
import type { InstalledPlugin, PluginStoreItem } from '@/types/plugin';

const activeStyleKeys = new Set<string>();

class PluginManager {
  public registry = reactive<PluginStoreItem[]>([]);
  public installed = reactive<Record<string, InstalledPlugin>>({});
  public loading = reactive({ registry: false, installing: '' });
  public error = reactive({ registry: '' });

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
    } catch {
      // silent
    }
  }

  async install(item: PluginStoreItem): Promise<void> {
    this.loading.installing = item.id;
    try {
      const result = await window.api.plugin.install(item);
      if (result) {
        (this.installed as any)[item.id] = result;
      }
      if (item.type === 'playerStyle' && result) {
        this.activatePlayerStyle(item.id);
      }
    } finally {
      this.loading.installing = '';
    }
  }

  async uninstall(pluginId: string): Promise<void> {
    if (activeStyleKeys.has(pluginId)) {
      this.deactivatePlayerStyle(pluginId);
    }
    await window.api.plugin.uninstall(pluginId);
    delete (this.installed as any)[pluginId];
  }

  async toggleEnabled(pluginId: string, enabled: boolean): Promise<void> {
    await window.api.plugin.toggleEnabled(pluginId, enabled);
    if ((this.installed as any)[pluginId]) {
      (this.installed as any)[pluginId].enabled = enabled;
    }
    const plugin = this.installed[pluginId];
    if (plugin?.manifest.type === 'playerStyle') {
      if (enabled) {
        this.activatePlayerStyle(pluginId);
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
      const blob = new Blob([plugin.payload.js], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const mod = await import(url);
      URL.revokeObjectURL(url);

      const exportDefault = mod.default || mod;
      const hasMount = typeof exportDefault?.mount === 'function';
      const renderMode = hasMount ? 'dom' : 'vue';

      if (renderMode === 'vue') {
        const comp = shallowRef(exportDefault as Component);
        registerExternalStyle({
          key: `plugin-${pluginId}`,
          label: plugin.manifest.name,
          component: comp.value,
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
    } catch {
      console.error(`[PluginManager] 激活播放器样式失败: ${pluginId}`);
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
