<template>
  <div
    class="w-80 rounded-2xl bg-black/30 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden"
  >
    <!-- 标题栏 -->
    <div class="px-6 py-4 border-b border-white/5">
      <div class="flex items-center gap-3">
        <button
          v-if="styleSettingsView"
          @click="styleSettingsView = null"
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          <i class="ri-arrow-left-s-line text-white/80"></i>
        </button>
        <h2 class="text-lg font-semibold tracking-tight text-white/90">
          {{ styleSettingsView ? styleSettingsTitle : t('settings.lyricSettings.title') }}
        </h2>
      </div>
    </div>

    <!-- 内容区域 -->
    <div
      class="px-3 pb-3 max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
    >
      <!-- ==================== 主视图：样式选择器 ==================== -->
      <div v-if="!styleSettingsView" class="space-y-2 pt-2">
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.pureMode') }}</span>
          <input type="checkbox" v-model="config.pureModeEnabled" class="toggle-switch" />
        </div>
        <div class="style-grid">
          <div
            v-for="style in playerStyles"
            :key="style.key"
            class="style-card"
            :class="{ selected: config.playerStyle === style.key }"
            @click="config.playerStyle = style.key"
          >
            <div class="style-card-preview" :class="'preview-' + style.key"></div>
            <div class="style-card-name">{{ style.label }}</div>
            <button class="style-settings-btn" @click.stop="openStyleSettings(style.key)">
              <svg viewBox="0 0 24 24">
                <path
                  d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 12.44a.49.49 0 00.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== 默认样式设置 ==================== -->
      <div v-if="styleSettingsView === 'default'" class="space-y-2 pt-2">
        <!-- 基础设置 -->
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.hideCover') }}</span>
          <input type="checkbox" v-model="config.hideCover" class="toggle-switch" />
        </div>
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.centerDisplay') }}</span>
          <input type="checkbox" v-model="config.centerLyrics" class="toggle-switch" />
        </div>
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.showTranslation') }}</span>
          <input type="checkbox" v-model="config.showTranslation" class="toggle-switch" />
        </div>
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.hideLyrics') }}</span>
          <input type="checkbox" v-model="config.hideLyrics" class="toggle-switch" />
        </div>

        <div class="radio-group-divider"></div>

        <!-- 界面设置 -->
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.showMiniPlayBar') }}</span>
          <input type="checkbox" v-model="showMiniPlayBar" class="toggle-switch" />
        </div>
        <div class="slider-group">
          <label class="slider-label">{{ t('settings.lyricSettings.contentWidth') }}</label>
          <input
            type="range"
            v-model.number="config.contentWidth"
            min="50"
            max="100"
            step="5"
            class="slider-emerald"
            :style="{ '--val-pct': sliderPct(config.contentWidth, 50, 100) }"
          />
          <div class="slider-marks"><span>50%</span><span>75%</span><span>100%</span></div>
        </div>

        <div class="radio-group-divider"></div>

        <!-- 文字设置 -->
        <div class="slider-group">
          <label class="slider-label">{{ t('settings.lyricSettings.fontSize') }}</label>
          <input
            type="range"
            v-model.number="config.fontSize"
            min="12"
            max="32"
            step="1"
            class="slider-emerald"
            :style="{ '--val-pct': sliderPct(config.fontSize, 12, 32) }"
          />
          <div class="slider-marks">
            <span>{{ t('settings.lyricSettings.fontSizeMarks.small') }}</span>
            <span>{{ t('settings.lyricSettings.fontSizeMarks.medium') }}</span>
            <span>{{ t('settings.lyricSettings.fontSizeMarks.large') }}</span>
          </div>
        </div>
        <div class="slider-group">
          <label class="slider-label">{{ t('settings.lyricSettings.letterSpacing') }}</label>
          <input
            type="range"
            v-model.number="config.letterSpacing"
            min="-2"
            max="10"
            step="0.2"
            class="slider-emerald"
            :style="{ '--val-pct': sliderPct(config.letterSpacing, -2, 10) }"
          />
          <div class="slider-marks">
            <span>{{ t('settings.lyricSettings.letterSpacingMarks.compact') }}</span>
            <span>{{ t('settings.lyricSettings.letterSpacingMarks.default') }}</span>
            <span>{{ t('settings.lyricSettings.letterSpacingMarks.loose') }}</span>
          </div>
        </div>
        <div class="slider-group">
          <label class="slider-label">{{ t('settings.lyricSettings.fontWeight') }}</label>
          <input
            type="range"
            v-model.number="config.fontWeight"
            min="100"
            max="900"
            step="100"
            class="slider-emerald"
            :style="{ '--val-pct': sliderPct(config.fontWeight, 100, 900) }"
          />
          <div class="slider-marks">
            <span>{{ t('settings.lyricSettings.fontWeightMarks.thin') }}</span>
            <span>{{ t('settings.lyricSettings.fontWeightMarks.normal') }}</span>
            <span>{{ t('settings.lyricSettings.fontWeightMarks.bold') }}</span>
          </div>
        </div>
        <div class="slider-group">
          <label class="slider-label">{{ t('settings.lyricSettings.lineHeight') }}</label>
          <input
            type="range"
            v-model.number="config.lineHeight"
            min="1"
            max="3"
            step="0.1"
            class="slider-emerald"
            :style="{ '--val-pct': sliderPct(config.lineHeight, 1, 3) }"
          />
          <div class="slider-marks">
            <span>{{ t('settings.lyricSettings.lineHeightMarks.compact') }}</span>
            <span>{{ t('settings.lyricSettings.lineHeightMarks.default') }}</span>
            <span>{{ t('settings.lyricSettings.lineHeightMarks.loose') }}</span>
          </div>
        </div>

        <div class="radio-group-divider"></div>

        <!-- 背景设置 -->
        <div class="setting-item">
          <span>{{ t('settings.lyricSettings.background.useCustomBackground') }}</span>
          <input type="checkbox" v-model="config.useCustomBackground" class="toggle-switch" />
        </div>

        <div v-if="!config.useCustomBackground" class="radio-group">
          <label class="radio-label">{{ t('settings.lyricSettings.backgroundTheme') }}</label>
          <div class="space-y-2">
            <label class="radio-item"
              ><input
                type="radio"
                v-model="config.theme"
                value="default"
                class="radio-input"
              /><span>{{ t('settings.lyricSettings.themeOptions.default') }}</span></label
            >
            <label class="radio-item"
              ><input
                type="radio"
                v-model="config.theme"
                value="light"
                class="radio-input"
              /><span>{{ t('settings.lyricSettings.themeOptions.light') }}</span></label
            >
            <label class="radio-item"
              ><input
                type="radio"
                v-model="config.theme"
                value="dark"
                class="radio-input"
              /><span>{{ t('settings.lyricSettings.themeOptions.dark') }}</span></label
            >
          </div>
        </div>

        <div v-if="config.useCustomBackground" class="radio-group">
          <label class="radio-label">{{
            t('settings.lyricSettings.background.backgroundMode')
          }}</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="radio-item-compact"
              ><input
                type="radio"
                v-model="config.backgroundMode"
                value="solid"
                class="radio-input"
              /><span>{{ t('settings.lyricSettings.background.modeOptions.solid') }}</span></label
            >
            <label class="radio-item-compact"
              ><input
                type="radio"
                v-model="config.backgroundMode"
                value="gradient"
                class="radio-input"
              /><span>{{
                t('settings.lyricSettings.background.modeOptions.gradient')
              }}</span></label
            >
            <label class="radio-item-compact"
              ><input
                type="radio"
                v-model="config.backgroundMode"
                value="image"
                class="radio-input"
              /><span>{{ t('settings.lyricSettings.background.modeOptions.image') }}</span></label
            >
            <label class="radio-item-compact"
              ><input
                type="radio"
                v-model="config.backgroundMode"
                value="css"
                class="radio-input"
              /><span>{{ t('settings.lyricSettings.background.modeOptions.css') }}</span></label
            >
          </div>
        </div>

        <!-- 纯色 -->
        <div
          v-if="config.useCustomBackground && config.backgroundMode === 'solid'"
          class="color-picker-group"
        >
          <label class="color-picker-label">{{
            t('settings.lyricSettings.background.solidColor')
          }}</label>
          <input type="color" v-model="config.solidColor" class="color-picker" />
        </div>

        <!-- 渐变 -->
        <div
          v-if="config.useCustomBackground && config.backgroundMode === 'gradient'"
          class="space-y-3"
        >
          <label class="color-picker-label">{{
            t('settings.lyricSettings.background.gradientEditor')
          }}</label>
          <div class="flex flex-wrap gap-2">
            <div v-for="(_, index) in config.gradientColors.colors" :key="index" class="relative">
              <input
                type="color"
                v-model="config.gradientColors.colors[index]"
                class="color-picker-small"
              />
              <button
                v-if="config.gradientColors.colors.length > 2"
                @click="removeGradientColor(index)"
                class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
          <button
            v-if="config.gradientColors.colors.length < 5"
            @click="addGradientColor"
            class="w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 text-white/90"
            :style="{ background: `${primaryColor}33` }"
            @mouseenter="$event.target.style.background = `${primaryColor}4d`"
            @mouseleave="$event.target.style.background = `${primaryColor}33`"
          >
            <i class="ri-add-line"></i>{{ t('settings.lyricSettings.background.addColor') }}
          </button>
          <div class="select-group">
            <label class="select-label">{{
              t('settings.lyricSettings.background.gradientDirection')
            }}</label>
            <select v-model="config.gradientColors.direction" class="select-input">
              <option v-for="opt in gradientDirectionOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 图片 -->
        <div
          v-if="config.useCustomBackground && config.backgroundMode === 'image'"
          class="space-y-3"
        >
          <label class="color-picker-label">{{
            t('settings.lyricSettings.background.imageUpload')
          }}</label>
          <input
            type="file"
            accept="image/*"
            @change="handleImageChange"
            class="hidden"
            ref="fileInput"
          />
          <button
            @click="fileInput?.click()"
            class="w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 text-white/90"
            :style="{ background: `${primaryColor}33` }"
            @mouseenter="$event.target.style.background = `${primaryColor}4d`"
            @mouseleave="$event.target.style.background = `${primaryColor}33`"
          >
            <i class="ri-image-add-line"></i
            >{{ t('settings.lyricSettings.background.imageUpload') }}
          </button>
          <div v-if="config.backgroundImage" class="space-y-3">
            <div class="relative rounded-lg overflow-hidden border border-white/10">
              <img
                :src="config.backgroundImage"
                class="w-full max-h-40 object-cover"
                alt="Preview"
              />
              <button
                @click="clearBackgroundImage"
                class="absolute top-2 right-2 p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
            <div class="slider-group">
              <label class="slider-label">{{
                t('settings.lyricSettings.background.imageBlur')
              }}</label>
              <input
                type="range"
                v-model.number="config.imageBlur"
                min="0"
                max="20"
                step="1"
                class="slider-emerald"
                :style="{ '--val-pct': sliderPct(config.imageBlur, 0, 20) }"
              />
              <div class="slider-marks"><span>0</span><span>10</span><span>20px</span></div>
            </div>
            <div class="slider-group">
              <label class="slider-label">{{
                t('settings.lyricSettings.background.imageBrightness')
              }}</label>
              <input
                type="range"
                v-model.number="config.imageBrightness"
                min="0"
                max="200"
                step="5"
                class="slider-emerald"
                :style="{ '--val-pct': sliderPct(config.imageBrightness, 0, 200) }"
              />
              <div class="slider-marks"><span>暗</span><span>正常</span><span>亮</span></div>
            </div>
          </div>
          <p class="text-xs text-white/50">
            {{ t('settings.lyricSettings.background.fileSizeLimit') }}
          </p>
        </div>

        <!-- CSS -->
        <div v-if="config.useCustomBackground && config.backgroundMode === 'css'" class="space-y-2">
          <label class="color-picker-label">{{
            t('settings.lyricSettings.background.customCss')
          }}</label>
          <textarea
            v-model="config.customCss"
            :placeholder="t('settings.lyricSettings.background.customCssPlaceholder')"
            rows="4"
            class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 font-mono text-white/90"
            :style="{ '--tw-ring-color': `${primaryColor}80` }"
          ></textarea>
          <p class="text-xs text-white/50">
            {{ t('settings.lyricSettings.background.customCssHelp') }}
          </p>
        </div>
      </div>

      <!-- 舞台样式设置 -->
      <setting-renderer
        v-if="styleSettingsView === 'stage'"
        :settings="currentStyleSettings"
        :config="config"
        @update:config="config = $event"
      />

      <!-- 杂志样式设置 -->
      <setting-renderer
        v-if="styleSettingsView === 'magazine'"
        :settings="currentStyleSettings"
        :config="config"
        @update:config="config = $event"
      />

      <!-- 狂躁样式设置 -->
      <setting-renderer
        v-if="styleSettingsView === 'frenzy'"
        :settings="currentStyleSettings"
        :config="config"
        @update:config="config = $event"
      />

      <!-- 通用样式设置（动态注册的样式） -->
      <setting-renderer
        v-if="styleSettingsView && !['default', 'stage', 'magazine', 'frenzy'].includes(styleSettingsView) && currentStyleSettings.length > 0"
        :settings="currentStyleSettings"
        :config="config"
        @update:config="config = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useCoverColor } from '@/hooks/useCoverColor';
