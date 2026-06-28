<template>
  <div class="download-page h-full w-full bg-white dark:bg-black transition-colors duration-500">
    <n-scrollbar class="h-full">
      <div class="download-content pb-32">
        <!-- Hero Section -->
        <section class="hero-section relative overflow-hidden rounded-tl-2xl">
          <!-- Background with Blur -->
          <div class="hero-bg absolute inset-0 -top-20">
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-3xl opacity-50 dark:opacity-30"
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-black/80 dark:to-black"
            ></div>
          </div>

          <!-- Hero Content -->
          <div class="hero-content relative z-10 page-padding-x pt-10 pb-8">
            <div class="flex flex-col md:flex-row gap-8 items-center md:items-end">
              <div class="cover-wrapper relative group">
                <div
                  class="cover-container relative w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-[var(--accent-color)]/10 flex items-center justify-center shadow-2xl ring-4 ring-white/50 dark:ring-neutral-800/50"
                >
                  <i class="ri-download-cloud-2-line text-6xl text-[var(--accent-color)] opacity-80" />
                </div>
              </div>

              <div class="info-content text-center md:text-left">
                <div class="badge mb-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-xs font-semibold uppercase tracking-wider"
                  >
                    {{ t('download.title') }}
                  </span>
                </div>
                <h1
                  class="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight"
                >
                  {{
                    tabName === 'downloading'
                      ? t('download.tabs.downloading')
                      : t('download.tabs.downloaded')
                  }}
                </h1>
                <p class="mt-4 text-sm md:text-base text-neutral-500 dark:text-neutral-400">
                  {{
                    tabName === 'downloading'
                      ? t('download.progress.total', { progress: totalProgress.toFixed(1) })
                      : t('download.count', { count: downloadedList.length })
                  }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Action Bar (Sticky) -->
        <section
          class="action-bar sticky top-0 z-20 page-padding-x py-3 md:py-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800/50"
        >
          <div class="flex items-center justify-between gap-4">
            <!-- Tabs (Segment Control) -->
            <div class="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
              <button
                v-for="tab in ['downloading', 'downloaded']"
                :key="tab"
                class="px-6 py-1.5 rounded-lg text-sm font-medium transition-all"
                :class="
                  tabName === tab
                    ? 'bg-white dark:bg-neutral-800 text-[var(--accent-color)] shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                "
                @click="tabName = tab"
              >
                {{ t(`download.tabs.${tab}`) }}
              </button>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-3">
              <button
                v-if="tabName === 'downloaded' && downloadedList.length > 0"
                class="action-btn-pill flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 border border-neutral-200 dark:border-neutral-800"
                @click="showClearConfirm = true"
              >
                <i class="ri-delete-bin-line text-lg" />
                <span class="hidden md:inline">{{ t('download.clearAll') }}</span>
              </button>

              <button
                class="action-btn-icon w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                @click="openDownloadPath"
              >
                <i class="ri-folder-open-line text-lg" />
              </button>

              <button
                class="action-btn-icon w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                @click="showSettingsDrawer = true"
              >
                <i class="ri-settings-3-line text-lg" />
              </button>
            </div>
          </div>
        </section>

        <!-- List Section -->
        <section class="list-section page-padding-x mt-6">
          <!-- Downloading List -->
          <div v-if="tabName === 'downloading'" class="downloading-container">
            <div v-if="downloadList.length === 0" class="empty-state py-20 text-center">
              <i
                class="ri-download-cloud-2-line text-5xl mb-4 text-neutral-200 dark:text-neutral-800"
              />
              <p class="text-neutral-400">{{ t('download.empty.noTasks') }}</p>
            </div>
            <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div
                v-for="item in downloadList"
                :key="item.path"
                class="downloading-item group p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
              >
                <div class="flex items-center gap-4">
                  <n-image
                    :src="getImgUrl(item.songInfo?.picUrl, '100y100')"
                    class="w-12 h-12 rounded-xl flex-shrink-0"
                    preview-disabled
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                      <div class="truncate pr-4">
                        <span class="text-sm font-bold text-neutral-900 dark:text-white">{{
                          item.filename
                        }}</span>
                        <span class="ml-2 text-xs text-neutral-400">{{
                          item.songInfo?.ar?.map((a) => a.name).join(', ')
                        }}</span>
                      </div>
                      <span
                        class="text-xs font-medium"
                        :class="item.status === 'error' ? 'text-red-500' : 'text-[var(--accent-color)]'"
                      >
                        {{ getStatusText(item) }}
                      </span>
                    </div>
                    <div
                      class="relative h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden"
                    >
                      <div
                        class="absolute inset-y-0 left-0 bg-[var(--accent-color)] transition-all duration-300"
                        :class="{ 'bg-red-500': item.status === 'error' }"
                        :style="{ width: `${item.progress}%` }"
                      ></div>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-[10px] text-neutral-400"
                        >{{ formatSize(item.loaded) }} / {{ formatSize(item.total) }}</span
                      >
                      <span class="text-[10px] text-neutral-400"
                        >{{ item.progress.toFixed(1) }}%</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Downloaded List -->
          <div v-else class="downloaded-container">
            <n-spin :show="isLoadingDownloaded">
              <div v-if="downloadedList.length === 0" class="empty-state py-20 text-center">
                <i
                  class="ri-inbox-archive-line text-5xl mb-4 text-neutral-200 dark:text-neutral-800"
                />
                <p class="text-neutral-400">{{ t('download.empty.noDownloaded') }}</p>
                <p class="text-xs text-neutral-500 mt-2">
                  {{ t('download.empty.noDownloadedHint') }}
                </p>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="(item, index) in downList"
                  :key="item.path"
                  class="downloaded-item group animate-item p-3 rounded-2xl flex items-center gap-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                  :style="{ animationDelay: `${index * 0.03}s` }"
                >
                  <div
                    class="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                  >
                    <img
                      :src="getImgUrl(item.picUrl, '100y100')"
                      class="w-full h-full object-cover"
                    />
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      @click="handlePlayMusic(item)"
                    >
                      <i class="ri-play-fill text-white text-xl" />
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-neutral-900 dark:text-white truncate">{{
                        item.displayName || item.filename
                      }}</span>
                      <span class="text-xs text-neutral-400 flex-shrink-0">{{
                        formatSize(item.size)
                      }}</span>
                    </div>
                    <div class="flex items-center gap-4 mt-1">
                      <span class="text-xs text-neutral-500 truncate max-w-[150px]">{{
                        item.ar?.map((a) => a.name).join(', ')
                      }}</span>
                      <div
                        class="hidden md:flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full truncate"
                      >
                        <i class="ri-folder-line" />
                        <span class="truncate">{{ shortenPath(item.path) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <button
                          class="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-all"
                          @click="copyPath(item.path)"
                        >
                          <i class="ri-file-copy-line" />
                        </button>
                      </template>
                      {{ t('download.path.copy') || '澶嶅埗璺緞' }}
                    </n-tooltip>
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <button
                          class="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-all"
                          @click="openDirectory(item.path)"
                        >
                          <i class="ri-folder-open-line" />
                        </button>
                      </template>
                      {{ t('download.settingsPanel.open') }}
                    </n-tooltip>
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <button
                          class="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          @click="handleDelete(item)"
                        >
                          <i class="ri-delete-bin-line" />
                        </button>
                      </template>
                      {{ t('common.delete') }}
                    </n-tooltip>
                  </div>
                </div>
              </div>
            </n-spin>
          </div>
        </section>
      </div>
    </n-scrollbar>

    <!-- 鍒犻櫎纭瀵硅瘽妗?-->
    <n-modal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      type="warning"
      :title="t('download.delete.title')"
      :content="
        t('download.delete.message', {
          filename: itemToDelete?.displayName || itemToDelete?.filename
        })
      "
      :positive-text="t('download.delete.confirm')"
      :negative-text="t('download.delete.cancel')"
      @positive-click="confirmDelete"
    />

    <!-- 娓呯┖纭瀵硅瘽妗?-->
    <n-modal
      v-model:show="showClearConfirm"
      preset="dialog"
      type="error"
      :title="t('download.clear.title')"
      :content="t('download.clear.message')"
      :positive-text="t('download.clear.confirm')"
      :negative-text="t('download.clear.cancel')"
      @positive-click="clearDownloadRecords"
    />

    <!-- 涓嬭浇璁剧疆鎶藉眽 -->
    <n-drawer v-model:show="showSettingsDrawer" :width="400" placement="right">
      <n-drawer-content :title="t('download.settingsPanel.title')" closable>
        <div class="download-settings-content space-y-8 py-4">
          <!-- Path Section -->
          <div class="setting-group">
            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-2">
              {{ t('download.settingsPanel.path') }}
            </h3>
            <p class="text-xs text-neutral-500 mb-4">{{ t('download.settingsPanel.pathDesc') }}</p>
            <div class="space-y-3">
              <n-input :value="downloadSettings.path" readonly placeholder="Select path..." />
              <div class="flex gap-2">
                <n-button class="flex-1" @click="selectDownloadPath">{{
                  t('download.settingsPanel.select')
                }}</n-button>
                <n-button class="flex-1" @click="openDownloadPath">{{
                  t('download.settingsPanel.open')
                }}</n-button>
              </div>
            </div>
          </div>

          <!-- Save Lyric File -->
          <div class="setting-group">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                  {{ t('download.settingsPanel.saveLyric') }}
                </h3>
                <p class="text-xs text-neutral-500 mt-1">
                  {{ t('download.settingsPanel.saveLyricDesc') }}
                </p>
              </div>
              <n-switch v-model:value="downloadSettings.saveLyric" />
            </div>
          </div>

          <!-- Format Section -->
          <div class="setting-group">
            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-2">
              {{ t('download.settingsPanel.fileFormat') }}
            </h3>
            <p class="text-xs text-neutral-500 mb-4">
              {{ t('download.settingsPanel.fileFormatDesc') }}
            </p>

            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <n-button
                  v-for="preset in [
                    { label: 'songArtist', value: '{songName} - {artistName}' },
                    { label: 'artistSong', value: '{artistName} - {songName}' },
                    { label: 'songOnly', value: '{songName}' }
                  ]"
                  :key="preset.label"
                  size="small"
                  :type="downloadSettings.nameFormat === preset.value ? 'primary' : 'default'"
                  @click="downloadSettings.nameFormat = preset.value"
                >
                  {{ t(`download.settingsPanel.presets.${preset.label}`) }}
                </n-button>
              </div>

              <div>
                <p class="text-[10px] text-neutral-400 mb-2 uppercase font-bold">
                  {{ t('download.settingsPanel.separator') }}
                </p>
                <div class="flex items-center gap-2">
                  <n-button
                    v-for="sep in [' - ', '_', ' ']"
                    :key="sep"
                    size="small"
                    :type="downloadSettings.separator === sep ? 'primary' : 'default'"
                    @click="downloadSettings.separator = sep"
                  >
                    {{ sep === ' ' ? 'Space' : sep }}
                  </n-button>
                  <n-input v-model:value="downloadSettings.separator" size="small" class="w-20" />
                </div>
              </div>

              <div>
                <p class="text-[10px] text-neutral-400 mb-2 uppercase font-bold">
                  {{ t('download.settingsPanel.dragToArrange') }}
                </p>
                <div class="space-y-2">
                  <div
                    v-for="(comp, idx) in formatComponents"
                    :key="comp.id"
                    class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                  >
                    <span class="text-xs">{{
                      t(`download.settingsPanel.components.${comp.type}`)
                    }}</span>
                    <div class="flex items-center gap-1">
                      <n-button
                        quaternary
                        circle
                        size="tiny"
                        :disabled="idx === 0"
                        @click="handleMoveUp(idx)"
                        ><i class="ri-arrow-up-s-line"
                      /></n-button>
                      <n-button
                        quaternary
                        circle
                        size="tiny"
                        :disabled="idx === formatComponents.length - 1"
                        @click="handleMoveDown(idx)"
                        ><i class="ri-arrow-down-s-line"
                      /></n-button>
                      <n-button
                        quaternary
                        circle
                        size="tiny"
                        :disabled="formatComponents.length <= 1"
                        @click="removeFormatComponent(idx)"
                        ><i class="ri-close-line"
                      /></n-button>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <n-button
                      v-for="type in ['songName', 'artistName', 'albumName']"
                      :key="type"
                      size="tiny"
                      :disabled="formatComponents.some((c) => c.type === type)"
                      @click="addFormatComponent(type)"
                    >
                      + {{ t(`download.settingsPanel.components.${type}`) }}
                    </n-button>
                  </div>
                </div>
              </div>

              <div
                class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800"
              >
                <p class="text-[10px] text-neutral-400 mb-1 uppercase font-bold">
                  {{ t('download.settingsPanel.preview') }}
                </p>
                <p class="text-sm font-medium text-[var(--accent-color)] truncate">{{ formatNamePreview }}</p>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <n-button type="primary" block @click="saveDownloadSettings">{{
            t('common.save')
          }}</n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getMusicDetail } from '@/api/music';
