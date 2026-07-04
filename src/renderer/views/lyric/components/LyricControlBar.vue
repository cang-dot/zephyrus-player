<template>
  <div class="control-bar" :class="{ 'control-bar-show': showControls }">
    <div class="font-size-controls">
      <n-button-group>
        <div class="control-button" @click="$emit('decrease-font')">
          <i class="ri-subtract-line"></i>
        </div>
        <div class="control-button" @click="$emit('increase-font')">
          <i class="ri-add-line"></i>
        </div>
      </n-button-group>
      <div v-html="playMusicName"></div>
    </div>

    <div class="play-controls">
      <div class="control-button" @click="$emit('prev')">
        <i class="ri-skip-back-fill"></i>
      </div>
      <div class="control-button play-button" @click="$emit('play-pause')">
        <i :class="isPlay ? 'ri-pause-fill' : 'ri-play-fill'"></i>
      </div>
      <div class="control-button" @click="$emit('next')">
        <i class="ri-skip-forward-fill"></i>
      </div>
    </div>

    <div class="control-buttons">
      <div class="control-button" @click="$emit('update:theme')">
        <i v-if="theme === 'light'" class="ri-sun-line"></i>
        <i v-else class="ri-moon-line"></i>
      </div>
      <div
        class="control-button theme-color-button"
        :class="{ active: showThemeColorPanel }"
        @click="$emit('update:showThemeColorPanel')"
      >
        <i class="ri-palette-line"></i>
      </div>
      <div
        v-if="hasTranslation"
        class="control-button"
        :title="showTranslation ? '隐藏翻译' : '显示翻译'"
        @click="$emit('update:showTranslation')"
      >
        <i class="ri-translate-2" :class="{ active: showTranslation }"></i>
      </div>
      <div
        class="control-button"
        :title="
          displayMode === 'scroll'
            ? '滚动模式'
            : displayMode === 'single'
              ? '单行模式'
              : '双行模式'
        "
        @click="$emit('update:displayMode')"
      >
        <i
          :class="{
            'ri-align-justify': displayMode === 'scroll',
            'ri-subtract-line': displayMode === 'single',
            'ri-layout-row-line': displayMode === 'double'
          }"
        ></i>
      </div>
      <div class="control-button" @click="$emit('update:isLock')">
        <i v-if="isLocked" class="ri-lock-line"></i>
        <i v-else class="ri-lock-unlock-line"></i>
      </div>
      <div class="control-button" @click="$emit('close')">
        <i class="ri-close-line"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showControls: boolean;
  displayMode: string;
  isLocked: boolean;
  theme: string;
  hasTranslation: boolean;
  showTranslation: boolean;
  showThemeColorPanel: boolean;
  currentHighlightColor: string;
  playMusicName: string;
  isPlay: boolean;
}>();

defineEmits<{
  'update:displayMode': [];
  'update:theme': [];
  'update:showTranslation': [];
  'update:isLock': [];
  'update:showThemeColorPanel': [];
  'update:highlightColor': [color: string];
  'color-change': [color: string];
  'play-pause': [];
  prev: [];
  next: [];
  'increase-font': [];
  'decrease-font': [];
  close: [];
}>();
</script>

<style lang="scss" scoped>
.control-bar {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 0 20px;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  z-index: 100;

  &-show {
    opacity: 1;
    visibility: visible;
  }

  .font-size-controls {
    -webkit-app-region: no-drag;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .play-controls {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;
    -webkit-app-region: no-drag;

    .play-button {
      width: 36px;
      height: 36px;

      i {
        font-size: 24px;
      }
    }
  }

  .control-buttons {
    -webkit-app-region: no-drag;
  }
}

.control-buttons {
  display: flex;
  gap: 16px;
  -webkit-app-region: no-drag;
}

.control-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  color: var(--text-color);
  transition: all 0.2s ease;

  &:hover {
    background: var(--control-bg);
  }

  i {
    font-size: 20px;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

    &.active {
      color: var(--highlight-color);
    }
  }

  &.theme-color-button {
    &.active {
      background: var(--control-bg);

      i {
        color: var(--highlight-color);
      }
    }
  }
}

.lyric_lock {
  .control-buttons {
    .control-button {
      &:not(:has(.ri-lock-line)):not(:has(.ri-lock-unlock-line)) {
        display: none;
      }
    }
  }

  .font-size-controls {
    display: none;
  }

  .play-controls {
    display: none;
  }
}
</style>
