<template>
  <div class="user-page h-full flex flex-col min-h-0">
    <template v-if="infoLoading">
      <div class="flex-1 flex flex-col gap-4 p-4">
        <div class="rounded-2xl skeleton-shimmer" style="height: 200px" />
        <div class="grid md:grid-cols-2 gap-4">
          <div class="rounded-2xl bg-light-200 p-4 dark:bg-dark-100 space-y-4">
            <div class="h-8 w-32 skeleton-shimmer rounded-lg" />
            <div v-for="i in 4" :key="i" class="flex gap-3">
              <div class="h-[50px] w-[50px] skeleton-shimmer rounded-xl flex-shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-1/2 skeleton-shimmer rounded-lg" />
                <div class="h-3 w-1/3 skeleton-shimmer rounded-lg" />
              </div>
            </div>
          </div>
          <div class="rounded-2xl bg-light-200 p-4 dark:bg-dark-100 space-y-4">
            <div class="h-8 w-32 skeleton-shimmer rounded-lg" />
            <div v-for="i in 5" :key="i" class="flex items-center gap-3">
              <div class="h-10 w-10 skeleton-shimmer rounded-full flex-shrink-0" />
              <div class="h-10 w-10 skeleton-shimmer rounded-xl flex-shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-1/3 skeleton-shimmer rounded-lg" />
                <div class="h-3 w-1/4 skeleton-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div
        v-if="userDetail && user"
        class="relative w-full flex-shrink-0 overflow-hidden"
        style="height: 280px"
        :class="setAnimationClass('animate__fadeIn')"
      >
        <img
          :src="getImgUrl(user.backgroundUrl)"
          class="absolute inset-0 h-full w-full object-cover"
          style="
            mask-image: linear-gradient(to bottom, black 45%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 45%, transparent 100%);
          "
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/5 to-transparent" />
        <div class="relative z-10 flex h-full items-center justify-between px-8">
          <div class="flex items-center gap-5">
            <n-avatar round :size="72" :src="getImgUrl(user.avatarUrl, '72y72')" />
            <div>
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-white">{{ user.nickname }}</span>
                <span
                  v-if="currentLoginType"
                  class="rounded-full border px-2 py-0.5 text-xs"
                  style="
                    color: var(--accent-color);
                    border-color: rgba(var(--accent-color-rgb), 0.4);
                  "
                  >{{ t('login.title.' + currentLoginType) }}</span
                >
              </div>
              <div class="mt-1 max-w-md truncate text-sm text-white/80">
                {{ userDetail.profile.signature || '这个人很懒，什么都没有留下' }}
              </div>
            </div>
          </div>
          <div class="flex gap-8 text-white">
            <div class="text-center">
              <div class="text-xl font-bold">{{ userDetail.profile.followeds }}</div>
              <div class="text-xs text-white/70">{{ t('user.profile.followers') }}</div>
            </div>
            <div class="cursor-pointer text-center" @click="showFollowList">
              <div class="text-xl font-bold">{{ userDetail.profile.follows }}</div>
              <div class="text-xs text-white/70">{{ t('user.profile.following') }}</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold">{{ userDetail.level }}</div>
              <div class="text-xs text-white/70">{{ t('user.profile.level') }}</div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="userDetail && user"
        class="relative z-20 -mt-16 px-4 pb-4 md:px-6 md:pb-6 flex-1 min-h-0"
        :class="setAnimationClass('animate__fadeIn')"
      >
        <div class="h-full overflow-hidden page-card">
          <div class="grid md:grid-cols-2 h-full">
            <div
              class="flex flex-col overflow-hidden p-5 md:border-r md:border-gray-200 dark:md:border-gray-700"
            >
              <div class="tab-container mb-4 flex-shrink-0">
                <n-tabs v-model:value="currentTab" type="segment" animated>
                  <n-tab v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="t(tab.label)" />
                </n-tabs>
              </div>
              <div class="flex-1 overflow-y-auto min-h-0">
                <div
                  v-if="albumLoading && currentTab === 'album'"
                  class="flex h-32 items-center justify-center"
                >
                  <n-spin size="medium" />
                </div>
                <div
                  v-else-if="currentTab === 'album' && currentList.length === 0"
                  class="flex h-32 items-center justify-center text-gray-400 dark:text-gray-500"
                >
                  {{ t('user.album.empty') || '暂无收藏的专辑' }}
                </div>
                <template v-else>
                  <button
                    v-if="isElectron && currentTab === 'created'"
                    @click="goToImportPlaylist"
                    class="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <div
                      class="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-white/10"
                    >
                      <i class="icon iconfont ri-add-line" />
                    </div>
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ t('comp.playlist.import.button') }}
                    </div>
                  </button>
                  <div
                    v-for="(item, index) in currentList"
                    :key="index"
                    @click="handleItemClick(item)"
                    class="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <n-image
                      :src="getImgUrl(getCoverUrl(item), '50y50')"
                      class="h-[50px] w-[50px] flex-shrink-0 overflow-hidden rounded-xl"
                      lazy
                      preview-disabled
                    />
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {{ item.name }}
                      </div>
                      <div class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {{ getItemDescription(item) }}
                      </div>
                    </div>
                  </div>
                </template>
                <play-bottom />
              </div>
            </div>
            <div class="flex flex-col overflow-hidden p-5">
              <div class="mb-4 flex-shrink-0 text-lg font-bold text-gray-900 dark:text-white">
                {{ t('user.ranking.title') }}
              </div>
              <div class="flex-1 overflow-y-auto min-h-0">
                <div
                  v-for="(item, index) in recordList"
                  :key="item.id"
                  class="group flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <div
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-gray-500 dark:text-gray-400"
                  >
                    {{ index + 1 }}
                  </div>
                  <n-image
                    :src="getImgUrl(item.picUrl || item.al?.picUrl, '40y40')"
                    class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl"
                    lazy
                    preview-disabled
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {{ item.name }}
                    </div>
                    <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                      {{ getArtistNames(item) }}
                    </div>
                  </div>
                  <button
                    @click.stop="toggleFavorite(item)"
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg opacity-0 transition-colors duration-200 group-hover:opacity-100"
                    :class="
                      isFavorited(item.id)
                        ? 'text-red-500 opacity-100'
                        : 'text-gray-400 hover:text-red-400'
                    "
                  >
                    <i :class="isFavorited(item.id) ? 'ri-heart-3-fill' : 'ri-heart-3-line'" />
                  </button>
                  <button
                    @click.stop="handlePlayRecord(item)"
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 opacity-0 transition-colors duration-200 hover:text-[var(--accent-color)] group-hover:opacity-100"
                  >
                    <i class="ri-play-fill text-lg" />
                  </button>
                </div>
                <div
                  v-if="!recordList || recordList.length === 0"
                  class="flex h-32 items-center justify-center text-gray-400 dark:text-gray-500"
                >
                  {{ t('user.ranking.empty') || '暂无听歌记录' }}
                </div>
                <play-bottom />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="!isLoggedIn && isMobile"
        class="login-container flex h-full w-full items-center justify-center"
        :class="setAnimationClass('animate__fadeIn')"
      >
        <login-component @login-success="handleLoginSuccess" />
      </div>
      <!-- 非移动端未登录时的占位（路由会自动跳转到 /login） -->
      <div
        v-else-if="!isLoggedIn && !isMobile"
        class="flex h-full w-full items-center justify-center"
      >
        <n-spin size="large" />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { getUserAlbumSublist, getUserDetail, getUserPlaylist, getUserRecord } from '@/api/user';