import { usePlayerStore } from '@/store/modules/player';
import type { SongResult } from '@/types/music';
import { getImgUrl } from '@/utils';

const { t } = useI18n();
const playerStore = usePlayerStore();
const message = useMessage();

interface DownloadItem {
  filename: string;
  progress: number;
  loaded: number;
  total: number;
  path: string;
  status: 'downloading' | 'completed' | 'error';
  error?: string;
  songInfo?: any;
}

interface DownloadedItem {
  filename: string;
  path: string;
  size: number;
  id: number;
  picUrl: string;
  ar: { name: string }[];
  displayName?: string;
}
const tabName = ref('downloading');

const downloadList = ref<DownloadItem[]>([]);
const downloadedList = ref<DownloadedItem[]>(
  JSON.parse(localStorage.getItem('downloadedList') || '[]')
);

const downList = computed(() => downloadedList.value);

// 璁＄畻鎬昏繘搴
    const totalProgress = computed(() => {
  if (downloadList.value.length === 0) return 0;
  const total = downloadList.value.reduce((sum, item) => sum + item.progress, 0);
  return total / downloadList.value.length;
});

watch(totalProgress, (newVal) => {
  if (newVal === 100) {
    refreshDownloadedList();
  }
});

// 鑾峰彇鐘舵€佹枃鏈
    const getStatusText = (item: DownloadItem) => {
  switch (item.status) {
    case 'downloading':
      return t('download.status.downloading');
    case 'completed':
      return t('download.status.completed');
    case 'error':
      return t('download.status.failed');
    default:
      return t('download.status.unknown');
  }
};

