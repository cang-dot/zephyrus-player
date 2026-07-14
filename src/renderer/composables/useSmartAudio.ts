/**
 * useSmartAudio — 智能混音引擎 composable
 *
 * 整合层：协调 audioService、scheduler、crossfade、bpm worker
 * 不创建新的 AudioContext，复用 Howler.ctx
 *
 * 三级递进过渡策略：
 *   Level 1 — 等功率淡入淡出（余弦曲线）
 *   Level 2 — BPM 节拍对齐（Web Worker 离线 BPM + 乐句边界对齐）
 *   Level 3 — 时频域智能拼接（三频段独立淡出曲线）
 */

import { Howler } from 'howler';
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';

import { audioService } from '@/services/audioService';
import { useMixEngineStore, type BpmCacheEntry } from '@/store/modules/mixEngine';
import { isElectron } from '@/utils';

import { applyBandSplitCrossfade, createBandSplitChain, destroyBandSplitChain, type BandSplitChain } from '@/utils/audio/bandSplitter';
import { calculateBeatAlignedTransition, calculatePreloadTime } from '@/utils/audio/beatAlign';
import { applyEqualPowerCrossfade } from '@/utils/audio/crossfade';
import { AudioScheduler } from '@/utils/audio/scheduler';

export interface CrossfadeResult {
  level: 1 | 2 | 3;
  startTime: number;
  duration: number;
  reason: string;
}

