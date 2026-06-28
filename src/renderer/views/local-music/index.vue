<template>
  <div class="local-music-page h-full w-full bg-white dark:bg-black transition-colors duration-500">
    <n-scrollbar class="h-full">
      <div class="local-music-content pb-32">
        <!-- Hero Section -->
        <section class="hero-section relative overflow-hidden rounded-tl-2xl">
          <!-- 鑳屾櫙妯＄硦鏁堟灉 -->
          <div class="hero-bg absolute inset-0 -top-20">
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-3xl opacity-50 dark:opacity-30"
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-black/80 dark:to-black"
            ></div>
          </div>

          <!-- Hero 鍐呭 -->
          <div class="hero-content relative z-10 page-padding-x pt-10 pb-8">
            <div class="flex flex-col md:flex-row gap-8 items-center md:items-end">
              <div class="cover-wrapper relative group">
                <div
                  class="cover-container relative w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-[var(--accent-color)]/10 flex items-center justify-center shadow-2xl ring-4 ring-white/50 dark:ring-neutral-800/50"
                >
                  <i class="ri-folder-music-fill text-6xl text-[var(--accent-color)] opacity-80" />
                </div>
              </div>

              <div class="info-content text-center md:text-left">
                <div class="badge mb-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-xs font-semibold uppercase tracking-wider"
                  >
                    {{ t('localMusic.title') }}
                  </span>
                </div>
                <h1
                  class="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight"
                >
                  {{ t('localMusic.title') }}
                </h1>
                <p class="mt-4 text-sm md:text-base text-neutral-500 dark:text-neutral-400">
                  {{ t('localMusic.songCount', { count: localMusicStore.musicList.length }) }}
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
            <!-- 宸︿晶锛氭悳绱㈡ -->
            <div class="flex-1 max-w-xs">
              <n-input
                v-model:value="searchKeyword"
                :placeholder="t('localMusic.search')"
                clearable
                size="small"
                round
              >
                <template #prefix>
                  <i class="ri-search-line text-neutral-400" />
                </template>
              </n-input>
            </div>

            <!-- 鍙充晶锛氭搷浣滄寜閽?-->
            <div class="flex items-center gap-3">
              <!-- 鎾斁鍏ㄩ儴鎸夐挳 -->
              <button
                v-if="filteredList.length > 0"
                class="action-btn-pill flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]/90"
                @click="handlePlayAll"
              >
                <i class="ri-play-fill text-lg" />
                <span class="hidden md:inline">{{ t('localMusic.playAll') }}</span>
              </button>

              <!-- 鎵弿鎸夐挳 -->
              <button
                class="action-btn-icon w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                :disabled="localMusicStore.scanning"
                @click="handleScan"
              >
                <i
                  class="ri-refresh-line text-lg"
                  :class="{ 'animate-spin': localMusicStore.scanning }"
                />
              </button>

              <!-- 娣诲姞鏂囦欢澶规寜閽?-->
              <button
                class="action-btn-icon w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                @click="handleAddFolder"
              >
                <i class="ri-folder-add-line text-lg" />
              </button>

              <!-- 鏂囦欢澶圭鐞嗘寜閽?-->
              <button
                v-if="localMusicStore.folderPaths.length > 0"
                class="action-btn-icon w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                @click="showFolderManager = true"
              >
                <i class="ri-folder-settings-line text-lg" />
              </button>
            </div>
          </div>
        </section>

        <!-- 鎵弿杩涘害鎻愮ず -->
        <section v-if="localMusicStore.scanning" class="page-padding-x mt-6">
          <div
            class="flex items-center gap-4 p-4 rounded-2xl bg-[var(--accent-color)]/5 dark:bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20"
          >
            <n-spin size="small" />
            <div>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">
                {{ t('localMusic.scanning') }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{ t('localMusic.songCount', { count: localMusicStore.scanProgress }) }}
              </p>
            </div>
          </div>
        </section>

        <!-- 姝屾洸鍒楄〃 -->
        <section class="list-section page-padding-x mt-6">
          <!-- 绌虹姸鎬?-->
          <div
            v-if="!localMusicStore.scanning && filteredList.length === 0"
            class="empty-state py-20 text-center"
          >
            <i class="ri-folder-music-fill text-5xl mb-4 text-neutral-200 dark:text-neutral-800" />
            <p class="text-neutral-400">{{ t('localMusic.emptyState') }}</p>
            <button
              class="mt-6 px-6 py-2 rounded-full bg-[var(--accent-color)] text-white text-sm font-medium hover:bg-[var(--accent-color)]/90 transition-all"
              @click="handleAddFolder"
            >
              <i class="ri-folder-add-line mr-2" />
              {{ t('localMusic.scanFolder') }}
            </button>
          </div>

          <!-- 铏氭嫙鍒楄〃 -->
          <div v-else-if="filteredList.length > 0" class="song-list-container">
            <n-virtual-list
              class="song-virtual-list"
              style="max-height: calc(100vh - 280px)"
              :items="filteredSongResults"
              :item-size="70"
              item-resizable
              key-field="id"
            >
              <template #default="{ item, index }">
                <div>
                  <song-item :index="index" :item="item" @play="handlePlaySong" />
                  <!-- 鍒楄〃鏈熬鐣欑櫧 -->
                  <div v-if="index === filteredSongResults.length - 1" class="h-36"></div>
                </div>
              </template>
            </n-virtual-list>
          </div>
        </section>
      </div>
    </n-scrollbar>

    <!-- 鏂囦欢澶圭鐞嗘娊灞?-->
    <n-drawer v-model:show="showFolderManager" :width="400" placement="right">
      <n-drawer-content :title="t('localMusic.removeFolder')" closable>
        <div class="space-y-3 py-4">
          <div
            v-for="folder in localMusicStore.folderPaths"
            :key="folder"
            class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <i class="ri-folder-line text-lg text-[var(--accent-color)] flex-shrink-0" />
              <span class="text-sm text-neutral-700 dark:text-neutral-300 truncate">{{
                folder
              }}</span>
            </div>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all flex-shrink-0 ml-2"
              @click="handleRemoveFolder(folder)"
            >
              <i class="ri-delete-bin-line" />
            </button>
          </div>

          <!-- 绌烘枃浠跺す鍒楄〃 -->
          <div v-if="localMusicStore.folderPaths.length === 0" class="text-center py-8">
            <i class="ri-folder-line text-4xl text-neutral-200 dark:text-neutral-800" />
            <p class="text-sm text-neutral-400 mt-2">{{ t('localMusic.emptyState') }}</p>
          </div>
        </div>

        <template #footer>
          <n-button type="primary" block @click="handleAddFolder">
            <template #icon>
              <i class="ri-folder-add-line" />
            </template>
            {{ t('localMusic.scanFolder') }}
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { createDiscreteApi } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import SongItem from '@/components/common/SongItem.vue';
import { useLocalMusicStore } from '@/store/modules/localMusic';
import { usePlayerStore } from '@/store/modules/player';
import type { SongResult } from '@/types/music';
import { filterByKeyword, toSongResult } from '@/utils/localMusicUtils';