import { isFeatureEnabled } from '@/features/store';
import { getAllStyles, getStyle } from '@/playerStyles';
import { DEFAULT_LYRIC_CONFIG, LyricConfig } from '@/types/lyric';

import SettingRenderer from './SettingRenderer.vue';

const { t } = useI18n();
const { primaryColor, primaryColorRgb } = useCoverColor();
const config = ref<LyricConfig>({ ...DEFAULT_LYRIC_CONFIG });
const emit = defineEmits(['themeChange']);
const message = window.$message;
const fileInput = ref<HTMLInputElement>();

function sliderPct(val: number, min: number, max: number): string {
  return `${((val - min) / (max - min)) * 100}%`;
}

const showMiniPlayBar = computed({
  get: () => !config.value.hideMiniPlayBar,
  set: (value: boolean) => {
    config.value.hideMiniPlayBar = !value;
    config.value.hidePlayBar = value;
  }
});

const intensityOptions = computed(() => [
  { label: '柔和', value: 'soft' as const },
  { label: '正常', value: 'normal' as const },
  { label: '力量', value: 'power' as const }
]);

const gridDensityOptions = computed(() => [
  { label: '8列', value: 8 },
  { label: '12列', value: 12 },
  { label: '20列', value: 20 }
]);

const systemFontOptions = ref<string[]>(['PingFang SC', 'Microsoft YaHei', 'SimHei']);

