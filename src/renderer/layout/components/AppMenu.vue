<template>
  <div>
    <!-- menu -->
    <div class="app-menu" :class="{ 'app-menu-expanded': settingsStore.setData.isMenuExpanded }">
      <div class="app-menu-header">
        <div class="app-menu-logo" @click="toggleMenu">
          <img :src="icon" class="w-9 h-9" alt="logo" />
        </div>
      </div>
      <div class="app-menu-list">
        <div v-for="(item, index) in menus" :key="item.path" class="app-menu-item">
          <n-tooltip
            :delay="200"
            :disabled="settingsStore.setData.isMenuExpanded || isMobile"
            placement="bottom"
          >
            <template #trigger>
              <router-link class="app-menu-item-link" :to="item.path">
                <i
                  class="iconfont app-menu-item-icon"
                  :style="iconStyle(index)"
                  :class="item.meta.icon"
                ></i>
                <span
                  v-if="settingsStore.setData.isMenuExpanded"
                  class="app-menu-item-text ml-3"
                  :class="isChecked(index) ? 'text-[var(--accent-color)]' : ''"
                  >{{ t(item.meta.title) }}</span
                >
              </router-link>
            </template>
            <div v-if="!settingsStore.setData.isMenuExpanded">{{ t(item.meta.title) }}</div>
          </n-tooltip>

          <!-- 歌单手风琴子菜单 -->
          <div
            v-if="isMenuItemPlaylist(item) && settingsStore.setData.isMenuExpanded"
            class="app-menu-submenu"
          >
            <div class="app-menu-submenu-scroll">
              <!-- 创建的歌单 -->
              <div v-if="createdPlaylists.length > 0" class="app-menu-submenu-group">
                <div class="app-menu-submenu-label">创建的歌单</div>
                <div
                  v-for="pl in createdPlaylists"
                  :key="pl.id"
                  class="app-menu-submenu-item"
                  @click="navigateToPlaylist(pl.id)"
                >
                  <img :src="getImgUrl(pl.coverImgUrl, '64y64')" class="app-menu-submenu-cover" />
                  <span class="app-menu-submenu-name">{{ pl.name }}</span>
                </div>
              </div>

              <!-- 收藏的歌单 -->
              <div v-if="collectedPlaylists.length > 0" class="app-menu-submenu-group">
                <div class="app-menu-submenu-label">收藏的歌单</div>
                <div
                  v-for="pl in collectedPlaylists"
                  :key="pl.id"
                  class="app-menu-submenu-item"
                  @click="navigateToPlaylist(pl.id)"
                >
                  <img :src="getImgUrl(pl.coverImgUrl, '64y64')" class="app-menu-submenu-cover" />
                  <span class="app-menu-submenu-name">{{ pl.name }}</span>
                </div>
              </div>

              <!-- 收藏的专辑 -->
              <div v-if="collectedAlbums.length > 0" class="app-menu-submenu-group">
                <div class="app-menu-submenu-label">收藏的专辑</div>
                <div
                  v-for="al in collectedAlbums"
                  :key="al.id"
                  class="app-menu-submenu-item"
                  @click="navigateToAlbum(al.id)"
                >
                  <img
                    :src="getImgUrl(al.picUrl || al.blurPicUrl, '64y64')"
                    class="app-menu-submenu-cover"
                  />
                  <span class="app-menu-submenu-name">{{ al.name }}</span>
                </div>
              </div>

              <div
                v-if="
                  createdPlaylists.length === 0 &&
                  collectedPlaylists.length === 0 &&
                  collectedAlbums.length === 0
                "
                class="app-menu-submenu-empty"
              >
                暂无歌单
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import icon from '@/assets/icon.png';
import { useCoverColor } from '@/hooks/useCoverColor';
import { useSettingsStore, useUserStore } from '@/store';
import { isMobile, getImgUrl } from '@/utils';

const props = defineProps({
  size: {
    type: String,
    default: '26px'
  },
  color: {
    type: String,
    default: '#aaa'
  },
  selectColor: {
    type: String,
    default: undefined
  },
  menus: {
    type: Array as any,
    default: () => []
  }
});

