<template>
  <div class="my-music-page">
    <div class="wall">
      <div class="room-header">
        <h2 class="room-title">我的音乐</h2>
        <p class="room-subtitle">{{ items.length }} 张专辑 · 滚轮/拖拽滑动</p>
      </div>

      <div
        ref="shelfRef"
        class="shelf-viewport"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <div class="shelf-track" :style="{ transform: `translateX(${scrollX}px)` }">
          <div
            v-for="(item, index) in items"
            :key="item.id"
            class="cover-card"
            :class="{ 'is-hovered': hoveredIndex === index }"
            :style="getCardStyle(index)"
            @mouseenter="hoveredIndex = index"
            @mouseleave="hoveredIndex = -1"
            @click="handleItemClick(item)"
          >
            <img :src="getImgUrl(item.src)" :alt="item.alt" draggable="false" />
            <!-- 底部黑色渐变 -->
            <div class="cover-gradient"></div>
            <!-- 专辑名 -->
            <span class="cover-name">{{ item.alt }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@/store';
import { getImgUrl } from '@/utils';

defineOptions({ name: 'MyMusic' });

const router = useRouter();
const userStore = useUserStore();

const items = computed(() => {
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

// === 悬停状态 ===
const hoveredIndex = ref(-1);

const getCardStyle = (index: number) => {
  if (hoveredIndex.value === -1) return {};
  const distance = Math.abs(index - hoveredIndex.value);
  if (distance === 0) {
    return { transform: 'scale(1.15)', zIndex: 10 };
  }
  if (distance === 1) {
    return { transform: 'scale(1.08)' };
  }
  if (distance === 2) {
    return { transform: 'scale(1.03)' };
  }
  return {};
};

// === 滚动 ===
const shelfRef = ref<HTMLElement | null>(null);
const scrollX = ref(0);

const maxScrollX = computed(() => {
  if (!shelfRef.value) return 0;
  const track = shelfRef.value.querySelector('.shelf-track') as HTMLElement;
  if (!track) return 0;
  return Math.max(0, track.scrollWidth - shelfRef.value.clientWidth);
});

const onWheel = (e: WheelEvent) => {
  const delta = e.deltaY || e.deltaX;
  scrollX.value = Math.max(-maxScrollX.value, Math.min(0, scrollX.value - delta));
};

// === 拖拽 ===
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartScrollX = ref(0);
const hasMoved = ref(false);

const onPointerDown = (e: PointerEvent) => {
  isDragging.value = true;
  hasMoved.value = false;
  dragStartX.value = e.clientX;
  dragStartScrollX.value = scrollX.value;
  (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return;
  const dx = e.clientX - dragStartX.value;
  if (Math.abs(dx) > 3) hasMoved.value = true;
  scrollX.value = Math.max(-maxScrollX.value, Math.min(0, dragStartScrollX.value + dx));
};

const onPointerUp = () => { isDragging.value = false; };

// === 点击 ===
const handleItemClick = (item: any) => {
  if (hasMoved.value) return;
  router.push(`/music-list/${item.id}?type=${item.type === 'album' ? 'album' : 'playlist'}`);
};

onMounted(() => {
  if (userStore.playList.length === 0 && userStore.user) userStore.initializePlaylist();
  if (userStore.albumList.length === 0 && userStore.user) userStore.initializeAlbumList();
});
</script>

<style lang="scss" scoped>
.my-music-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.wall {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #ffffff;
  .dark & { background-color: #0a0a0a; }
}

.room-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 10;
  padding: 24px 36px 16px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(255,255,255,0.7) 60%, transparent);
  .dark & {
    background: linear-gradient(to bottom, rgba(10,10,10,0.98), rgba(10,10,10,0.7) 60%, transparent);
  }
}
.room-title {
  font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0;
  .dark & { color: #e0e0e0; }
}
.room-subtitle {
  font-size: 13px; color: #666; margin: 4px 0 0;
  .dark & { color: #888; }
}

// === 滑动视口 ===
.shelf-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  display: flex;
  align-items: center;
  &:active { cursor: grabbing; }
}

// === 轨道 ===
.shelf-track {
  display: flex;
  gap: 20px;
  padding: 0 60px;
  will-change: transform;
}

// === 封面卡片 ===
.cover-card {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

// === 底部黑色渐变 ===
.cover-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;

  .is-hovered & {
    opacity: 1;
  }
}

// === 专辑名 ===
.cover-name {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;

  .is-hovered & {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .shelf-track { gap: 12px; padding: 0 24px; }
  .cover-card { width: 130px; height: 130px; }
}
</style>
