<template>
  <setting-section :title="t('settings.sections.interface')">
    <!-- 启动默认页 -->
    <setting-item
      :title="t('settings.interface.defaultPage')"
      :description="t('settings.interface.defaultPageDesc')"
    >
      <s-select
        v-model="setData.defaultPage"
        :options="defaultPageOptions"
        width="w-40 max-md:w-full"
      />
    </setting-item>
  </setting-section>

  <!-- 本地歌词文件指定 -->
  <div class="mt-4">
    <div class="mb-2">
      <div class="text-base font-medium text-gray-900 dark:text-white">本地歌词文件</div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        为当前歌曲指定本地 TTML/LRC 歌词文件（也可右键歌曲绑定）
      </div>
    </div>
    <div class="space-y-2">
      <div class="sidebar-item" v-if="currentSongId">
        <div class="sidebar-item-left">
          <i class="ri-file-music-line sidebar-item-icon"></i>
          <div class="sidebar-item-name">
            <div class="text-sm font-medium">{{ currentSongName }}</div>
            <div class="text-xs text-gray-400">{{ localLyricPath || '未指定歌词文件' }}</div>
          </div>
        </div>
        <div class="sidebar-item-right">
          <button class="sidebar-btn" @click="selectLocalLyric" title="选择歌词文件">
            <i class="ri-folder-open-line"></i>
          </button>
          <button v-if="localLyricPath" class="sidebar-btn" @click="clearLocalLyric" title="清除">
            <i class="ri-close-line"></i>
          </button>
        </div>
      </div>
      <div v-else class="text-sm text-gray-400 italic">请先播放一首歌曲</div>

      <!-- 已绑定歌词列表 -->
      <div v-if="boundLyrics.length > 0" class="mt-3">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          已绑定的歌词文件
        </div>
        <div class="space-y-1">
          <div v-for="(item, index) in boundLyrics" :key="item.songId" class="sidebar-item">
            <div class="sidebar-item-left">
              <i class="ri-music-2-line sidebar-item-icon text-xs"></i>
              <div class="sidebar-item-name">
                <div class="text-xs">{{ item.songName }}</div>
                <div class="text-[10px] text-gray-400 truncate max-w-[200px]">
                  {{ item.filePath.split(/[/\\]/).pop() }}
                </div>
              </div>
            </div>
            <div class="sidebar-item-right">
              <button class="sidebar-btn" @click="removeBoundLyric(item.songId)" title="解除绑定">
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 桌面歌词设置 -->
  <div class="mt-4">
    <div class="mb-2">
      <div class="text-base font-medium text-gray-900 dark:text-white">桌面歌词</div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        自定义桌面歌词的字体、颜色和描边（重启歌词窗口后生效）
      </div>
    </div>
    <div class="space-y-3">
      <!-- 字体 -->
      <setting-item title="字体" description="选择已安装的系统字体，留空使用默认">
        <div class="font-select-wrapper relative w-full max-w-[260px]">
          <input
            ref="fontInputRef"
            v-model="setData.lyricFontFamily"
            type="text"
            class="font-select-input w-full px-3 py-1.5 rounded-lg border text-sm bg-white dark:bg-white/10 outline-none transition-colors"
            :class="fontDropdownOpen
              ? 'font-select-input--open'
              : 'border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30'"
            placeholder="搜索字体..."
            @focus="openFontDropdown"
            @input="onFontSearchInput"
            @keydown.escape="fontDropdownOpen = false"
            @keydown.enter.prevent="onFontEnter"
            @keydown.down.prevent="onFontArrowDown"
            @keydown.up.prevent="onFontArrowUp"
          />
          <button
            v-if="setData.lyricFontFamily"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none"
            @click="clearFont"
          >&times;</button>
          <Transition name="fade">
            <div
              v-if="fontDropdownOpen && filteredFonts.length > 0"
              class="absolute z-50 mt-1 w-full max-h-[280px] overflow-y-auto rounded-xl border bg-white shadow-lg dark:bg-neutral-900 dark:border-neutral-700"
            >
              <div
                v-for="(font, idx) in filteredFonts"
                :key="font"
                class="flex cursor-pointer items-center px-3 py-2 text-sm transition-colors"
                :class="[
                  idx === fontHighlightIndex
                    ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5',
                  setData.lyricFontFamily === font ? 'font-medium' : ''
                ]"
                :style="{ fontFamily: font }"
                @mousedown.prevent="selectFont(font)"
                @mouseenter="fontHighlightIndex = idx"
              >
                {{ font }}
              </div>
            </div>
          </Transition>
        </div>
      </setting-item>

      <!-- 文本颜色 -->
      <setting-item title="文本颜色" description="歌词文字颜色，留空跟随主题">
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="setData.lyricTextColor || '#ffffff'"
            class="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-white/20"
            @input="onColorInput($event, 'lyricTextColor')"
          />
          <button
            class="px-2 py-0.5 text-xs rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            @click="setData.lyricTextColor = ''; sendLyricStyle()"
          >重置</button>
        </div>
      </setting-item>

      <!-- 描边颜色 -->
      <setting-item title="描边颜色" description="歌词文字描边/阴影颜色，留空无描边">
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="setData.lyricStrokeColor || '#000000'"
            class="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-white/20"
            @input="onColorInput($event, 'lyricStrokeColor')"
          />
          <button
            class="px-2 py-0.5 text-xs rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            @click="setData.lyricStrokeColor = ''; sendLyricStyle()"
          >重置</button>
        </div>
      </setting-item>

      <!-- 封面取色 -->
      <setting-item title="封面取色" description="自动跟随当前播放歌曲封面提取颜色">
        <n-switch v-model:value="setData.lyricUseCoverColor" @update:value="sendLyricStyle" />
      </setting-item>
    </div>
  </div>

  <!-- 侧边栏项目排序（独立区域） -->
  <div class="mt-4">
    <div class="mb-2">
      <div class="text-base font-medium text-gray-900 dark:text-white">
        {{ t('settings.interface.sidebarOrder') }}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ t('settings.interface.sidebarOrderDesc') }}
      </div>
    </div>
    <div class="sidebar-sorter">
      <div
        v-for="(item, index) in sidebarItems"
        :key="item.path"
        class="flex items-center justify-between px-3 py-2 rounded-lg border transition-all"
        :class="
          item.hidden
            ? 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/8 opacity-50'
            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/8 hover:bg-gray-100 dark:hover:bg-white/8'
        "
      >
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400 dark:text-white/40 min-w-[16px]">{{ index + 1 }}</span>
          <i :class="item.icon" class="text-base text-gray-600 dark:text-white/80"></i>
          <span class="text-[13px] text-gray-800 dark:text-white/90">{{ item.name }}</span>
        </div>
        <div class="flex gap-1">
          <button
            class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="index === 0"
            @click="moveUp(index)"
            title="上移"
          >
            <i class="ri-arrow-up-s-line"></i>
          </button>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="index === sidebarItems.length - 1"
            @click="moveDown(index)"
            title="下移"
          >
            <i class="ri-arrow-down-s-line"></i>
          </button>
          <button
            v-if="item.path !== '/set'"
            class="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            :class="
              item.hidden
                ? 'text-gray-400 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'
                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            "
            @click="toggleHidden(item.path)"
            :title="item.hidden ? '显示' : '隐藏'"
          >
            <i :class="item.hidden ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NSwitch } from 'naive-ui';