// ==================== Stores ====================
const { t } = useI18n();
const { message } = createDiscreteApi(['message']);
const localMusicStore = useLocalMusicStore();
const playerStore = usePlayerStore();

// ==================== State ====================
/** 鎼滅储鍏抽敭璇?*/
const searchKeyword = ref('');
/** 鏂囦欢澶圭鐞嗘娊灞夋槸鍚︽樉绀?*/
const showFolderManager = ref(false);

// ==================== Computed ====================
/** 鏍规嵁鎼滅储鍏抽敭璇嶈繃婊ゅ悗鐨勬湰鍦伴煶涔愬垪琛?*/
const filteredList = computed(() => {
  return filterByKeyword(localMusicStore.musicList, searchKeyword.value);
});

/** 灏嗚繃婊ゅ悗鐨勫垪琛ㄨ浆鎹负 SongResult[] 渚?SongItem 浣跨敤 */
const filteredSongResults = computed(() => {
  return filteredList.value.map(toSongResult);
});

// ==================== Methods ====================

/**
 * 閫夋嫨骞舵坊鍔犳枃浠跺す
 * 璋冪敤绯荤粺鏂囦欢澶归€夋嫨瀵硅瘽妗? * dialog.showOpenDialog 杩斿洖 { canceled: boolean, filePaths: string[] }
 */