// 鏍煎紡鍖栨枃浠跺ぇ灏
    const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
};

// 澶嶅埗鏂囦欢璺緞
const copyPath = (path: string) => {
  navigator.clipboard
    .writeText(path)
    .then(() => {
      message.success(t('download.path.copied'));
    })
    .catch((err) => {
      console.error('澶嶅埗澶辫触:', err);
      message.error(t('download.path.copyFailed'));
    });
};

// 鏍煎紡鍖栬矾寰
    const shortenPath = (path: string) => {
  if (!path) return '';

  // 鑾峰彇鏂囦欢鍚嶅拰鐩綍
  const parts = path.split(/[/\\]/);
  const fileName = parts.pop() || '';

  // 濡傛灉璺緞寰堢煭锛岀洿鎺ヨ繑鍥
    if (path.length < 30) return path;

  // 淇濈暀寮€澶寸殑閮ㄥ垎鐩綍鍜岀粨灏剧殑鏂囦欢鍚
    if (parts.length <= 2) return path;

  const start = parts.slice(0, 1).join('/');
  const end = parts.slice(-1).join('/');

  return `${start}/.../${end}/${fileName}`;
};

// 鑾峰彇鏈湴鏂囦欢URL
const getLocalFilePath = (path: string) => {
  if (!path) return '';
  // 纭繚URL鏍煎紡姝ｇ‘
  return `local:///${encodeURIComponent(path)}`;
};