const showFontDropdown = ref(false);
const fontDropdownRef = ref<HTMLElement | null>(null);

function selectFont(font: string) {
  config.value.frenzyCustomFont = font;
  showFontDropdown.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (fontDropdownRef.value && !fontDropdownRef.value.contains(e.target as Node)) {
    showFontDropdown.value = false;
  }
}

onMounted(async () => {
  try {
    const fonts = await window.api.invoke('get-system-fonts');
    if (Array.isArray(fonts) && fonts.length > 0) {
      systemFontOptions.value = fonts;
    }
  } catch {
    // 保留默认列表
  }
  document.addEventListener('click', handleClickOutside);
});

const playerStyles = computed(() => {
  return getAllStyles()
    .filter((s) => {
      if (s.key === 'default') return true;
      if (s.key === 'stage') return isFeatureEnabled('stage-style');
      if (s.key === 'magazine') return isFeatureEnabled('magazine-style');
      if (s.key === 'frenzy') return isFeatureEnabled('frenzy-style');
      return false;
    })
    .map((s) => ({ key: s.key, label: s.label }));
});

// 样式设置视图：null=主视图，其他=样式设置
const styleSettingsView = ref<string | null>(null);

const styleSettingsTitle = computed(() => {
  const style = getStyle(styleSettingsView.value || 'default');
  return style ? `${style.label}样式设置` : '样式设置';
});

