<template>
  <div
    class="infinite-cover-grid"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="grid-track" :style="{ animationPlayState: paused ? 'paused' : 'running' }">
      <!-- Two copies of the list for seamless infinite scroll -->
      <div
        v-for="copy in 2"
        :key="copy"
        class="grid-row"
      >
        <div
          v-for="(item, idx) in displayItems"
          :key="`${copy}-${item.id}-${idx}`"
          class="grid-card group"
          @click="$emit('item-click', item)"
        >
          <div class="card-cover">
            <img
              v-if="item.cover"
              :src="getImgUrl(item.cover, '300y300')"
              :alt="item.name"
              class="cover-img"
              loading="lazy"
            />
            <div v-else class="cover-placeholder">
              <i class="ri-disc-line text-4xl text-[var(--accent-color)] opacity-40" />
            </div>
            <!-- Hover overlay -->
            <div class="card-overlay">
              <div class="card-info">
                <p class="card-name">{{ item.name }}</p>
                <p v-if="item.subtitle" class="card-subtitle">{{ item.subtitle }}</p>
              </div>
              <button
                v-if="showPlayButton"
                class="card-play-btn"
                @click.stop="$emit('item-play', item)"
              >
                <i class="ri-play-fill text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getImgUrl } from '@/utils';

export interface GridItem {
  id: number | string;
  name: string;
  subtitle?: string;
  cover?: string;
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    items: GridItem[];
    showPlayButton?: boolean;
    cardSize?: number;
  }>(),
  {
    showPlayButton: true,
    cardSize: 160
  }
);

defineEmits<{
  (e: 'item-click', item: GridItem): void;
  (e: 'item-play', item: GridItem): void;
}>();

const paused = ref(false);

const displayItems = computed(() => {
  if (props.items.length === 0) return [];
  // Duplicate items if too few for seamless scroll
  if (props.items.length < 8) {
    return [...props.items, ...props.items, ...props.items, ...props.items];
  }
  return props.items;
});
</script>

<style scoped>
.infinite-cover-grid {
  position: relative;
  overflow: hidden;
  width: 100%;
  /* Mask edges for smooth fade */
  mask-image: linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%);
}

.grid-track {
  display: flex;
  gap: 16px;
  width: max-content;
  animation: scroll-left 60s linear infinite;
}

.grid-track:hover {
  /* JS controls pause via animationPlayState */
}

@keyframes scroll-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.grid-row {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.grid-card {
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
}

.card-cover {
  position: relative;
  width: v-bind('cardSize + "px"');
  height: v-bind('cardSize + "px"');
  border-radius: 16px;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.1);
  transition: transform 0.3s cubic-bezier(0.2, 0, 0.1, 1), box-shadow 0.3s ease;
}

.grid-card:hover .card-cover {
  transform: scale(1.06);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--accent-color-rgb, 136, 136, 136), 0.15), rgba(var(--accent-color-rgb, 136, 136, 136), 0.05));
}

/* Hover overlay — shows album/playlist name */
.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 14px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.grid-card:hover .card-overlay {
  opacity: 1;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.card-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.card-play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.card-play-btn:hover {
  transform: scale(1.1);
}
</style>
