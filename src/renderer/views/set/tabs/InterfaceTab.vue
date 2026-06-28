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
      <div class="text-base font-medium text-gray-900 dark:text-white">
        本地歌词文件
      </div>
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
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">已绑定的歌词文件</div>
        <div class="space-y-1">
          <div v-for="(item, index) in boundLyrics" :key="item.songId" class="sidebar-item">
            <div class="sidebar-item-left">
              <i class="ri-music-2-line sidebar-item-icon text-xs"></i>
              <div class="sidebar-item-name">
                <div class="text-xs">{{ item.songName }}</div>
                <div class="text-[10px] text-gray-400 truncate max-w-[200px]">{{ item.filePath.split(/[/\\]/).pop() }}</div>
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
        class="sidebar-item"
        :class="{ 'is-hidden': item.hidden }"
      >
        <div class="sidebar-item-left">
          <span class="sidebar-item-index">{{ index + 1 }}</span>
          <i :class="item.icon" class="sidebar-item-icon"></i>
          <span class="sidebar-item-name">{{ item.name }}</span>
        </div>
        <div class="sidebar-item-right">
          <button
            class="sidebar-btn"
            :disabled="index === 0"
            @click="moveUp(index)"
            title="上移"
          >
            <i class="ri-arrow-up-s-line"></i>
          </button>
          <button
            class="sidebar-btn"
            :disabled="index === sidebarItems.length - 1"
            @click="moveDown(index)"
            title="下移"
          >
            <i class="ri-arrow-down-s-line"></i>
          </button>
          <button
            v-if="item.path !== '/set'"
            class="sidebar-btn"
            :class="{ 'is-active': !item.hidden }"
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
import { inject, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { SETTINGS_DATA_KEY } from '../keys';
import SettingItem from '../SettingItem.vue';
import SettingSection from '../SettingSection.vue';
import SSelect from '../SSelect.vue';
import { usePlayerStore } from '@/store/modules/player';
import {
  getLocalLyricMap,
  getLocalLyricPath,
  setLocalLyricPath,
  removeLocalLyricPath,
  selectLyricFile,
  readLocalLyricFile
} from '@/utils/localLyricStorage';
import { parseLyrics } from '@/utils/yrcParser';
import { parseTtml } from '@/utils/ttmlParser';

const { t } = useI18n();
const setData = inject(SETTINGS_DATA_KEY)!;
const playerStore = usePlayerStore();

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
      lrcTimeArray: ttmlLines.map(l => l.startTime || 0)
    };
  } else {
    // LRC 格式
    const { lyrics } = parseLyrics(content);
    const lrcArray = lyrics.map(l => ({
      text: l.fullText,
      trText: '',
      words: l.words?.map(w => ({ text: w.text, startTime: w.startTime, duration: w.duration })),
      hasWordByWord: l.words && l.words.length > 1,
      startTime: l.startTime,
      duration: l.duration
    }));
    playerStore.playMusic.lyric = {
      lrcArray,
      lrcTimeArray: lrcArray.map(l => l.startTime || 0)
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

.sidebar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  transition: all 0.2s;
}

:global(.dark) .sidebar-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

:global(.dark) .sidebar-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-item.is-hidden {
  opacity: 0.5;
}

.sidebar-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-item-index {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  min-width: 16px;
}

:global(.dark) .sidebar-item-index {
  color: rgba(255, 255, 255, 0.4);
}

.sidebar-item-icon {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.7);
}

:global(.dark) .sidebar-item-icon {
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-item-name {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.85);
}

:global(.dark) .sidebar-item-name {
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-item-right {
  display: flex;
  gap: 4px;
}

.sidebar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.dark) .sidebar-btn {
  color: rgba(255, 255, 255, 0.5);
}

.sidebar-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.9);
}

:global(.dark) .sidebar-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sidebar-btn.is-active {
  color: #10b981;
}
</style>