const openStyleSettings = (styleKey: string) => {
  styleSettingsView.value = styleKey;
};

// 当前选中模式的设置项
const currentStyleSettings = computed(() => {
  const style = getStyle(styleSettingsView.value || 'default');
  return style?.settings || [];
});

const gradientDirectionOptions = computed(() => [
  { label: t('settings.lyricSettings.background.directionOptions.toBottom'), value: 'to bottom' },
  { label: t('settings.lyricSettings.background.directionOptions.toTop'), value: 'to top' },
  { label: t('settings.lyricSettings.background.directionOptions.toRight'), value: 'to right' },
  { label: t('settings.lyricSettings.background.directionOptions.toLeft'), value: 'to left' },
  {
    label: t('settings.lyricSettings.background.directionOptions.toBottomRight'),
    value: 'to bottom right'
  },
  { label: t('settings.lyricSettings.background.directionOptions.angle45'), value: '45deg' }
]);

const addGradientColor = () => {
  if (config.value.gradientColors.colors.length < 5) {
    config.value.gradientColors.colors.push('#666666');
  }
};

const removeGradientColor = (index: number) => {
  if (config.value.gradientColors.colors.length > 2) {
    config.value.gradientColors.colors.splice(index, 1);
  }
};

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    message?.error(t('settings.lyricSettings.background.invalidImageFormat'));
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    message?.error(t('settings.lyricSettings.background.imageTooLarge'));
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    config.value.backgroundImage = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const clearBackgroundImage = () => {
  config.value.backgroundImage = undefined;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

watch(
  () => config.value,
  (newConfig) => {
    localStorage.setItem('music-full-config', JSON.stringify(newConfig));
    updateCSSVariables(newConfig);
    // 通知 MusicFullWrapper 配置已更新
    window.dispatchEvent(new Event('music-full-config-updated'));
  },
  { deep: true }
);

watch(
  () => config.value.theme,
  (newTheme) => {
    emit('themeChange', newTheme);
  }
);

const updateCSSVariables = (config: LyricConfig) => {
  document.documentElement.style.setProperty('--lyric-font-size', `${config.fontSize}px`);
  document.documentElement.style.setProperty('--lyric-letter-spacing', `${config.letterSpacing}px`);
  document.documentElement.style.setProperty(
    '--lyric-font-weight',
    config.fontWeight?.toString() || '400'
  );
  document.documentElement.style.setProperty('--lyric-line-height', config.lineHeight.toString());
};

onMounted(() => {
  const savedConfig = localStorage.getItem('music-full-config');
  if (savedConfig) {
    config.value = { ...config.value, ...JSON.parse(savedConfig) };
    updateCSSVariables(config.value);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

defineExpose({
  config
});
</script>

<style scoped>
/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* 切换开关 */
.toggle-switch {
  appearance: none;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  left: 2px;
  top: 2px;
  transition: all 0.3s;
}

.toggle-switch:checked {
  background: var(--accent);
}

.toggle-switch:checked::before {
  left: 22px;
}

/* 样式选择卡片 */
.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.style-card {
  position: relative;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.style-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}
.style-card:active {
  transform: translateY(0) scale(0.98);
}
.style-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.15);
}

.style-card-preview {
  width: 100%;
  height: 72px;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

/* 默认样式预览：左侧封面 + 右侧歌词，暖橙渐变背景 */
.preview-default {
  background: linear-gradient(135deg, #c9804a 0%, #a06830 50%, #7a4a20 100%);
  position: relative;
  overflow: hidden;
}
.preview-default::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.preview-default::after {
  content: 'ZephyrusPlayer';
  position: absolute;
  right: 8px;
  top: 30%;
  font-size: 7px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.05em;
}

/* 经典样式预览：深色背景 + 暖光 */
.preview-classic {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;
}
.preview-classic::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, rgba(200, 160, 120, 0.2) 0%, transparent 60%);
}
.preview-classic::after {
  content: 'ZephyrusPlayer';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

/* 舞台样式预览：深色渐变 + 温暖光效 */
.preview-stage {
  background: linear-gradient(135deg, #1a1a1a 0%, #8a6030 50%, #c08040 100%);
  position: relative;
  overflow: hidden;
}
.preview-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, rgba(255, 200, 100, 0.3) 0%, transparent 50%);
}
.preview-stage::after {
  content: 'ZephyrusPlayer';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

/* 杂志样式预览：白色背景 + 色块 + 分散文字 */
.preview-magazine {
  background: #fff;
  position: relative;
  overflow: hidden;
}
.preview-magazine::before {
  content: 'Zephyrus';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-size: 8px;
  font-weight: 800;
  color: var(--accent);
}
.preview-magazine::after {
  content: 'Player';
  position: absolute;
  left: 30%;
  top: 35%;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
}

/* 狂躁样式预览：白色背景 + 黑色文字 + 红色强调 */
.preview-frenzy {
  background: #ffffff;
  position: relative;
  overflow: hidden;
}
.preview-frenzy::before {
  content: '一走了之';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 900;
  color: #1a1a1a;
}
.preview-frenzy::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 42%;
  width: 18px;
  height: 11px;
  background: #cc0000;
  transform: translate(-50%, -50%) skewX(-8deg);
  opacity: 0.9;
}

.style-card-name {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

/* 样式设置按钮 (Button-in-Button) */
.style-settings-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 2;
}
.style-card:hover .style-settings-btn {
  opacity: 1;
}
.style-settings-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.08);
}
.style-settings-btn:active {
  transform: scale(0.95);
}
.style-settings-btn svg {
  width: 12px;
  height: 12px;
  fill: #666;
}

