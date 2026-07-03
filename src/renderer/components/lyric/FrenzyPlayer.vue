<template>
  <div v-if="isVisible" class="frenzy-player" ref="playerRef" :style="{ background: backgroundColor }">
    <!-- 通用控件（左上关闭 + 右上设置/全屏） -->
    <PlayerControls
      :isFullScreen="isFullScreen"
      :showStyleSwitch="false"
      theme="dark"
      @close="closePlayer"
      @toggleFullscreen="toggleFullScreen"
    />

    <!-- 背景层：白色故障效果 -->
    <GlitchBackground
      baseColor="#ffffff"
      accentColor="#d0d0d0"
      :intensity="glitchIntensity"
      :speed="0.8"
      :showScanlines="config.frenzyShowScanlines !== false"
    />

    <!-- 歌词层 -->
    <div class="frenzy-player__lyrics">
      <FrenzyLyrics
        :lyrics="lyrics"
        :currentTime="currentTime"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * FrenzyPlayer - 狂躁模式主组件（初稿设计）
 *
 * 白色背景 + 轻微故障效果 + 黑色可拉伸文字 + 红色正常文字 + 无 GSAP 动效
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import GlitchBackground from './GlitchBackground.vue';
import FrenzyLyrics from './FrenzyLyrics.vue';
import PlayerControls from './PlayerControls.vue';
import { useStyleEngineStore } from '@/store/modules/styleEngine';
import { useCommunityDataStore } from '@/store/modules/communityData';
import { DEFAULT_LYRIC_CONFIG, type LyricConfig } from '@/types/lyric';
import { drumDetector } from '@/services/drumDetector';
import { usePlayerStore } from '@/store/modules/player';
import { setCurrentSongId } from '@/utils/emotionalDetector';
import { useStyleContext } from '@/playerStyles/useStyleContext';

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const isVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

function closePlayer() {
  isVisible.value = false;
}

// 全屏控制
const isFullScreen = ref(false);

async function toggleFullScreen() {
  try {
    if (!document.fullscreenElement) {
      await playerRef.value?.requestFullscreen();
      isFullScreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullScreen.value = false;
    }
  } catch (e) {
    console.error('全屏切换失败:', e);
  }
}

function handleFullScreenChange() {
  isFullScreen.value = !!document.fullscreenElement;
}

const styleEngine = useStyleEngineStore();
const communityData = useCommunityDataStore();
const playerStore = usePlayerStore();
const { nowTime } = useStyleContext();

const playerRef = ref<HTMLElement | null>(null);
const config = ref<LyricConfig>({ ...DEFAULT_LYRIC_CONFIG });

// 从 localStorage 读取配置
function loadConfig() {
  const saved = localStorage.getItem('music-full-config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      config.value = { ...DEFAULT_LYRIC_CONFIG, ...parsed };
    } catch {
      config.value = { ...DEFAULT_LYRIC_CONFIG };
    }
  }
}

loadConfig();

// 监听配置变化
function handleConfigUpdate() {
  loadConfig();
}

// 同步当前歌曲 ID 到情感词检测器，并加载副歌数据
watch(() => playerStore.currentSong?.id, (songId) => {
  console.log('[FrenzyPlayer] watch songId:', songId);
  if (songId) {
    setCurrentSongId(String(songId));
    styleEngine.loadClimaxData(String(songId));
  }
}, { immediate: true });

onMounted(() => {
  window.addEventListener('music-full-config-updated', handleConfigUpdate);
  document.addEventListener('fullscreenchange', handleFullScreenChange);

  styleEngine.syncFromPlayerStore();
  styleEngine.syncCoverColors();

  if (playerStore.currentSong?.id) {
    console.log('[FrenzyPlayer] onMounted loading songId:', playerStore.currentSong.id);
    styleEngine.loadClimaxData(String(playerStore.currentSong.id));
  }
});

onUnmounted(() => {
  window.removeEventListener('music-full-config-updated', handleConfigUpdate);
  document.removeEventListener('fullscreenchange', handleFullScreenChange);
  if (document.fullscreenElement) document.exitFullscreen();
  communityData.clear();
  console.log('[FrenzyPlayer] onUnmounted, communityData cleared');
});

// 背景颜色（级联：白色背景 → 跟随封面背景 → 自定义）
const backgroundColor = computed(() => {
  if (config.value.frenzyUseWhiteBackground !== false) return '#ffffff';
  if (config.value.frenzyUseCoverBackground !== false) return styleEngine.primaryColor;
  return config.value.frenzyBackgroundCustomColor;
});

// 歌词数据
const lyrics = computed(() => {
  const song = playerStore.currentSong;
  if (!song?.lyric?.lrcArray) return [];
  return song.lyric.lrcArray;
});

// 当前播放时间
const currentTime = computed(() => nowTime.value);

// 故障强度（根据能量级别、高潮状态和鼓点动态调整）
const beatSpike = ref(0);
let spikeTimer: ReturnType<typeof setTimeout> | null = null;
const SPIKE_DURATION = 120; // 鼓点峰值持续 120ms

// 订阅鼓点检测
onMounted(() => {
  const unsubscribe = drumDetector.onBeat((info) => {
    // 强拍峰值更大，kickEnergy 调制强度
    const spikeAmount = info.isStrong ? 0.45 : 0.25;
    beatSpike.value = spikeAmount * (0.6 + info.kickEnergy * 0.4);

    if (spikeTimer) clearTimeout(spikeTimer);
    spikeTimer = setTimeout(() => {
      beatSpike.value = 0;
    }, SPIKE_DURATION);
  });

  onUnmounted(() => {
    unsubscribe();
    if (spikeTimer) clearTimeout(spikeTimer);
  });
});

const glitchIntensity = computed(() => {
  const baseIntensity = config.value.frenzyGlitchIntensity;
  const energyBoost = styleEngine.energyLevel * 0.15;
  const climaxBoost = styleEngine.isInClimax ? 0.3 : 0;
  const base = Math.min(1.0, baseIntensity + energyBoost + climaxBoost);

  // 高潮时鼓点失真峰值明显，非高潮时微弱
  const spike = styleEngine.isInClimax
    ? beatSpike.value
    : beatSpike.value * 0.3;

  return Math.min(1.0, base + spike);
});
</script>

<style scoped>
.frenzy-player {
  position: fixed;
  inset: 0;
  z-index: 9998;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.frenzy-player__lyrics {
  color: #1a1a1a;
  font-size: 24px;
}

.frenzy-player__settings-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

.frenzy-player__lyrics {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}
</style>
