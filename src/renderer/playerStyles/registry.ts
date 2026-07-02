import type { Component } from 'vue';

// ==================== 类型定义 ====================

export interface SettingItem {
  key?: string;
  type: 'boolean' | 'slider' | 'color' | 'radio' | 'font' | 'divider';
  label?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  marks?: string[];
  options?: { value: string; label: string; showWhen?: { key: string; is?: string; not?: string } }[];
  showWhen?: { key: string; is?: string; not?: string };
}

export interface PlayerStyleDefinition {
  key: string;
  label: string;
  component: Component;
  isFullScreen?: boolean;
  theme?: 'light' | 'dark';
  showStyleSwitch?: boolean;
  settings?: SettingItem[];
}

// ==================== 注册表 ====================

const styles: PlayerStyleDefinition[] = [];

export function registerStyle(def: PlayerStyleDefinition) {
  const existing = styles.findIndex(s => s.key === def.key);
  if (existing >= 0) {
    styles[existing] = def;
  } else {
    styles.push(def);
  }
}

export function getStyle(key: string): PlayerStyleDefinition | undefined {
  return styles.find(s => s.key === key);
}

export function getAllStyles(): PlayerStyleDefinition[] {
  return [...styles];
}
