<template>
  <div class="my-playlist-page h-full flex flex-col bg-white dark:bg-black">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 flex-shrink-0">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">我的音乐</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ domeItems.length }} 个内容 · 拖拽旋转 · Ctrl+滚轮缩放
        </p>
      </div>
    </div>

    <!-- 3D Dome Gallery -->
    <div class="flex-grow min-h-0 px-4 pb-4">
      <dome-gallery
        v-if="domeItems.length > 0"
        :images="domeItems"
        :size="domeSize"
        @select="handleItemSelect"
      />
      <div v-else class="h-full flex flex-col items-center justify-center text-gray-400">
        <div
          class="w-24 h-24 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4"
        >
          <i class="ri-play-list-2-line text-4xl text-gray-300 dark:text-gray-600"></i>
        </div>
        <p class="text-lg font-medium text-gray-500 dark:text-gray-400">暂无内容</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">去发现更多音乐吧</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import DomeGallery from '@/components/DomeGallery.vue';
import { useUserStore } from '@/store';
import { isMobile } from '@/utils';

defineOptions({
  name: 'MyPlaylist'
});

const router = useRouter();
const userStore = useUserStore();

const domeItems = computed(() => {
  const playlists = userStore.playList.map((pl: any) => ({
    id: pl.id,
    src: pl.coverImgUrl || '',
    alt: pl.name || '未知歌单',
    type: 'playlist' as const
  }));
  const albums = userStore.albumList.map((al: any) => ({
    id: al.id,
    src: al.picUrl || al.blurPicUrl || '',
    alt: al.name || '未知专辑',
    type: 'album' as const
  }));
  return [...playlists, ...albums];
});

const domeSize = computed(() => (isMobile ? 70 : 110));

const handleItemSelect = (item: any) => {
  if (item.type === 'album') {
    router.push('/music-list/' + item.id + '?type=album');
  } else {
    router.push('/music-list/' + item.id + '?type=playlist');
  }
};

onMounted(() => {
  if (userStore.playList.length === 0 && userStore.user) {
    userStore.initializePlaylist();
  }
  if (userStore.albumList.length === 0 && userStore.user) {
    userStore.initializeAlbumList();
  }
});
</script>

<style lang="scss" scoped>
.my-playlist-page {
  overflow: hidden;
}
</style>