export function useSmartAudio() {
  const mixEngine = useMixEngineStore();

  // ==================== 内部状态 ====================
  const ctx = computed<AudioContext | null>(() => audioService.getAudioContext());
  const scheduler = shallowRef<AudioScheduler | null>(null);

  // 双缓冲 gain 节点（用于 crossfade）
  const gainA = shallowRef<GainNode | null>(null);
  const gainB = shallowRef<GainNode | null>(null);
  const activeSlot = ref<'A' | 'B'>('A');

  // Level 3 频段分裂链（过渡期间临时创建）
  const chainOut = shallowRef<BandSplitChain | null>(null);
  const chainIn = shallowRef<BandSplitChain | null>(null);

  // BPM Worker
  const bpmWorker = shallowRef<Worker | null>(null);

  // 是否正在过渡
  const isTransitioning = computed(() => mixEngine.isTransitioning);

  // ==================== 初始化 ====================

  function init() {
    const audioCtx = ctx.value || (Howler.ctx as AudioContext);
    if (!audioCtx) return;

    // 创建双缓冲 gain 节点
    gainA.value = audioCtx.createGain();
    gainB.value = audioCtx.createGain();

    // 创建调度器
    scheduler.value = new AudioScheduler(audioCtx);
    scheduler.value.start();

    // 初始化 BPM Worker
    if (mixEngine.bpmPreAnalysis) {
      initBpmWorker();
    }

    // 硬件评估
    mixEngine.evaluateAndRecommend();
  }

  // ==================== BPM Worker ====================

  function initBpmWorker() {
    if (bpmWorker.value) return;
    try {
      const worker = new Worker(
        new URL('@/workers/bpmAnalyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );
      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'result') {
          const { bpm, confidence, beatOffset } = e.data;
          // 缓存 BPM（需要外部设置 trackId）
          if (currentTrackId.value) {
            mixEngine.cacheBpm(currentTrackId.value, { bpm, confidence, beatOffset });
          }
        }
      };
      bpmWorker.value = worker;
    } catch (e) {
      console.warn('[useSmartAudio] BPM Worker 初始化失败:', e);
    }
  }

  const currentTrackId = ref<string | null>(null);

  /**
   * 预加载并分析下一首歌的 BPM
   */
  async function preloadAndAnalyzeBpm(trackId: string, url: string) {
    currentTrackId.value = trackId;

    // 如果已缓存，跳过
    const cached = mixEngine.getCachedBpm(trackId);
    if (cached) return cached;

    if (!bpmWorker.value) return null;

    try {
      let arrayBuffer: ArrayBuffer;
      if (isElectron && url.startsWith('local://')) {
        const filePath = url.replace(/^local:\/{2,3}/, '').replace(/%2F/g, '/');
        const result: unknown = await (window as any).electron.ipcRenderer.invoke(
          'read-file-binary',
          decodeURIComponent(filePath)
        );
        if (!result) return null;
        const uint8 = result as Uint8Array;
        arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
      } else if (!url.startsWith('local://')) {
        const response = await fetch(url);
        if (!response.ok) return null;
        arrayBuffer = await response.arrayBuffer();
      } else {
        return null;
      }

      bpmWorker.value.postMessage({ type: 'analyze', arrayBuffer }, [arrayBuffer]);
    } catch (e) {
      console.warn('[useSmartAudio] BPM 预分析失败:', e);
    }
    return null;
  }

  // ==================== Crossfade ====================

  /**
   * 执行智能过渡
   *
   * @param nextGain 下一首歌的 GainNode（由调用方创建）
   * @param nextUrl 下一首歌 URL（用于 BPM 预分析）
   * @param nextTrackId 下一首歌 ID
   * @param remainingTime 当前歌曲剩余时间（秒）
   * @param currentTime 当前播放时间（秒）
   */
  async function crossfadeTo(
    nextGain: GainNode,
    nextUrl: string,
    nextTrackId: string,
    remainingTime: number,
    currentTime: number
  ): Promise<CrossfadeResult> {
    const audioCtx = ctx.value;
    if (!audioCtx || !gainA.value || !gainB.value) {
      return { level: 1, startTime: 0, duration: 0, reason: '音频上下文未就绪' };
    }

    mixEngine.setTransitioning(true);

    // 确定当前活跃的 gain 和非活跃的 gain
    const currentGain = activeSlot.value === 'A' ? gainA.value : gainB.value;
    const incomingGain = activeSlot.value === 'A' ? gainB.value : gainA.value;

    // 确保 incomingGain 连接到输出
    // （连接由 audioService 处理，这里只控制 gain 值）

    const level = mixEngine.transitionLevel;
    const defaultDuration = mixEngine.crossfadeDuration;
    const startTime = audioCtx.currentTime;

    if (level === 1) {
      // === Level 1: 等功率淡入淡出 ===
      applyEqualPowerCrossfade(audioCtx, currentGain, nextGain, startTime, defaultDuration);
      const result: CrossfadeResult = {
        level: 1,
        startTime,
        duration: defaultDuration,
        reason: `等功率 crossfade ${defaultDuration}s`
      };
      scheduleSlotSwap(defaultDuration);
      return result;
    }

    // Level 2/3: 需要 BPM
    let bpm = 0;
    let beatOffset = 0;

    const cached = mixEngine.getCachedBpm(nextTrackId);
    if (cached) {
      bpm = cached.bpm;
      beatOffset = cached.beatOffset;
    } else {
      // 降级使用实时 BPM
      bpm = audioService.getRealtimeBpm();
    }

    if (level === 2) {
      // === Level 2: BPM 节拍对齐 ===
      const result = calculateBeatAlignedTransition({
        bpm,
        beatOffset,
        currentTime,
        remainingTime,
        ctx: audioCtx,
        gainOut: currentGain,
        gainIn: nextGain,
        defaultDuration
      });
      scheduleSlotSwap(result.duration);
      return result;
    }

    // === Level 3: 时频域智能拼接 ===
    // 在当前 source 和 masterGain 之间插入频段分裂链
    const masterGain = audioService.getMasterGain();
    if (masterGain) {
      // 为当前歌曲创建频段分裂链
      chainOut.value = createBandSplitChain(audioCtx, currentGain);
      // 断开 currentGain → masterGain 的直连
      try { currentGain.disconnect(masterGain); } catch {}
      chainOut.value.output.connect(masterGain);

      // 为下一首歌创建频段分裂链
      chainIn.value = createBandSplitChain(audioCtx, nextGain);
      chainIn.value.output.connect(masterGain);

      applyBandSplitCrossfade(
        audioCtx,
        chainOut.value,
        chainIn.value,
        startTime,
        defaultDuration
      );

      // 过渡结束后拆除频段分裂链
      scheduler.value?.scheduleAt(startTime + defaultDuration + 0.2, () => {
        if (chainOut.value && chainOut.value.output === masterGain) {
          destroyBandSplitChain(currentGain, chainOut.value, masterGain);
        }
        if (chainIn.value) {
          // 保留 incoming 的频段分裂链，但断开并重新连接
          try { chainIn.value.output.disconnect(masterGain); } catch {}
          // 直接连接 nextGain → masterGain
          nextGain.connect(masterGain);
        }
        chainOut.value = null;
        chainIn.value = null;
      }, 'cleanup-band-split');

      const result: CrossfadeResult = {
        level: 3,
        startTime,
        duration: defaultDuration,
        reason: `频域拼接 ${defaultDuration}s（低频晚淡出/中频早淡出/高频中等）`
      };
      scheduleSlotSwap(defaultDuration);
      return result;
    }

    // 降级为 Level 1
    applyEqualPowerCrossfade(audioCtx, currentGain, nextGain, startTime, defaultDuration);
    scheduleSlotSwap(defaultDuration);
    return { level: 1, startTime, duration: defaultDuration, reason: '降级为等功率' };
  }

  /** 调度 slot swap（过渡完成后切换活跃槽位） */
  function scheduleSlotSwap(delay: number) {
    const audioCtx = ctx.value;
    if (!audioCtx || !scheduler.value) return;
    scheduler.value.scheduleAt(
      audioCtx.currentTime + delay + 0.1,
      () => {
        activeSlot.value = activeSlot.value === 'A' ? 'B' : 'A';
        mixEngine.setTransitioning(false);
      },
      'slot-swap'
    );
  }

  // ==================== 频谱数据 ====================

  /**
   * 获取实时频谱数据（复用 drumDetector 的 AnalyserNode）
   */
  function getBandEnergies() {
    return audioService.getBandEnergies();
  }

  /**
   * 获取当前实时 BPM
   */
  function getRealtimeBpm() {
    return audioService.getRealtimeBpm();
  }

  /**
   * 获取缓存的 BPM
   */
  function getCachedBpm(trackId: string): BpmCacheEntry | null {
    return mixEngine.getCachedBpm(trackId);
  }

  // ==================== 生命周期 ====================

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    scheduler.value?.stop();
    bpmWorker.value?.terminate();
    // 清理 gain 节点
    try { gainA.value?.disconnect(); } catch {}
    try { gainB.value?.disconnect(); } catch {}
  });

  return {
    // 状态
    isTransitioning,
    activeSlot,
    // 混音操作
    crossfadeTo,
    preloadAndAnalyzeBpm,
    // 频谱 & BPM
    getBandEnergies,
    getRealtimeBpm,
    getCachedBpm,
  };
}
