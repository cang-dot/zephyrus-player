<template>
  <component v-if="renderMode === 'vue'" :is="styleDef?.component" v-bind="$attrs" />
  <div
    v-else
    ref="domContainer"
    class="plugin-dom-root"
    :style="{ width: '100%', height: '100%' }"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { PlayerStyleDefinition } from '@/playerStyles/registry';
import { getStyle } from '@/playerStyles/registry';

const props = defineProps<{
  styleKey: string;
}>();

const domContainer = ref<HTMLDivElement | null>(null);
let domPlugin: any = null;

const styleDef = computed<PlayerStyleDefinition | undefined>(() => getStyle(props.styleKey));

const renderMode = computed(() => styleDef.value?.renderMode ?? 'vue');

onMounted(async () => {
  if (renderMode.value !== 'dom') return;

  const ctx = buildStyleContext();
  domPlugin = await loadDomPlugin(styleDef.value!);

  if (domContainer.value && domPlugin?.mount) {
    domPlugin.mount(domContainer.value, ctx);
  }
});

onBeforeUnmount(() => {
  if (domPlugin?.cleanup) {
    domPlugin.cleanup();
  }
  domPlugin = null;
});

const ATTRS = [
  'coverUrl',
  'songName',
  'artist',
  'album',
  'duration',
  'currentTime',
  'progressPercent',
  'isPlaying',
  'currentLyricLine',
  'isClimax',
  'energy',
  'coverColor',
  'accentColor',
  'lyricLines'
] as const;

function buildStyleContext() {
  const ctx: Record<string, any> = {};
  for (const key of ATTRS) {
    ctx[key] = (props as any)[key];
  }
  ctx.togglePlay = () => {};
  ctx.seekTo = () => {};
  ctx.nextTrack = () => {};
  ctx.prevTrack = () => {};
  return ctx;
}

async function loadDomPlugin(def: PlayerStyleDefinition): Promise<any> {
  if (def.externalId) {
    const installed = (await window.api.plugin.getInstalled()) || {};
    const plugin = installed[def.externalId];
    if (plugin?.payload?.js) {
      try {
        let jsCode = plugin.payload.js;
        const defaultMatch = jsCode.match(/export\s*\{\s*(\w+)\s+as\s+default\s*\}/s);
        const defaultName = defaultMatch?.[1];
        jsCode = jsCode.replace(/export\s*\{[^}]*\};?/gs, '');
        jsCode = jsCode.replace(/export\s+default\s+\w+;?/g, '');
        if (defaultName) {
          jsCode += `\nmodule.exports = ${defaultName};`;
        }
        const exports: any = {};
        const moduleObj = { exports };
        const fn = new Function('module', 'exports', jsCode);
        fn(moduleObj, exports);
        return moduleObj.exports?.default || moduleObj.exports || exports.default || exports;
      } catch {
        return null;
      }
    }
  }
  return null;
}
</script>
