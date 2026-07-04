import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import type { LyricSettings } from './useLyricSettings';

const windowData = window as any;

export function useLyricControls(lyricSetting: Ref<LyricSettings>) {
  const isHovering = ref(false);
  let hideControlsTimer: number | null = null;

  const clearHideTimer = () => {
    if (hideControlsTimer) {
      clearTimeout(hideControlsTimer);
      hideControlsTimer = null;
    }
  };

  const showControls = computed(() => {
    if (lyricSetting.value.isLock) {
      return isHovering.value;
    }
    return true;
  });

  const handleMouseEnter = () => {
    if (lyricSetting.value.isLock) {
      isHovering.value = true;
      windowData.electron.ipcRenderer.send('set-ignore-mouse', true);
    } else {
      windowData.electron.ipcRenderer.send('set-ignore-mouse', false);
    }
  };

  const handleMouseLeave = () => {
    if (!lyricSetting.value.isLock) return;
    isHovering.value = false;
    windowData.electron.ipcRenderer.send('set-ignore-mouse', false);
    const lyricWindow = document.querySelector('.lyric-window') as HTMLElement;
    if (lyricWindow) {
      lyricWindow.style.background = 'transparent';
      requestAnimationFrame(() => {
        lyricWindow.style.background = 'transparent';
      });
    }
  };

  const handlePlayPause = () => {
    windowData.electron.ipcRenderer.send('control-back', 'playpause');
  };

  const handlePrev = () => {
    windowData.electron.ipcRenderer.send('control-back', 'prev');
  };

  const handleNext = () => {
    windowData.electron.ipcRenderer.send('control-back', 'next');
  };

  const handleLock = () => {
    lyricSetting.value.isLock = !lyricSetting.value.isLock;
    windowData.electron.ipcRenderer.send('set-ignore-mouse', lyricSetting.value.isLock);
  };

  const handleClose = () => {
    windowData.electron.ipcRenderer.send('close-lyric');
  };

  const skipForward = () => {
    windowData.electron.ipcRenderer.send('control-back', 'seek-forward');
  };

  const skipBackward = () => {
    windowData.electron.ipcRenderer.send('control-back', 'seek-backward');
  };

  const cycleDisplayMode = () => {
    const modes: Array<'scroll' | 'single' | 'double'> = ['scroll', 'single', 'double'];
    const current = modes.indexOf(lyricSetting.value.displayMode);
    lyricSetting.value.displayMode = modes[(current + 1) % modes.length];
  };

  const checkTheme = () => {
    if (lyricSetting.value.theme === 'light') {
      lyricSetting.value.theme = 'dark';
    } else {
      lyricSetting.value.theme = 'light';
    }
  };

  onMounted(() => {
    if (lyricSetting.value.isLock) {
      isHovering.value = false;
    }
  });

  onUnmounted(() => {
    clearHideTimer();
  });

  return {
    isHovering,
    showControls,
    handleMouseEnter,
    handleMouseLeave,
    handlePlayPause,
    handlePrev,
    handleNext,
    handleLock,
    handleClose,
    skipForward,
    skipBackward,
    cycleDisplayMode,
    checkTheme
  };
}
