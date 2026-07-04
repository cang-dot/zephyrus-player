<template>
  <Transition name="tooltip-fade">
    <div v-if="visible && playMusic?.name" class="lyric-tooltip">
      <div class="tooltip-content">
        <div class="tooltip-cover">
          <img
            v-if="playMusic.albumCover"
            :src="playMusic.albumCover"
            :alt="playMusic.album || ''"
          />
          <div v-else class="tooltip-cover-placeholder">
            <i class="ri-music-2-line"></i>
          </div>
        </div>
        <div class="tooltip-info">
          <div class="tooltip-name">{{ playMusic.name }}</div>
          <div class="tooltip-artist">{{ playMusic.artist || '未知艺术家' }}</div>
          <div class="tooltip-progress">
            <span class="tooltip-time">{{ formatTime(currentTime) }}</span>
            <div class="tooltip-progress-bar">
              <div
                class="tooltip-progress-fill"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <span class="tooltip-time">{{ formatTime(allTime) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SongResult } from '@/types/music';

const props = defineProps<{
  visible: boolean;
  playMusic: SongResult;
  currentTime: number;
  allTime: number;
}>();

const progressPercent = computed(() => {
  if (!props.allTime || props.allTime <= 0) return 0;
  return Math.min((props.currentTime / props.allTime) * 100, 100);
});

const formatTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.lyric-tooltip {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  pointer-events: none;

  .tooltip-content {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(30, 30, 30, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 12px 18px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.45),
      0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .tooltip-cover {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.06);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.25);

      i {
        font-size: 22px;
      }
    }
  }

  .tooltip-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .tooltip-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    line-height: 1.3;
  }

  .tooltip-artist {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    line-height: 1.3;
  }

  .tooltip-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }

  .tooltip-time {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
    font-variant-numeric: tabular-nums;
    min-width: 28px;
    text-align: center;
    line-height: 1;
  }

  .tooltip-progress-bar {
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .tooltip-progress-fill {
    height: 100%;
    background: var(--highlight-color, #1db954);
    border-radius: 2px;
    transition: width 0.3s linear;
  }
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.tooltip-fade-enter-to,
.tooltip-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