import { navigateToMusicList } from '@/components/common/MusicListNavigator';
import PlayBottom from '@/components/common/PlayBottom.vue';
import { usePlayerStore } from '@/store/modules/player';
import { useUserStore } from '@/store/modules/user';
import { getImgUrl, isElectron, isMobile, setAnimationClass } from '@/utils';
import { checkLoginStatus as checkAuthStatus } from '@/utils/auth';
import LoginComponent from '@/views/login/index.vue';

defineOptions({
  name: 'User'
});

const { t } = useI18n();
const userStore = useUserStore();
const playerStore = usePlayerStore();
const router = useRouter();
const { userDetail, recordList } = storeToRefs(userStore);
const infoLoading = ref(false);
const albumLoading = ref(false);
const mounted = ref(true);
const message = useMessage();

const tabs = [
  { key: 'created', label: 'user.tabs.created' },
  { key: 'favorite', label: 'user.tabs.favorite' },
  { key: 'album', label: 'user.tabs.album' }
];
const currentTab = ref('created');

const user = computed(() => userStore.user);

const createdPlaylists = computed(() => {
  if (!user.value) return [];
  return userStore.playList.filter((item) => item.creator?.userId === user.value!.userId);
});

const favoritePlaylists = computed(() => {
  if (!user.value) return [];
  return userStore.playList.filter((item) => item.creator?.userId !== user.value!.userId);
});

const currentList = computed(() => {
  if (currentTab.value === 'album') {
    return userStore.albumList;
  }
  return currentTab.value === 'created' ? createdPlaylists.value : favoritePlaylists.value;
});

const getCoverUrl = (item: any) => {
  return item.coverImgUrl || item.picUrl || '';
};

const getItemDescription = (item: any) => {
  if (currentTab.value === 'album') {
    const artist = item.artist?.name || '';
    const size = item.size ? ` · ${item.size}首` : '';
    return `${artist}${size}`;
  } else {
    return `${t('user.playlist.trackCount', { count: item.trackCount })}，${t('user.playlist.playCount', { count: item.playCount })}`;
  }
};

const handleItemClick = (item: any) => {
  if (currentTab.value === 'album') {
    openAlbum(item);
  } else {
    openPlaylist(item);
  }
};

