/**
 * 封面取色 composable
 *
 * 从当前播放歌曲的封面提取主色，动态更新 CSS 变量
 * 替换全局的绿色主色 #22c55e
 */
import { ref, watch } from 'vue';

import { playMusic } from '@/hooks/MusicHook';
import { getImgUrl } from '@/utils';

// 当前提取的颜色
const primaryColor = ref('#22c55e');
const primaryColorRgb = ref('34, 197, 94');
// 封面原始平均色（不做暖色调整）
const averageColor = ref('#22c55e');
const averageColorRgb = ref('34, 197, 94');

// 默认绿色的 RGB
const DEFAULT_R = 34;
const DEFAULT_G = 197;
const DEFAULT_B = 94;

/**
 * 从图片提取主色（基于 canvas 像素采样）
 */
async function extractColorFromImage(picUrl: string): Promise<{ r: number; g: number; b: number } | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getImgUrl(picUrl, '50y50');
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, 10, 10);
    const data = ctx.getImageData(0, 0, 10, 10).data;

    let r = 0, g = 0, b = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    return {
      r: Math.round(r / pixelCount),
      g: Math.round(g / pixelCount),
      b: Math.round(b / pixelCount)
    };
  } catch {
    return null;
  }
}

/**
 * 将 RGB 颜色调整为适合 UI 的强调色
 * 偏暖、提高饱和度和亮度
 */
function adjustForAccent(r: number, g: number, b: number): { r: number; g: number; b: number } {
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 如果太暗，提亮
  let ar = r;
  let ag = g;
  let ab = b;

  if (brightness < 100) {
    const factor = 150 / Math.max(brightness, 1);
    ar = Math.min(255, Math.round(r * factor));
    ag = Math.min(255, Math.round(g * factor));
    ab = Math.min(255, Math.round(b * factor));
  }

  // 如果太亮（接近白色），降低亮度
  if (brightness > 220) {
    ar = Math.round(ar * 0.7);
    ag = Math.round(ag * 0.7);
    ab = Math.round(ab * 0.7);
  }

  // 偏暖：增加红色和绿色，减少蓝色
  ar = Math.min(255, ar + 15);
  ag = Math.min(255, ag + 10);
  ab = Math.max(0, ab - 20);

  // 确保最低亮度（避免太暗）
  const minBrightness = 80;
  const newBrightness = (ar * 299 + ag * 587 + ab * 114) / 1000;
  if (newBrightness < minBrightness) {
    const factor = minBrightness / Math.max(newBrightness, 1);
    ar = Math.min(255, Math.round(ar * factor));
    ag = Math.min(255, Math.round(ag * factor));
    ab = Math.min(255, Math.round(ab * factor));
  }

  return { r: ar, g: ag, b: ab };
}

/**
 * 更新 CSS 变量
 */
function updateCSSVariables(r: number, g: number, b: number) {
  const color = `rgb(${r}, ${g}, ${b})`;
  const colorRgb = `${r}, ${g}, ${b}`;

  // 更新根元素 CSS 变量
  document.documentElement.style.setProperty('--primary-color', color);
  document.documentElement.style.setProperty('--dynamic-primary', color);
  document.documentElement.style.setProperty('--accent-color', color);
  document.documentElement.style.setProperty('--accent-color-rgb', colorRgb);

  // 生成变体颜色
  const lighter = `${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}`;
  const darker = `${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}`;

  document.documentElement.style.setProperty('--accent-color-light', `rgb(${lighter})`);
  document.documentElement.style.setProperty('--accent-color-dark', `rgb(${darker})`);
  document.documentElement.style.setProperty('--accent-color-10', `rgba(${colorRgb}, 0.1)`);
  document.documentElement.style.setProperty('--accent-color-20', `rgba(${colorRgb}, 0.2)`);

  // 更新 Tailwind 自定义颜色（通过 CSS 变量）
  document.documentElement.style.setProperty('--tw-primary', `${r} ${g} ${b}`);
}

/**
 * 重置为默认绿色
 */
function resetToDefault() {
  primaryColor.value = '#22c55e';
  primaryColorRgb.value = `${DEFAULT_R}, ${DEFAULT_G}, ${DEFAULT_B}`;
  averageColor.value = '#22c55e';
  averageColorRgb.value = `${DEFAULT_R}, ${DEFAULT_G}, ${DEFAULT_B}`;
  updateCSSVariables(DEFAULT_R, DEFAULT_G, DEFAULT_B);
}

/**
 * 初始化封面取色监听
 */
export function initCoverColor() {
  watch(
    () => playMusic.value?.picUrl,
    async (picUrl) => {
      if (!picUrl) {
        resetToDefault();
        return;
      }

      const color = await extractColorFromImage(picUrl);
      if (color) {
        // 封面原始平均色（不做调整）
        averageColor.value = `rgb(${color.r}, ${color.g}, ${color.b})`;
        averageColorRgb.value = `${color.r}, ${color.g}, ${color.b}`;

        const accent = adjustForAccent(color.r, color.g, color.b);
        primaryColor.value = `rgb(${accent.r}, ${accent.g}, ${accent.b})`;
        primaryColorRgb.value = `${accent.r}, ${accent.g}, ${accent.b}`;
        updateCSSVariables(accent.r, accent.g, accent.b);
      }
    },
    { immediate: true }
  );
}

/**
 * 获取当前主色（响应式）
 */
export function useCoverColor() {
  return {
    primaryColor,
    primaryColorRgb,
    averageColor,
    averageColorRgb
  };
}