// 鎵撳紑鐩綍
const openDirectory = (path: string) => {
  window.electron.ipcRenderer.send('open-directory', path);
};

// 鎾斁闊充箰
const handlePlayMusic = async (item: DownloadedItem) => {
  try {
    // 鍏堟鏌ユ枃浠舵槸鍚﹀瓨鍦
    const fileExists = await window.electron.ipcRenderer.invoke('check-file-exists', item.path);

    if (!fileExists) {
      message.error(t('download.delete.fileNotFound', { name: item.displayName || item.filename }));
      return;
    }

    // 杞崲涓嬭浇椤逛负鎾斁鎵€闇€鐨勬瓕鏇插璞
    const song: SongResult = {
      id: item.id,
      name: item.displayName || item.filename,
      ar:
        item.ar?.map((a) => ({
          id: 0,
          name: a.name,
          picId: 0,
          img1v1Id: 0,
          briefDesc: '',
          picUrl: '',
          img1v1Url: '',
          albumSize: 0,
          alias: [],
          trans: '',
          musicSize: 0,
          topicPerson: 0
        })) || [],
      al: {
        name: item.filename,
        id: 0,
        picUrl: item.picUrl,
        pic: 0,
        picId: 0
      } as any,
      picUrl: item.picUrl,
      // 浣跨敤鏈湴鏂囦欢鍗忚
      playMusicUrl: getLocalFilePath(item.path),
      source: 'netease' as 'netease',
      count: 0
    };

    console.log('寮€濮嬫挱鏀炬湰鍦伴煶涔?', song.name, '璺緞:', song.playMusicUrl);

    // 鎾斁姝屾洸
    await playerStore.setPlay(song);
    playerStore.setPlayMusic(true);
    playerStore.setIsPlay(true);

    message.success(t('download.playStarted', { name: item.displayName || item.filename }));
  } catch (error) {
    console.error('鎾斁闊充箰澶辫触:', error);
    message.error(t('download.playFailed', { name: item.displayName || item.filename }));
  }
};