const goToImportPlaylist = () => {
  router.push('/playlist/import');
};

const isFavorited = (songId: number) => {
  return playerStore.favoriteList.some((item: any) => item.id === songId);
};

const toggleFavorite = async (item: any) => {
  const songId = parseInt(item.id);
  if (playerStore.favoriteList.some((s: any) => s.id === songId)) {
    await playerStore.removeFromFavorite(songId);
  } else {
    await playerStore.addToFavorite(songId);
  }
};

const getArtistNames = (item: any) => {
  if (item.ar) return item.ar.map((a: any) => a.name).join(', ');
  if (item.artists) return item.artists.map((a: any) => a.name).join(', ');
  return '';
};

const handlePlayRecord = (item: any) => {
  const tracks = recordList.value || [];
  playerStore.setPlayList(tracks);
  playerStore.setPlay(item);
};

onBeforeUnmount(() => {
  mounted.value = false;
});

const checkLoginStatus = () => {
  if (userStore.user && userStore.loginType) {
    return true;
  }
  const loginInfo = checkAuthStatus();
  if (!loginInfo.isLoggedIn) {
    !isMobile.value && router.push('/login');
    return false;
  }
  return true;
};

const loadPage = async () => {
  if (!mounted.value) return;
  if (!checkLoginStatus()) return;
  await loadData();
};

const loadData = async () => {
  try {
    if (!userDetail.value || !recordList.value?.length) {
      infoLoading.value = true;
    }
    if (!user.value) {
      console.warn('用户数据不存在，尝试重新获取');
      return;
    }
    const promises = [getUserDetail(user.value.userId), getUserRecord(user.value.userId)];
    if (userStore.playList.length === 0) {
      promises.push(getUserPlaylist(user.value.userId));
    }
    const results = await Promise.all(promises);
    if (!mounted.value) return;
    userDetail.value = results[0].data;
    recordList.value = results[1].data.allData.map((item: any) => ({
      ...item,
      ...item.song,
      picUrl: item.song.al.picUrl
    }));
    if (results.length > 2 && results[2].data?.playlist) {
      userStore.playList = results[2].data.playlist;
    }
  } catch (error: any) {
    console.error('加载用户页面失败:', error);
    if (error.response?.status === 401) {
      userStore.handleLogout();
      router.push('/login');
    } else {
      message.error(t('user.message.loadFailed'));
    }
  } finally {
    if (mounted.value) {
      infoLoading.value = false;
    }
  }
};

const loadAlbumList = async () => {
  if (userStore.albumList.length > 0) return;
  try {
    albumLoading.value = true;
    const res = await getUserAlbumSublist({ limit: 100, offset: 0 });
    if (!mounted.value) return;
    userStore.albumList = res.data.data || [];
  } catch (error: any) {
    console.error('加载专辑列表失败:', error);
    message.error('加载专辑列表失败');
  } finally {
    if (mounted.value) {
      albumLoading.value = false;
    }
  }
};

watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    if (newPath === '/user') {
      checkLoginStatus();
      loadData();
    }
  }
);

watch(
  () => userStore.user,
  (newUser) => {
    if (!mounted.value) return;
    if (newUser) {
      checkLoginStatus();
      loadPage();
    }
  }
);

watch(currentTab, async (newTab) => {
  if (newTab === 'album') {
    await userStore.initializeCollectedAlbums();
    if (userStore.albumList.length === 0) {
      loadAlbumList();
    }
  }
});

onMounted(() => {
  checkLoginStatus() && loadData();
});

const openPlaylist = (item: any) => {
  navigateToMusicList(router, {
    id: item.id,
    type: 'playlist',
    name: item.name,
    listInfo: item,
    canRemove: true
  });
};

const openAlbum = async (item: any) => {
  navigateToMusicList(router, {
    id: item.id,
    type: 'album',
    name: item.name,
    listInfo: {
      ...item,
      coverImgUrl: item.picUrl || item.coverImgUrl
    },
    canRemove: false
  });
};

const showFollowList = () => {
  if (!user.value) return;
  router.push('/user/follows');
};

const handleLoginSuccess = () => {
  checkLoginStatus();
  loadData();
};

const isLoggedIn = computed(() => userStore.user);
const currentLoginType = computed(() => userStore.loginType);
</script>

<style lang="scss" scoped>
.user-page {
  @apply flex flex-col min-h-0 overflow-y-auto;
}

.login-type {
  @apply text-sm text-[var(--accent-color)] dark:text-[var(--accent-color)];
}

.mobile {
  .user-page {
    padding-left: var(--page-pl);
    padding-right: var(--page-pr);
  }
  .login-container {
    @apply flex justify-center items-center h-full w-full;
  }
}

:deep(.n-tabs-rail) {
  @apply rounded-xl overflow-hidden !important;
  .n-tabs-capsule {
    @apply rounded-xl !important;
  }
}
</style>