/* 滑块 */
.slider-group {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.slider-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.8;
  margin-bottom: 8px;
}

.slider-emerald {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  outline: none;
  appearance: none;
  background: linear-gradient(
    to right,
    var(--accent) 0%,
    var(--accent) var(--val-pct, 50%),
    rgba(255, 255, 255, 0.1) var(--val-pct, 50%),
    rgba(255, 255, 255, 0.1) 100%
  );
}

.slider-emerald::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(var(--accent-rgb), 0.4);
}

.slider-emerald::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(var(--accent-rgb), 0.4);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.5;
}

/* 单选框组 */
.radio-group {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.radio-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.7;
  margin-bottom: 12px;
}

.radio-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.radio-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* 紧凑版单选项（用于横向布局） */
.radio-item-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.radio-item-compact:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.radio-input {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--text-color-primary);
  opacity: 0.4;
  border-radius: 50%;
  margin-right: 12px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.radio-input:checked {
  border-color: var(--accent);
  opacity: 1;
}

.radio-input:checked::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  left: 2px;
  top: 2px;
}

/* 颜色选择器 */
.color-picker-group {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.color-picker-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.7;
  margin-bottom: 12px;
}

.color-picker {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

/* 小尺寸颜色选择器（用于渐变） */
.color-picker-small {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
}

.color-picker-small::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-small::-webkit-color-swatch {
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

/* 下拉选择 */
.select-group {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.select-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.7;
  margin-bottom: 12px;
}

.select-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.select-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

/* 自定义字体下拉 */
.font-dropdown {
  position: relative;
}

.font-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.font-dropdown__trigger:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.font-dropdown__trigger i {
  transition: transform 0.2s;
  color: rgba(255, 255, 255, 0.5);
}

.font-dropdown__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 280px;
  overflow-y: auto;
  background: #1a1a1e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: 100;
  padding: 4px;
}

.font-dropdown__item {
  padding: 8px 12px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.font-dropdown__item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.font-dropdown__item.active {
  background: rgba(var(--accent-rgb), 0.2);
  color: var(--accent);
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 滚动条 */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