// 鍒犻櫎鐩稿叧
const showDeleteConfirm = ref(false);
const itemToDelete = ref<DownloadedItem | null>(null);

// 澶勭悊鍒犻櫎鐐瑰嚮
const handleDelete = (item: DownloadedItem) => {
  itemToDelete.value = item;
  showDeleteConfirm.value = true;
};

// 纭鍒犻櫎
const confirmDelete = async () => {
  const item = itemToDelete.value;
  if (!item) return;

  try {
    const success = await window.electron.ipcRenderer.invoke('delete-downloaded-music', item.path);

    if (success) {
      const newList = downloadedList.value.filter((i) => i.id !== item.id);
      downloadedList.value = newList;
      localStorage.setItem('downloadedList', JSON.stringify(newList));
      message.success(t('download.delete.success'));
    } else {
      message.warning(t('download.delete.fileNotFound'));
    }
  } catch (error) {
    console.error('Failed to delete music:', error);
    message.warning(t('download.delete.recordRemoved'));
  } finally {
    showDeleteConfirm.value = false;
    itemToDelete.value = null;
  }
};

// 娓呯┖涓嬭浇璁板綍鐩稿叧
const showClearConfirm = ref(false);

// 娓呯┖涓嬭浇璁板綍
const clearDownloadRecords = async () => {
  try {
    downloadedList.value = [];
    localStorage.setItem('downloadedList', '[]');
    await window.electron.ipcRenderer.invoke('clear-downloaded-music');
    message.success(t('download.clear.success'));
  } catch (error) {
    console.error('Failed to clear download records:', error);
    message.error(t('download.clear.failed'));
  } finally {
    showClearConfirm.value = false;
  }
};

// 娣诲姞鍔犺浇鐘舵€
    const isLoadingDownloaded = ref(false);

// 鏍煎紡鍖栨瓕鏇插悕绉帮紝搴旂敤鐢ㄦ埛璁剧疆鐨勬牸寮
    const formatSongName = (songInfo) => {
  if (!songInfo) return '';

  // 鑾峰彇鏍煎紡璁剧疆
  const nameFormat = downloadSettings.value.nameFormat || '{songName} - {artistName}';

  // 鍑嗗鏇挎崲鍙橀噺
  const artistName = songInfo.ar?.map((a) => a.name).join('/') || '鏈煡鑹烘湳瀹';
  const songName = songInfo.name || songInfo.filename || '鏈煡姝屾洸';
  const albumName = songInfo.al?.name || '鏈煡涓撹緫';

  // 搴旂敤鑷畾涔夋牸寮
    return nameFormat
    .replace(/\{songName\}/g, songName)
    .replace(/\{artistName\}/g, artistName)
    .replace(/\{albumName\}/g, albumName);
};

