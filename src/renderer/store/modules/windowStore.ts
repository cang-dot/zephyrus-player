import { defineStore } from 'pinia';
import { ref } from 'vue';

import homeRouter from '@/router/home';
import otherRouter from '@/router/other';

export interface WindowState {
  id: string;
  path: string;
  title: string;
  icon: string;
  component: () => Promise<any>;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 600;
const BASE_Z = 100;
let zCounter = BASE_Z;

// 从路由配置中查找组件加载函数
const allRoutes = [...homeRouter, ...otherRouter];
function findRoute(path: string) {
  return allRoutes.find((r) => r.path === path);
}

export const useWindowStore = defineStore('windowStore', () => {
  const windows = ref<WindowState[]>([]);
  const activeWindowId = ref<string | null>(null);

  // 打开或聚焦窗口
  const openWindow = (path: string, title?: string) => {
    const route = findRoute(path);
    if (!route) {
      // 没找到路由配置，回退到普通导航
      return false;
    }

    // 如果窗口已存在，聚焦它
    const existing = windows.value.find((w) => w.path === path);
    if (existing) {
      focusWindow(existing.id);
      existing.minimized = false;
      activeWindowId.value = existing.id;
      return true;
    }

    // 计算新窗口位置（级联偏移）
    const offset = (windows.value.length % 6) * 30;
    const w: WindowState = {
      id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      path,
      title: title || (route.meta?.title as string) || path,
      icon: (route.meta?.icon as string) || '',
      component: route.component as () => Promise<any>,
      x: 80 + offset,
      y: 60 + offset,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      zIndex: ++zCounter,
      minimized: false,
      maximized: false
    };
    windows.value.push(w);
    activeWindowId.value = w.id;
    return true;
  };

  const closeWindow = (id: string) => {
    const idx = windows.value.findIndex((w) => w.id === id);
    if (idx >= 0) {
      windows.value.splice(idx, 1);
      if (activeWindowId.value === id) {
        activeWindowId.value = windows.value.length > 0
          ? windows.value[windows.value.length - 1].id
          : null;
      }
    }
  };

  const focusWindow = (id: string) => {
    const w = windows.value.find((w) => w.id === id);
    if (w) {
      w.zIndex = ++zCounter;
      activeWindowId.value = id;
    }
  };

  const updatePosition = (id: string, x: number, y: number) => {
    const w = windows.value.find((w) => w.id === id);
    if (w) {
      w.x = x;
      w.y = y;
    }
  };

  const updateSize = (id: string, width: number, height: number) => {
    const w = windows.value.find((w) => w.id === id);
    if (w) {
      w.width = width;
      w.height = height;
    }
  };

  const toggleMinimize = (id: string) => {
    const w = windows.value.find((w) => w.id === id);
    if (w) {
      w.minimized = !w.minimized;
    }
  };

  const toggleMaximize = (id: string) => {
    const w = windows.value.find((w) => w.id === id);
    if (w) {
      w.maximized = !w.maximized;
    }
  };

  const closeAllWindows = () => {
    windows.value = [];
    activeWindowId.value = null;
  };

  return {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    updatePosition,
    updateSize,
    toggleMinimize,
    toggleMaximize,
    closeAllWindows
  };
});
