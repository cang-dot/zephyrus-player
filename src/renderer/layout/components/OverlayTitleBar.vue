<template>
  <div class="tb-zone" @mouseenter="handleZoneEnter" @mouseleave="handleZoneLeave">
    <div
      id="title-bar"
      class="flex justify-between items-center px-4 py-1 select-none relative"
      :class="{ 'tb-hidden': isHidden }"
      @mousedown="drag"
    >
      <div id="title" class="text-sm font-semibold opacity-60">Zephyrus</div>
      <div id="buttons">
        <n-button
          v-if="!isElectron"
          type="primary"
          size="small"
          text
          title="下载应用"
          @click="openDownloadPage"
        >
          <i class="ri-download-line"></i>
          下载桌面版
        </n-button>
        <template v-if="isElectron">
          <div class="titlebar-btn" title="全屏" @click="toggleFullscreen">
            <i :class="isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'"></i>
          </div>
          <div class="titlebar-btn" title="小窗模式" @click="miniWindow">
            <i class="ri-picture-in-picture-line"></i>
          </div>
          <div class="titlebar-btn" title="最小化" @click="minimize">
            <i class="ri-subtract-line"></i>
          </div>
          <div class="titlebar-btn titlebar-btn--close" title="关闭" @click="handleClose">
            <i class="ri-close-line"></i>
          </div>
        </template>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showCloseModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showCloseModal = false"
      >
        <div
          class="relative w-[360px] transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <button
            class="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors focus:outline-none"
            @click="showCloseModal = false"
          >
            <i class="ri-close-line text-xl leading-none"></i>
          </button>

          <h3 class="text-lg font-bold leading-6 text-neutral-900 dark:text-white mb-2">
            {{ t('comp.titleBar.closeApp') }}
          </h3>
          <div class="mt-2">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ t('comp.titleBar.closeTitle') }}
            </p>
          </div>

          <div
            class="mt-4 flex w-fit cursor-pointer items-center gap-2 group"
            @click="rememberChoice = !rememberChoice"
          >
            <div
              class="relative flex h-5 w-5 items-center justify-center transition-colors duration-200"
              :class="
                rememberChoice
                  ? 'text-[var(--accent-color)]'
                  : 'text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400'
              "
            >
              <i
                class="text-xl"
                :class="
                  rememberChoice ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'
            </span>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
              @click="showCloseModal = false"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
              @click="handleAction('close')"
            >
              {{ t('comp.titleBar.exitApp') }}
            </button>
            <button
              class="rounded-full bg-[var(--accent-color)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--accent-color-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 transition-colors shadow-lg shadow-[var(--accent-color)]/20"
              @click="handleAction('minimize')"
            >
              {{ t('comp.titleBar.minimizeToTray') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useSettingsStore } from '@/store/modules/settings';
import { useWindowStore } from '@/store/modules/windowStore';
import { isElectron } from '@/utils';

const { t } = useI18n();

const settingsStore = useSettingsStore();
const windowStore = useWindowStore();
const showCloseModal = ref(false);
const rememberChoice = ref(false);
const isFullscreen = ref(false);

// ==================== 自动收起 ====================
const isHidden = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const getAutoCollapseDelay = () => {
  return (settingsStore.setData?.overlayAutoCollapseDelay || 5) * 1000;
};
const isAutoCollapseEnabled = () => {
  return settingsStore.setData?.overlayAutoCollapse !== false;
};

const startHideTimer = () => {
  if (!isAutoCollapseEnabled()) return;
  if (windowStore.activePath) return; // 有悬浮面板时不收起
  if (showCloseModal.value) return; // 有弹窗时不收起
  cancelHideTimer();
  hideTimer = setTimeout(() => {
    if (windowStore.activePath || showCloseModal.value) return;
    isHidden.value = true;
  }, getAutoCollapseDelay());
};

const cancelHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const handleZoneEnter = () => {
  cancelHideTimer();
  isHidden.value = false;
};

const handleZoneLeave = () => {
  startHideTimer();
};

// 面板状态变化时更新
watch(
  () => windowStore.activePath,
  (newPath) => {
    if (!newPath) {
      isHidden.value = false;
      startHideTimer();
    } else {
      cancelHideTimer();
      isHidden.value = false;
    }
  }
);

watch(showCloseModal, (open) => {
  if (open) {
    cancelHideTimer();
    isHidden.value = false;
  } else {
    startHideTimer();
  }
});

onMounted(() => {
  startHideTimer();
});

onUnmounted(() => {
  cancelHideTimer();
});

const openDownloadPage = () => {
  if (!isElectron) {
    window.open('https://github.com/cang-dot/zephyrus-player/releases', '_blank');
  }
};

const minimize = () => {
  if (!isElectron) return;
  window.api.minimize();
};

const miniWindow = () => {
  if (!isElectron) return;
  window.api.miniWindow();
};

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch (error) {
    console.error('全屏切换失败:', error);
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

const handleAction = (action: 'minimize' | 'close') => {
  if (rememberChoice.value) {
    settingsStore.setSetData({
      ...settingsStore.setData,
      closeAction: action
    });
  }

  if (action === 'minimize') {
    showCloseModal.value = false;
    setTimeout(() => {
      window.api.miniTray();
    }, 200);
  } else {
    window.api.quitApp();
    showCloseModal.value = false;
  }
};

const handleClose = () => {
  const { closeAction } = settingsStore.setData;

  if (closeAction === 'minimize') {
    window.api.miniTray();
  } else if (closeAction === 'close') {
    window.api.close();
  } else {
    showCloseModal.value = true;
  }
};

const drag = (event: MouseEvent) => {
  if (!isElectron) return;
  window.api.dragStart(event as unknown as string);
};
</script>

<style scoped lang="scss">
/* 顶部触发区域 */
.tb-zone {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  z-index: 199;
}

#title-bar {
  -webkit-app-region: drag;
  z-index: 200;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

#title-bar.tb-hidden {
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
}

#title {
  -webkit-app-region: drag;
}

#buttons {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统一按钮风格 */
.titlebar-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  color: #fff;
  font-size: 18px;
}

.titlebar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.titlebar-btn--close:hover {
  background: #ef4444;
  color: #fff;
}

</style>

<style lang="scss">
/* 亮色主题下使用深色文字（非 scoped，避免 :global 在 SCSS 中编译异常） */
html:not(.dark) .titlebar-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #4b5563;
}

html:not(.dark) .titlebar-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

html:not(.dark) .titlebar-btn--close:hover {
  background: #ef4444;
  color: #fff;
}
</style>