import { usePlayerStore } from '@/store/modules/player';
import {
  getLocalLyricMap,
  getLocalLyricPath,
  readLocalLyricFile,
  removeLocalLyricPath,
  selectLyricFile,
  setLocalLyricPath
} from '@/utils/localLyricStorage';
import { parseTtml } from '@/utils/ttmlParser';
import { parseLyrics } from '@/utils/yrcParser';

import { SETTINGS_DATA_KEY } from '../keys';
import SettingItem from '../SettingItem.vue';
import SettingSection from '../SettingSection.vue';
import SSelect from '../SSelect.vue';

const { t } = useI18n();
const setData = inject(SETTINGS_DATA_KEY)!;
const playerStore = usePlayerStore();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function sendLyricStyle() {
  window.electron.ipcRenderer.send('lyric-update-style', {
    fontFamily: setData.value.lyricFontFamily || '',
    textColor: setData.value.lyricTextColor || '',
    strokeColor: setData.value.lyricStrokeColor || '',
    useCoverColor: setData.value.lyricUseCoverColor !== false
  });
}

function debouncedSendLyricStyle() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(sendLyricStyle, 400);
}

function onColorInput(event: Event, key: string) {
  const target = event.target as HTMLInputElement;
  setData.value[key] = target.value;
  sendLyricStyle();
}