// 鑾峰彇宸蹭笅杞介煶涔愬垪琛
    const refreshDownloadedList = async () => {
  if (isLoadingDownloaded.value) return; // 闃叉閲嶅鍔犺浇

  try {
    isLoadingDownloaded.value = true;
    const list = await window.electron.ipcRenderer.invoke('get-downloaded-music');

    if (!Array.isArray(list) || list.length === 0) {
      downloadedList.value = [];
      localStorage.setItem('downloadedList', '[]');
      return;
    }

    const songIds = list.filter((item) => item.id).map((item) => item.id);
    if (songIds.length === 0) {
      // 澶勭悊鏄剧ず鏍煎紡鍖栨枃浠跺悕
      const updatedList = list.map((item) => ({
        ...item,
        displayName: formatSongName(item) || item.filename
      }));

      downloadedList.value = updatedList;
      localStorage.setItem('downloadedList', JSON.stringify(updatedList));
      return;
    }

    try {
      const detailRes = await getMusicDetail(songIds);
      const songDetails = detailRes.data.songs.reduce((acc, song) => {
        acc[song.id] = song;
        return acc;
      }, {});

      const updatedList = list.map((item) => {
        const songDetail = songDetails[item.id];
        const updatedItem = {
          ...item,
          picUrl: songDetail?.al?.picUrl || item.picUrl || '/images/default_cover.png',
          ar: songDetail?.ar || item.ar || [{ name: t('download.localMusic') }],
          name: songDetail?.name || item.name || item.filename
        };

        // 娣诲姞鏍煎紡鍖栫殑鏄剧ず鍚嶇О
        updatedItem.displayName = formatSongName(updatedItem) || updatedItem.filename;
        return updatedItem;
      });

      downloadedList.value = updatedList;
      localStorage.setItem('downloadedList', JSON.stringify(updatedList));
    } catch (error) {
      console.error('Failed to get music details:', error);
      // 澶勭悊鏄剧ず鏍煎紡鍖栨枃浠跺悕
      const updatedList = list.map((item) => ({
        ...item,
        displayName: formatSongName(item) || item.filename
      }));

      downloadedList.value = updatedList;
      localStorage.setItem('downloadedList', JSON.stringify(updatedList));
    }
  } catch (error) {
    console.error('Failed to get downloaded music list:', error);
    downloadedList.value = [];
    localStorage.setItem('downloadedList', '[]');
  } finally {
    isLoadingDownloaded.value = false;
  }
};

watch(
  () => tabName.value,
  (newVal) => {
    if (newVal) {
      refreshDownloadedList();
    }
  }
);

// 鍒濆鍖
    onMounted(() => {
  refreshDownloadedList();

  // 璁板綍宸插鐞嗙殑涓嬭浇椤癸紝閬垮厤閲嶅瑙﹀彂浜嬩欢
  const processedDownloads = new Set<string>();

  // 鐩戝惉涓嬭浇杩涘害
  window.electron.ipcRenderer.on('music-download-progress', (_, data) => {
    const existingItem = downloadList.value.find((item) => item.filename === data.filename);

    // 濡傛灉杩涘害涓?00%锛屽皢鐘舵€佽缃负宸插畬鎴
    if (data.progress === 100) {
      data.status = 'completed';
    }

    if (existingItem) {
      Object.assign(existingItem, {
        ...data,
        songInfo: data.songInfo || existingItem.songInfo
      });

      // 濡傛灉涓嬭浇瀹屾垚锛屼粠鍒楄〃涓Щ闄わ紝浣嗕笉瑙﹀彂瀹屾垚閫氱煡
      // 閫氱煡鐢?music-download-complete 浜嬩欢澶勭悊
      if (data.status === 'completed') {
        downloadList.value = downloadList.value.filter((item) => item.filename !== data.filename);
      }
    } else {
      downloadList.value.push({
        ...data,
        songInfo: data.songInfo
      });
    }
  });

  // 鐩戝惉涓嬭浇瀹屾垚
  window.electron.ipcRenderer.on('music-download-complete', async (_, data) => {
    // 濡傛灉宸茬粡澶勭悊杩囨鏂囦欢鐨勫畬鎴愪簨浠讹紝鍒欒烦杩
    if (processedDownloads.has(data.filename)) {
      return;
    }

    // 鏍囪涓哄凡澶勭悊
    processedDownloads.add(data.filename);

    // 涓嬭浇鎴愬姛澶勭悊
    if (data.success) {
      // 浠庝笅杞藉垪琛ㄤ腑绉婚櫎
      downloadList.value = downloadList.value.filter((item) => item.filename !== data.filename);

      // 寤惰繜鍒锋柊宸蹭笅杞藉垪琛紝閬垮厤鏂囦欢绯荤粺鏈畬鍏ㄥ啓鍏
    setTimeout(() => refreshDownloadedList(), 500);

      // 鍙湪涓嬭浇椤甸潰鏄剧ず涓€娆′笅杞芥垚鍔熼€氱煡
      message.success(t('download.message.downloadComplete', { filename: data.filename }));

      // 閬垮厤閫氱煡杩囧鍗犵敤鍐呭瓨锛岃缃竴涓秴鏃舵潵娓呯悊宸插鐞嗙殑鏍囪
      setTimeout(() => {
        processedDownloads.delete(data.filename);
      }, 10000); // 10绉掑悗娓呴櫎
    } else {
      // 涓嬭浇澶辫触澶勭悊
      const existingItem = downloadList.value.find((item) => item.filename === data.filename);
      if (existingItem) {
        Object.assign(existingItem, {
          status: 'error',
          error: data.error,
          progress: 0
        });
        setTimeout(() => {
          downloadList.value = downloadList.value.filter((item) => item.filename !== data.filename);
          processedDownloads.delete(data.filename);
        }, 3000);
      }

      message.error(
        t('download.message.downloadFailed', { filename: data.filename, error: data.error })
      );
    }
  });

  // 鐩戝惉涓嬭浇闃熷垪
  window.electron.ipcRenderer.on('music-download-queued', (_, data) => {
    const existingItem = downloadList.value.find((item) => item.filename === data.filename);
    if (!existingItem) {
      downloadList.value.push({
        filename: data.filename,
        progress: 0,
        loaded: 0,
        total: 0,
        path: '',
        status: 'downloading',
        songInfo: data.songInfo
      });
    }
  });
});