async function handleAddFolder(): Promise<void> {
  try {
    const result = await window.electron.ipcRenderer.invoke('select-directory');
    if (result && !result.canceled && result.filePaths?.length > 0) {
      localMusicStore.addFolder(result.filePaths[0]);
      // 娣诲姞鏂囦欢澶瑰悗鑷姩瑙﹀彂鎵弿
      await localMusicStore.scanFolders();
    }
  } catch (error) {
    console.error('閫夋嫨鏂囦欢澶瑰け璐?', error);
    message.error(String(error));
  }
}

/**
 * 绉婚櫎鏂囦欢澶? * @param folder 瑕佺Щ闄ょ殑鏂囦欢澶硅矾寰? */
function handleRemoveFolder(folder: string): void {
  localMusicStore.removeFolder(folder);
}

/**
 * 瑙﹀彂鎵弿
 */
async function handleScan(): Promise<void> {
  if (localMusicStore.folderPaths.length === 0) {
    // 娌℃湁閰嶇疆鏂囦欢澶规椂锛屽紩瀵肩敤鎴峰厛娣诲姞鏂囦欢澶
    await handleAddFolder();
    return;
  }
  await localMusicStore.scanFolders();
}

/**
 * 鎾斁鍗曟洸
 * SongItem 鍐呴儴宸查€氳繃 playMusicEvent 璋冪敤 playerStore.setPlay 瑙﹀彂鎾斁
 * 姝ゅ鍙渶璁剧疆鎾斁鍒楄〃涓婁笅鏂囷紝纭繚涓婁笅涓€棣栧垏鎹㈡甯? * @param song SongItem 缁勪欢 emit 鐨?SongResult 瀵硅薄
 */
async function handlePlaySong(_song: SongResult): Promise<void> {
  try {
    // 璁剧疆鎾斁鍒楄〃涓婁笅鏂囷紝纭繚涓婁笅涓€棣栧垏鎹㈡甯?    playerStore.setPlayList(filteredSongResults.value);
  } catch (error) {
    console.error('鎾斁鏈湴闊充箰澶辫触:', error);
  }
}

/**
 * 鎾斁鍏ㄩ儴
 * 灏嗗畬鏁村垪琛ㄨ浆鎹负 SongResult[] 鍚庤缃负鎾斁鍒楄〃骞朵粠绗竴棣栧紑濮嬫挱鏀? */
async function handlePlayAll(): Promise<void> {
  if (filteredSongResults.value.length === 0) return;

  try {
    const firstSong = filteredSongResults.value[0];
    const entry = filteredList.value[0];

    // 妫€鏌ョ涓€棣栨瓕鏂囦欢鏄惁瀛樺湪
    const exists = await window.electron.ipcRenderer.invoke('check-file-exists', entry.filePath);
    if (!exists) {
      message.error(t('localMusic.fileNotFound'));
      return;
    }

    // 璁剧疆鎾斁鍒楄〃骞舵挱鏀剧涓€棣?    playerStore.setPlayList(filteredSongResults.value);
    await playerStore.setPlay(firstSong);
  } catch (error) {
    console.error('鎾斁鍏ㄩ儴澶辫触:', error);
  }
}

// ==================== Lifecycle ====================
onMounted(async () => {
  // 杩涘叆椤甸潰鏃朵粠 IndexedDB 缂撳瓨鍔犺浇闊充箰鍒楄〃
  await localMusicStore.loadFromCache();
});
</script>

<style scoped>
/* 铏氭嫙鍒楄〃鏍峰紡 */
.song-virtual-list {
  @apply w-full;
}

.song-virtual-list :deep(.n-virtual-list__scroll) {
  scrollbar-width: thin;
}

.song-virtual-list :deep(.n-virtual-list__scroll)::-webkit-scrollbar {
  width: 6px;
}

.song-virtual-list :deep(.n-virtual-list__scroll)::-webkit-scrollbar-thumb {
  @apply bg-neutral-300 dark:bg-neutral-700 rounded-full;
}

.song-virtual-list :deep(.n-virtual-list__scroll)::-webkit-scrollbar-track {
  @apply bg-transparent;
}
</style>