// ── 字体选择下拉 ──
const fontList = ref<string[]>([]);
const fontDropdownOpen = ref(false);
const fontSearchQuery = ref('');
const fontHighlightIndex = ref(0);
const fontInputRef = ref<HTMLInputElement | null>(null);

const filteredFonts = computed(() => {
  const q = fontSearchQuery.value.toLowerCase().trim();
  if (!q) return fontList.value.slice(0, 200);
  return fontList.value.filter((name) => name.toLowerCase().includes(q)).slice(0, 200);
});

function openFontDropdown() {
  fontDropdownOpen.value = true;
  fontHighlightIndex.value = 0;
}

function onFontSearchInput() {
  fontSearchQuery.value = setData.value.lyricFontFamily || '';
  fontDropdownOpen.value = true;
  fontHighlightIndex.value = 0;
  debouncedSendLyricStyle();
}

function onFontEnter() {
  if (filteredFonts.value[fontHighlightIndex.value]) {
    selectFont(filteredFonts.value[fontHighlightIndex.value]);
  }
}

function onFontArrowDown() {
  fontHighlightIndex.value = Math.min(fontHighlightIndex.value + 1, filteredFonts.value.length - 1);
  scrollFontIntoView();
}

function onFontArrowUp() {
  fontHighlightIndex.value = Math.max(fontHighlightIndex.value - 1, 0);
  scrollFontIntoView();
}

function scrollFontIntoView() {
  // 滚动到高亮项
}

function selectFont(name: string) {
  setData.value.lyricFontFamily = name;
  fontDropdownOpen.value = false;
  fontSearchQuery.value = name;
  sendLyricStyle();
}

function clearFont() {
  setData.value.lyricFontFamily = '';
  fontSearchQuery.value = '';
  sendLyricStyle();
  fontInputRef.value?.focus();
}

function onFontClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.font-select-wrapper')) {
    fontDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onFontClickOutside);
  window.api.invoke('get-system-fonts').then((fonts: string[]) => {
    fontList.value = fonts as string[];
  });
});

onUnmounted(() => {
  document.removeEventListener('click', onFontClickOutside);
});

// 本地歌词相关
const currentSongId = computed(() => playerStore.playMusic?.id?.toString() || '');
const currentSongName = computed(() => playerStore.playMusic?.name || '');

const localLyricPath = computed(() => {
  if (!currentSongId.value) return null;
  return getLocalLyricPath(currentSongId.value);
});

// 所有已绑定的歌词列表
const boundLyrics = computed(() => {
  const map = getLocalLyricMap();
  const playerStore = usePlayerStore();
  return Object.entries(map).map(([songId, filePath]) => {
    // 尝试从播放列表中获取歌曲名
    let songName = `歌曲 ${songId}`;
    const playList = playerStore.playList;
    if (playList) {
      const found = playList.find((item: any) => item.id?.toString() === songId);
      if (found) songName = found.name || songName;
    }
    return { songId, songName, filePath };
  });
});

async function selectLocalLyric() {
  if (!currentSongId.value) return;
  const filePath = await selectLyricFile();
  if (filePath) {
    setLocalLyricPath(currentSongId.value, filePath);
    // 重新加载歌词
    await reloadCurrentLyric();
  }
}

function clearLocalLyric() {
  if (!currentSongId.value) return;
  removeLocalLyricPath(currentSongId.value);
}

function removeBoundLyric(songId: string) {
  removeLocalLyricPath(songId);
}

async function reloadCurrentLyric() {
  if (!currentSongId.value) return;
  const filePath = getLocalLyricPath(currentSongId.value);
  if (!filePath) return;

  const content = await readLocalLyricFile(filePath);
  if (!content) return;

  // 根据文件扩展名判断格式
  const isTtml = filePath.toLowerCase().endsWith('.ttml');
  if (isTtml) {
    const ttmlLines = parseTtml(content);
    // 触发歌词更新
    playerStore.playMusic.lyric = {
      lrcArray: ttmlLines,
      lrcTimeArray: ttmlLines.map((l) => l.startTime || 0)
    };
  } else {
    // LRC 格式
    const { lyrics } = parseLyrics(content);
    const lrcArray = lyrics.map((l) => ({
      text: l.fullText,
      trText: '',
      words: l.words?.map((w) => ({ text: w.text, startTime: w.startTime, duration: w.duration })),
      hasWordByWord: l.words && l.words.length > 1,
      startTime: l.startTime,
      duration: l.duration
    }));
    playerStore.playMusic.lyric = {
      lrcArray,
      lrcTimeArray: lrcArray.map((l) => l.startTime || 0)
    };
  }
}