const route = useRoute();
const router = useRouter();
const path = ref(route.path);
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { primaryColor } = useCoverColor();
watch(
  () => route.path,
  async (newParams) => {
    path.value = newParams;
  }
);

const { t } = useI18n();

const isChecked = (index: number) => {
  return path.value === props.menus[index].path;
};

const activeColor = computed(() => props.selectColor || primaryColor.value || '#22c55e');

const iconStyle = (index: number) => {
  const style = {
    fontSize: props.size,
    color: isChecked(index) ? activeColor.value : props.color
  };
  return style;
};

const toggleMenu = () => {
  settingsStore.setSetData({
    isMenuExpanded: !settingsStore.setData.isMenuExpanded
  });
};

// 歌单子菜单相关
const isMenuItemPlaylist = (item: any) => {
  return item.path === '/list';
};

const createdPlaylists = computed(() => {
  if (!userStore.user) return [];
  return userStore.playList.filter((pl: any) => pl.creator?.userId === userStore.user?.userId);
});

const collectedPlaylists = computed(() => {
  if (!userStore.user) return [];
  return userStore.playList.filter((pl: any) => pl.creator?.userId !== userStore.user?.userId);
});

const collectedAlbums = computed(() => {
  return userStore.albumList;
});

const navigateToPlaylist = (id: number) => {
  router.push('/music-list/' + id + '?type=playlist');
};

const navigateToAlbum = (id: number) => {
  router.push('/music-list/' + id + '?type=album');
};
</script>

<style lang="scss" scoped>
.app-menu {
  @apply flex-col items-center justify-center transition-all duration-300 w-[100px] px-1;
}

.app-menu-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  padding-bottom: 20px;
  transition: scrollbar-color 0.3s ease;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 2px;
    transition: background-color 0.3s ease;
  }

  &:hover {
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;

    &::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);

      &:hover {
        background-color: rgba(156, 163, 175, 0.7);
      }
    }
  }
}

.app-menu-expanded {
  @apply w-[200px];

  .app-menu-item {
    @apply hover:bg-gray-100 dark:hover:bg-gray-800 rounded mr-4;
  }
}

.app-menu-item-link,
.app-menu-header {
  @apply flex items-center w-[200px] overflow-hidden ml-2 px-5;
}

.app-menu-header {
  @apply ml-1;
}

.app-menu-item-link {
  @apply mb-2 mt-4;
}

.app-menu-item-icon {
  @apply transition-all duration-200 text-gray-500 dark:text-gray-400;

  &:hover {
    @apply text-[var(--accent-color)] scale-105 !important;
  }
}

// 歌单子菜单样式
.app-menu-submenu {
  width: 100%;
  padding: 0 8px 8px 8px;
}

.app-menu-submenu-scroll {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 2px;
  }

  &:hover {
    scrollbar-color: rgba(156, 163, 175, 0.4) transparent;

    &::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.4);
    }
  }
}

.app-menu-submenu-group {
  margin-bottom: 6px;
}

.app-menu-submenu-label {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px 2px;
  user-select: none;

  .dark & {
    color: #6b7280;
  }
}

.app-menu-submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .dark &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

.app-menu-submenu-cover {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.app-menu-submenu-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;

  .dark & {
    color: #999;
  }
}

.app-menu-submenu-empty {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  padding: 12px 8px;

  .dark & {
    color: #6b7280;
  }
}

.mobile {
  .app-menu {
    max-width: 100%;
    width: 100vw;
    position: relative;
    bottom: 0;
    left: 0;
    z-index: 99999;
    @apply bg-light dark:bg-black border-none border-gray-200 dark:border-gray-700;

    &-header {
      display: none;
    }

    &-list {
      @apply flex justify-between px-4;
      max-height: none !important;
      overflow: visible !important;
    }

    &-item {
      &-link {
        @apply my-2 w-auto px-2;
        width: auto !important;
        margin-top: 8px;
        margin-bottom: 8px;
      }
    }

    &-expanded {
      @apply w-full;
    }
  }
}
</style>
