/**
 * Android 原生桥接服务
 * 通过 window.AndroidNative (JavascriptInterface) 与原生 Android 层通信
 * 包括：状态栏外观控制、音乐通知（MediaSession）、安全区域、返回手势、系统设置
 */

import { usePlayerStore } from '@/store/modules/player';
import { useSettingsStore } from '@/store/modules/settings';
import { allTime, artistList, nowTime, playMusic } from '@/hooks/MusicHook';
import { getImgUrl } from '@/utils';
import { watch } from 'vue';

type NativeBridge = {
  setStatusBarDark: (isDark: boolean) => void;
  getSafeAreaInsets: () => string;
  updateMediaNotification: (
    title: string,
    artist: string,
    album: string,
    artworkUrl: string,
    isPlaying: boolean,
    duration: number,
    position: number
  ) => void;
  clearMediaNotification: () => void;
  openBatteryOptimizationSettings: () => void;
  openAutoStartSettings: () => void;
  openNotificationSettings: () => void;
  openAppDetailsSettings: () => void;
  openDisplayOverOtherAppsSettings: () => void;
  exitApp: () => void;
};

declare global {
  interface Window {
    AndroidNative?: NativeBridge;
  }
}

/** 是否在 Android 原生环境中 */
export const isAndroidNative = (): boolean => {
  return typeof window !== 'undefined' && !!window.AndroidNative;
};

/**
 * 更新状态栏图标外观以匹配当前主题
 * @param isDark 是否为深色主题
 */
export function updateStatusBarTheme(isDark: boolean) {
  if (isAndroidNative()) {
    try {
      window.AndroidNative!.setStatusBarDark(isDark);
    } catch (e) {
      console.warn('[NativeBridge] 更新状态栏外观失败:', e);
    }
  }
}

/**
 * 请求原生层注入安全区域 CSS 变量
 */
export function injectSafeAreaInsets() {
  if (!isAndroidNative()) return;
  try {
    const json = window.AndroidNative!.getSafeAreaInsets();
    const insets = JSON.parse(json);
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
    root.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
  } catch (e) {
    console.warn('[NativeBridge] 注入安全区域失败:', e);
  }
}

/**
 * 更新音乐通知
 */
export function updateMusicNotification() {
  if (!isAndroidNative()) return;

  const playerStore = usePlayerStore();
  // playMusic 在 initMusicHook 后才被赋值，需做安全检查
  const song = playMusic?.value;
  if (!song || !song.id) {
    window.AndroidNative!.clearMediaNotification();
    return;
  }

  const title = song.name || '未知歌曲';
  const artists = artistList?.value || [];
  const artist = artists.map((a: any) => a.name).join(' / ');
  const album = song.al?.name || song.album?.name || '';
  const artworkUrl = getImgUrl(song.picUrl, '300y300');
  const isPlaying = playerStore.isPlay;
  const duration = allTime.value || 0;
  const position = nowTime.value || 0;

  try {
    window.AndroidNative!.updateMediaNotification(
      title,
      artist,
      album,
      artworkUrl,
      isPlaying,
      duration,
      position
    );
  } catch (e) {
    console.warn('[NativeBridge] 更新音乐通知失败:', e);
  }
}

/**
 * 清除音乐通知
 */
export function clearMusicNotification() {
  if (!isAndroidNative()) return;
  try {
    window.AndroidNative!.clearMediaNotification();
  } catch (e) {
    console.warn('[NativeBridge] 清除音乐通知失败:', e);
  }
}

/**
 * 监听通知栏媒体按钮事件（播放/暂停/上一首/下一首）
 */
export function setupMediaButtonListener() {
  if (!isAndroidNative()) return;

  const playerStore = usePlayerStore();

  window.addEventListener('media-button', ((e: CustomEvent) => {
    const action = e.detail;
    switch (action) {
      case 'play':
      case 'pause':
        if (playMusic?.value) {
          playerStore.setPlay(playMusic.value);
        }
        break;
      case 'next':
        playerStore.nextPlay();
        break;
      case 'prev':
        playerStore.prevPlay();
        break;
      case 'stop':
        playerStore.handlePause();
        clearMusicNotification();
        break;
    }
  }) as EventListener);
}

// ==================== 返回手势处理 ====================

let backPressHandlers: (() => boolean)[] = [];

/**
 * 注册返回手势处理器
 * @param handler 返回 true 表示已处理（阻止退出），返回 false 表示未处理（允许退出）
 * @returns 取消注册的函数
 */
export function registerBackHandler(handler: () => boolean): () => void {
  backPressHandlers.push(handler);
  return () => {
    backPressHandlers = backPressHandlers.filter((h) => h !== handler);
  };
}

/**
 * 设置返回手势监听
 * 当原生层触发 native-back-press 事件时，依次调用已注册的处理器
 * 如果所有处理器都返回 false，则不阻止默认行为（退出应用）
 */
export function setupBackButtonListener() {
  if (!isAndroidNative()) return;

  window.addEventListener('native-back-press', ((e: CustomEvent) => {
    // 依次调用处理器，如果任意一个返回 true 则阻止退出
    const handled = backPressHandlers.some((handler) => {
      try {
        return handler();
      } catch {
        return false;
      }
    });

    if (handled) {
      e.preventDefault();
    }
  }) as EventListener);
}

// ==================== 打开系统设置 ====================

export function openBatteryOptimizationSettings() {
  if (!isAndroidNative()) return;
  window.AndroidNative!.openBatteryOptimizationSettings();
}

export function openAutoStartSettings() {
  if (!isAndroidNative()) return;
  window.AndroidNative!.openAutoStartSettings();
}

export function openNotificationSettings() {
  if (!isAndroidNative()) return;
  window.AndroidNative!.openNotificationSettings();
}

export function openAppDetailsSettings() {
  if (!isAndroidNative()) return;
  window.AndroidNative!.openAppDetailsSettings();
}

export function openDisplayOverOtherAppsSettings() {
  if (!isAndroidNative()) return;
  window.AndroidNative!.openDisplayOverOtherAppsSettings();
}

// ==================== 初始化 ====================

/**
 * 初始化原生桥接：监听主题变化、播放状态变化、歌曲变化
 * 应在 App.vue 的 onMounted 中调用
 */
export function initNativeBridge() {
  if (!isAndroidNative()) return;

  const playerStore = usePlayerStore();
  const settingsStore = useSettingsStore();

  // 1. 同步状态栏外观到当前主题
  updateStatusBarTheme(settingsStore.theme === 'dark');

  // 2. 注入安全区域 CSS 变量
  injectSafeAreaInsets();
  // 延迟再次注入，确保 WebView 完全加载
  setTimeout(() => injectSafeAreaInsets(), 1000);

  // 3. 监听主题变化
  watch(
    () => settingsStore.theme,
    (newTheme) => {
      updateStatusBarTheme(newTheme === 'dark');
    }
  );

  // 4. 监听歌曲变化
  watch(
    () => playMusic?.value?.id,
    () => {
      updateMusicNotification();
    }
  );

  // 5. 监听播放状态变化
  watch(
    () => playerStore.isPlay,
    () => {
      updateMusicNotification();
    }
  );

  // 6. 定时更新播放进度（每5秒）
  setInterval(() => {
    if (playerStore.isPlay) {
      updateMusicNotification();
    }
  }, 5000);

  // 7. 设置媒体按钮监听
  setupMediaButtonListener();

  // 8. 设置返回手势监听
  setupBackButtonListener();

  console.log('[NativeBridge] 原生桥接已初始化');
}