// 所有侧边栏项目定义
const allSidebarRoutes = [
  { path: '/', icon: 'icon-Home', nameKey: 'comp.home' },
  { path: '/search', icon: 'icon-Search', nameKey: 'comp.search' },
  { path: '/list', icon: 'icon-Paper', nameKey: 'comp.list' },
  { path: '/album', icon: 'ri-album-fill', nameKey: 'comp.newAlbum.title' },
  { path: '/toplist', icon: 'ri-bar-chart-grouped-fill', nameKey: 'comp.toplist' },
  { path: '/podcast', icon: 'ri-radio-fill', nameKey: 'podcast.podcast' },
  { path: '/history', icon: 'icon-a-TicketStar', nameKey: 'comp.history' },
  { path: '/local-music', icon: 'ri-folder-music-fill', nameKey: 'comp.localMusic' },
  { path: '/user', icon: 'icon-Profile', nameKey: 'comp.my' },
  { path: '/set', icon: 'ri-settings-3-fill', nameKey: 'comp.settings' }
];

// 启动默认页选项
const defaultPageOptions = computed(() => [
  { label: t('comp.home'), value: '/' },
  { label: t('comp.search'), value: '/search' },
  { label: t('comp.list'), value: '/list' },
  { label: t('comp.newAlbum.title'), value: '/album' },
  { label: t('comp.toplist'), value: '/toplist' },
  { label: t('podcast.podcast'), value: '/podcast' },
  { label: t('comp.history'), value: '/history' },
  { label: t('comp.localMusic'), value: '/local-music' },
  { label: t('comp.my'), value: '/user' },
  { label: t('comp.settings'), value: '/set' }
]);

// 侧边栏项目列表（带翻译名称）
const sidebarItems = computed(() => {
  const order = setData.value?.sidebarItems?.order || [];
  const hidden = setData.value?.sidebarItems?.hidden || [];

  // 按用户定义的顺序排列
  const sorted = [...allSidebarRoutes].sort((a, b) => {
    const indexA = order.indexOf(a.path);
    const indexB = order.indexOf(b.path);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return sorted.map((item) => ({
    ...item,
    name: t(item.nameKey),
    hidden: hidden.includes(item.path)
  }));
});

// 上移
function moveUp(index: number) {
  if (index <= 0) return;
  const order = getOrderedPaths();
  [order[index - 1], order[index]] = [order[index], order[index - 1]];
  saveOrder(order);
}

// 下移
function moveDown(index: number) {
  const order = getOrderedPaths();
  if (index >= order.length - 1) return;
  [order[index], order[index + 1]] = [order[index + 1], order[index]];
  saveOrder(order);
}

// 切换隐藏状态
function toggleHidden(path: string) {
  if (path === '/set') return; // 设置页不可隐藏
  const hidden = setData.value?.sidebarItems?.hidden || [];
  const index = hidden.indexOf(path);
  if (index === -1) {
    hidden.push(path);
  } else {
    hidden.splice(index, 1);
  }
  setData.value.sidebarItems = {
    ...setData.value.sidebarItems,
    hidden: [...hidden]
  };
}

// 获取当前顺序
function getOrderedPaths(): string[] {
  const order = setData.value?.sidebarItems?.order || [];
  const allPaths = allSidebarRoutes.map((r) => r.path);

  // 合并：用户定义的顺序 + 新增的路径
  const merged = [...order];
  for (const path of allPaths) {
    if (!merged.includes(path)) {
      merged.push(path);
    }
  }
  return merged;
}

// 保存顺序
function saveOrder(order: string[]) {
  setData.value.sidebarItems = {
    ...setData.value?.sidebarItems,
    order
  };
}
</script>

<style scoped>
.sidebar-sorter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 280px;
  max-width: 400px;
}

.font-select-wrapper input {
  padding-right: 24px;
}

.font-select-input--open {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb, 34, 197, 94), 0.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
