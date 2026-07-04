<template>
  <div class="control-bar" :class="{ show: showControls }">
    <div class="control-bar__left">
      <span class="music-icon">♪</span>
      <span class="song-name">{{ songName }}</span>
    </div>
    <div class="control-bar__center">
      <button class="ctrl-btn" title="快退 0.5s" @click="$emit('skip-backward')">
        <span class="skip-label">-0.5s</span>
      </button>
      <button class="ctrl-btn" title="快进 0.5s" @click="$emit('skip-forward')">
        <span class="skip-label">+0.5s</span>
      </button>
      <button class="ctrl-btn" @click="$emit('prev')">
        <i class="ri-skip-back-fill"></i>
      </button>
      <button class="ctrl-btn play-btn" @click="$emit('play-pause')">
        <i :class="isPlay ? 'ri-pause-fill' : 'ri-play-fill'"></i>
      </button>
      <button class="ctrl-btn" @click="$emit('next')">
        <i class="ri-skip-forward-fill"></i>
      </button>
    </div>
    <div class="control-bar__right">
      <button class="ctrl-btn" @click="$emit('update:isLock')">
        <i :class="isLocked ? 'ri-lock-line' : 'ri-lock-unlock-line'"></i>
      </button>
      <button class="ctrl-btn" @click="$emit('close')">
        <i class="ri-close-line"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showControls: boolean;
  isLocked: boolean;
  songName: string;
  isPlay: boolean;
}

defineProps<Props>();

defineEmits<{
  'play-pause': []
  'prev': []
  'next': []
  'update:isLock': []
  'close': []
  'skip-forward': []
  'skip-backward': []
}>();
</script>

<style lang="scss" scoped>
.control-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  z-index: 10;
  opacity: 1;
  transition: opacity 0.25s ease;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__center {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.music-icon {
  font-size: 16px;
  color: var(--highlight-color, #1db954);
}

.song-name {
  font-size: 13px;
  color: var(--highlight-color, #1db954);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-size: 18px;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .skip-label {
    font-size: 11px;
    font-weight: 500;
  }
}
</style>