// 涓嬭浇璁剧疆
const showSettingsDrawer = ref(false);
const downloadSettings = ref({
  path: '',
  nameFormat: '{songName} - {artistName}',
  separator: ' - ',
  saveLyric: false
});

// 鏍煎紡缁勪欢锛堢敤浜庢嫋鎷芥帓搴忥級
const formatComponents = ref([
  { id: 1, type: 'songName' },
  { id: 2, type: 'artistName' }
]);

// 澶勭悊缁勪欢鎺掑簭
const handleMoveUp = (index: number) => {
  if (index > 0) {
    const temp = formatComponents.value.splice(index, 1)[0];
    formatComponents.value.splice(index - 1, 0, temp);
  }
};

const handleMoveDown = (index: number) => {
  if (index < formatComponents.value.length - 1) {
    const temp = formatComponents.value.splice(index, 1)[0];
    formatComponents.value.splice(index + 1, 0, temp);
  }
};

// 娣诲姞鏂扮殑鏍煎紡缁勪欢
const addFormatComponent = (type: string) => {
  if (!formatComponents.value.some((item) => item.type === type)) {
    formatComponents.value.push({
      id: Date.now(),
      type
    });
  }
};

// 鍒犻櫎鏍煎紡缁勪欢
const removeFormatComponent = (index: number) => {
  formatComponents.value.splice(index, 1);
};

// 鐩戝惉缁勪欢鍙樺寲鏇存柊鏍煎紡
watch(
  formatComponents,
  (newComponents) => {
    let format = '';
    newComponents.forEach((component, index) => {
      format += `{${component.type}}`;
      if (index < newComponents.length - 1) {
        format += downloadSettings.value.separator;
      }
    });
    downloadSettings.value.nameFormat = format;
  },
  { deep: true }
);

// 鐩戝惉鍒嗛殧绗﹀彉鍖栨洿鏂版牸寮
    watch(
  () => downloadSettings.value.separator,
  (newSeparator) => {
    if (formatComponents.value.length > 1) {
      // 閲嶆柊鏋勫缓鏍煎紡瀛楃涓
    let format = '';
      formatComponents.value.forEach((component, index) => {
        format += `{${component.type}}`;
        if (index < formatComponents.value.length - 1) {
          format += newSeparator;
        }
      });
      downloadSettings.value.nameFormat = format;
    }
  }
);

// 鏍煎紡鍚嶇О棰勮
const formatNamePreview = computed(() => {
  const format = downloadSettings.value.nameFormat;
  return format
    .replace(/\{songName\}/g, '鑾け鑾繕')
    .replace(/\{artistName\}/g, '棣欒湝娌夋矇鐑闇')
    .replace(/\{albumName\}/g, '鐢佃鍓у師澹板甫');
});

// 閫夋嫨涓嬭浇璺緞
const selectDownloadPath = async () => {
  const result = await window.electron.ipcRenderer.invoke('select-directory');
  if (result && !result.canceled && result.filePaths.length > 0) {
    downloadSettings.value.path = result.filePaths[0];
  }
};

// 鎵撳紑涓嬭浇璺緞
const openDownloadPath = () => {
  if (downloadSettings.value.path) {
    window.electron.ipcRenderer.send('open-directory', downloadSettings.value.path);
  } else {
    message.warning(t('download.settingsPanel.noPathSelected'));
  }
};

