<template>
  <div
    class="floating-sidebar"
    :class="{ 'fs-expanded': isExpanded }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo / 收起把手 -->
    <div class="fs-header" @click="toggleExpand">
      <img :src="icon" class="fs-logo" alt="logo" />
    </div>

    <!-- 菜单列表 -->
    <div class="fs-list">
      <div v-for="(item, index) in menus" :key="item.path" class="fs-item">
        <n-tooltip
          :delay="200"
          :disabled="isExpanded"
          placement="right"
        >
          <template #trigger>
            <div
              class="fs-item-link"
              :class="{ 'fs-item-active': isActive(item.path) }"
              @click="openPage(item)"
            >
              <i
                class="iconfont fs-item-icon"
                :style="iconStyle(index)"
                :class="item.meta.icon"
              ></i>
              <span
                v-if="isExpanded"
                class="fs-item-text"
                :class="isActive(item.path) ? 'text-[var(--accent-color)]' : ''"
              >{{ t(item.meta.title) }}</span>
            </div>
          </template>
          <div>{{ t(item.meta.title) }}</div>
        </n-tooltip>

        <!-- 歌单子菜单 -->
        <div v-if="isMenuItemPlaylist(item)" class="fs-submenu">
          <div class="fs-submenu-scroll">
            <template v-if="createdPlaylists.length > 0">
              <div
                v-for="pl in createdPlaylists"
                :key="'c-' + pl.id"
                class="fs-submenu-row"
                @click="navigateToPlaylist(pl.id)"
              >
                <img :src="getImgUrl(pl.coverImgUrl, '64y64')" class="fs-submenu-cover" />
                <span v-show="isExpanded" class="fs-submenu-name">{{ pl.name }}</span>
              </div>
            </template>
            <template v-if="collectedPlaylists.length > 0">
              <div
                v-for="pl in collectedPlaylists"
                :key="'d-' + pl.id"
                class="fs-submenu-row"
                @click="navigateToPlaylist(pl.id)"
              >
                <img :src="getImgUrl(pl.coverImgUrl, '64y64')" class="fs-submenu-cover" />
                <span v-show="isExpanded" class="fs-submenu-name">{{ pl.name }}</span>
              </div>
            </template>
            <template v-if="collectedAlbums.length > 0">
              <div
                v-for="al in collectedAlbums"
                :key="'a-' + al.id"
                class="fs-submenu-row"
                @click="navigateToAlbum(al.id)"
              >
                <img :src="getImgUrl(al.picUrl || al.blurPicUrl, '64y64')" class="fs-submenu-cover" />
                <span v-show="isExpanded" class="fs-submenu-name">{{ al.name }}</span>
              </div>
            </template>
            <div
              v-if="createdPlaylists.length === 0 && collectedPlaylists.length === 0 && collectedAlbums.length === 0"
              class="fs-submenu-empty"
            >
              暂无歌单
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
import { useWindowStore } from '@/store/modules/windowStore';
import { useSettingsStore, useUserStore } from '@/store';
import { getImgUrl } from '@/utils';

const props = defineProps({
  menus: {
    type: Array as any,
    default: () => []
  },
  size: {
    type: String,
    default: '22px'
  },
  color: {
    type: String,
    default: '#aaa'
  },
  selectColor: {
    type: String,
    default: undefined
  }
});

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const windowStore = useWindowStore();
const { primaryColor } = useCoverColor();
const { t } = useI18n();

// ==================== 展开/收起 ====================
const isExpanded = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
const COLLAPSE_DELAY = 5000;

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) cancelCollapseTimer();
};

const startCollapseTimer = () => {
  cancelCollapseTimer();
  collapseTimer = setTimeout(() => {
    isExpanded.value = false;
  }, COLLAPSE_DELAY);
};

const cancelCollapseTimer = () => {
  if (collapseTimer) {
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }
};

const handleMouseEnter = () => {
  cancelCollapseTimer();
  isExpanded.value = true;
};

const handleMouseLeave = () => {
  startCollapseTimer();
};

// ==================== 导航 ====================
const isActive = (path: string) => route.path === path;

const openPage = (item: any) => {
  // 尝试用浮动窗口打开
  const opened = windowStore.openWindow(item.path, t(item.meta.title));
  if (!opened) {
    // 回退到普通路由导航
    router.push(item.path);
  }
};

const isMenuItemPlaylist = (item: any) => item.path === '/list';

const createdPlaylists = computed(() => {
  if (!userStore.user) return [];
  return userStore.playList.filter((pl: any) => pl.creator?.userId === userStore.user?.userId);
});

const collectedPlaylists = computed(() => {
  if (!userStore.user) return [];
  return userStore.playList.filter((pl: any) => pl.creator?.userId !== userStore.user?.userId);
});

const collectedAlbums = computed(() => userStore.albumList);

const navigateToPlaylist = (id: number) => {
  router.push('/music-list/' + id + '?type=playlist');
};

const navigateToAlbum = (id: number) => {
  router.push('/music-list/' + id + '?type=album');
};

const activeColor = computed(() => props.selectColor || primaryColor.value || '#888888');

const iconStyle = (index: number) => ({
  fontSize: props.size,
  color: isActive(props.menus[index]?.path) ? activeColor.value : props.color
});
</script>

<style lang="scss" scoped>
.floating-sidebar {
  position: fixed;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 8px 4px;
  z-index: 200;
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: calc(100vh - 100px);
}

.dark .floating-sidebar {
  background: rgba(30, 30, 30, 0.7);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.floating-sidebar.fs-expanded {
  width: 200px;
  align-items: stretch;
}

// Logo
.fs-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 0 8px;
  cursor: pointer;
}

.fs-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

// 菜单列表
.fs-list {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.fs-item {
  margin-bottom: 2px;
}

.fs-item-link {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .dark & {
    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }
}

.fs-expanded .fs-item-link {
  padding: 8px 12px;
}

.fs-item-icon {
  transition: all 0.2s;
  flex-shrink: 0;
  text-align: center;
  width: 28px;

  &:hover {
    transform: scale(1.05);
  }
}

.fs-item-text {
  margin-left: 10px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.8);
}

.dark .fs-item-text {
  color: rgba(255, 255, 255, 0.75);
}

// 子菜单
.fs-submenu {
  padding: 0 6px 6px 16px;
}

.fs-submenu-scroll {
  max-height: 250px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.fs-submenu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.fs-submenu-cover {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.fs-expanded .fs-submenu-cover {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.fs-submenu-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.65);
  max-width: 120px;
}

.fs-submenu-empty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 10px 4px;
}
</style>