// 淇濆瓨涓嬭浇璁剧疆
const saveDownloadSettings = () => {
  // 淇濆瓨鍒伴厤缃
    window.electron.ipcRenderer.send(
    'set-store-value',
    'set.downloadPath',
    downloadSettings.value.path
  );
  window.electron.ipcRenderer.send(
    'set-store-value',
    'set.downloadNameFormat',
    downloadSettings.value.nameFormat
  );
  window.electron.ipcRenderer.send(
    'set-store-value',
    'set.downloadSeparator',
    downloadSettings.value.separator
  );
  window.electron.ipcRenderer.send(
    'set-store-value',
    'set.downloadSaveLyric',
    downloadSettings.value.saveLyric
  );

  // 濡傛灉鏄湪宸蹭笅杞介〉闈紝鍒锋柊鍒楄〃浠ユ洿鏂版樉绀
    if (tabName.value === 'downloaded') {
    refreshDownloadedList();
  }

  message.success(t('download.settingsPanel.saveSuccess'));
  showSettingsDrawer.value = false;
};

// 鍒濆鍖栦笅杞借缃
    const initDownloadSettings = async () => {
  // 鑾峰彇褰撳墠閰嶇疆
  const path = await window.electron.ipcRenderer.invoke('get-store-value', 'set.downloadPath');
  const nameFormat = await window.electron.ipcRenderer.invoke(
    'get-store-value',
    'set.downloadNameFormat'
  );
  const separator = await window.electron.ipcRenderer.invoke(
    'get-store-value',
    'set.downloadSeparator'
  );
  const saveLyric = await window.electron.ipcRenderer.invoke(
    'get-store-value',
    'set.downloadSaveLyric'
  );

  downloadSettings.value = {
    path: path || (await window.electron.ipcRenderer.invoke('get-downloads-path')),
    nameFormat: nameFormat || '{songName} - {artistName}',
    separator: separator || ' - ',
    saveLyric: saveLyric || false
  };

  // 鍒濆鍖栨帓搴忕粍浠?  updateFormatComponents();
};

// 鏍规嵁鏍煎紡鏇存柊缁勪欢
const updateFormatComponents = () => {
  // 鎻愬彇鏍煎紡涓殑鍙橀噺
  const format = downloadSettings.value.nameFormat;
  const matches = Array.from(format.matchAll(/\{(\w+)\}/g));

  if (matches.length === 0) {
    formatComponents.value = [
      { id: 1, type: 'songName' },
      { id: 2, type: 'artistName' }
    ];
    return;
  }

  formatComponents.value = matches.map((match, index) => ({
    id: index + 1,
    type: match[1]
  }));
};

// 鐩戝惉鏍煎紡鍙樺寲鏇存柊缁勪欢
watch(() => downloadSettings.value.nameFormat, updateFormatComponents);

// 鐩戝惉鍛藉悕鏍煎紡鍙樺寲锛屾洿鏂板凡涓嬭浇鏂囦欢鐨勬樉绀哄悕绉
    watch(
  () => downloadSettings.value.nameFormat,
  () => {
    if (downloadedList.value.length > 0) {
      // 鏇存柊鎵€鏈夊凡涓嬭浇椤圭殑鏄剧ず鍚嶇О
      downloadedList.value = downloadedList.value.map((item) => ({
        ...item,
        displayName: formatSongName(item) || item.filename
      }));

      // 淇濆瓨鍒版湰鍦板瓨鍌?      localStorage.setItem('downloadedList', JSON.stringify(downloadedList.value));
    }
  }
);

// 鍒濆鍖
    onMounted(() => {
  initDownloadSettings();
});
</script>

<style lang="scss" scoped>
.download-page {
  position: relative;
}

.hero-section {
  min-height: 240px;
}

.animate-item {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-btn-pill {
  @apply transition-all border-neutral-200 dark:border-neutral-800;
  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--accent-color) 30%, transparent);
    background-color: color-mix(in srgb, var(--accent-color) 5%, transparent);
  }
}

.action-btn-icon {
  @apply transition-all;
  &:hover {
    @apply scale-110 text-[var(--accent-color)];
    background-color: color-mix(in srgb, var(--accent-color) 10%, transparent);
  }
}

.downloading-item,
.downloaded-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

