import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { SongResult } from '@/types/music';
import type { LyricSettings } from './useLyricSettings';

const windowData = window as any;
const TIME_OFFSET = 400;

export interface LyricLine {
  text: string;
  trText: string;
  words?: Array<{ text: string; startTime: number; duration: number; space?: boolean }>;
  hasWordByWord?: boolean;
  startTime?: number;
  duration?: number;
  index?: number;
}

export function useLyricState(lyricSetting: Ref<LyricSettings>) {
  const containerRef = ref<HTMLElement | null>(null);
  const containerHeight = ref(0);
  const fontSizeStep = 2;
  const animationFrameId = ref<number | null>(null);
  const lastUpdateTime = ref(performance.now());

  const fontSize = ref(24);

  const lineHeight = computed(() => {
    const baseLineHeight = fontSize.value * 2.5;
    const maxAllowedHeight = containerHeight.value / 3;
    return Math.min(maxAllowedHeight, Math.max(40, baseLineHeight));
  });

  const staticData = ref<{
    lrcArray: LyricLine[];
    lrcTimeArray: number[];
    allTime: number;
    playMusic: SongResult;
  }>({
    lrcArray: [],
    lrcTimeArray: [],
    allTime: 0,
    playMusic: {} as SongResult
  });

  const dynamicData = ref({
    nowTime: 0,
    startCurrentTime: 0,
    nextTime: 0,
    isPlay: true
  });

  const currentIndex = ref(0);
  const actualTime = ref(0);

  const hasTranslation = computed(() => staticData.value.lrcArray.some((line) => line.trText));

  const currentGroupIndex = computed(() => Math.floor(currentIndex.value / 2));

  const currentGroupLines = computed(() => {
    const start = currentGroupIndex.value * 2;
    return staticData.value.lrcArray
      .slice(start, start + 2)
      .map((line, i) => ({ ...line, index: start + i }));
  });

  const displayMode = computed(() => lyricSetting.value.displayMode);
  const showTranslation = computed(() => lyricSetting.value.showTranslation);

  const isGroupTransitioning = ref(false);
  let groupFadeTimer: ReturnType<typeof setTimeout> | null = null;

  watch(currentGroupIndex, () => {
    if (displayMode.value !== 'double') return;
    if (groupFadeTimer !== null) clearTimeout(groupFadeTimer);
    isGroupTransitioning.value = true;
    groupFadeTimer = setTimeout(() => {
      isGroupTransitioning.value = false;
      groupFadeTimer = null;
    }, 300);
  });

  const currentProgress = computed(() => {
    const times = staticData.value.lrcTimeArray;
    const idx = currentIndex.value;
    const startTimeMs = times[idx];
    const endTimeMs = times[idx + 1];
    if (startTimeMs === undefined || endTimeMs === undefined || endTimeMs <= startTimeMs) return 0;
    const currentTimeMs = actualTime.value * 1000;
    const elapsed = currentTimeMs - startTimeMs;
    const duration = endTimeMs - startTimeMs;
    return Math.min(Math.max(elapsed / duration, 0), 1);
  });

  const getLyricStyle = (index: number) => {
    if (index !== currentIndex.value) return {};
    const progress = currentProgress.value * 100;
    return {
      background: `linear-gradient(to right, var(--highlight-color) ${progress}%, var(--text-color) ${progress}%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textRendering: 'optimizeLegibility' as const,
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale' as const,
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const,
      transition: 'background 0.1s linear'
    };
  };

  const getWordStyle = (
    lineIndex: number,
    _wordIndex: number,
    word: { text: string; startTime: number; duration: number }
  ) => {
    if (lineIndex !== currentIndex.value) {
      return {
        color: 'var(--text-color)',
        transition: 'color 0.3s ease',
        backgroundImage: 'none',
        WebkitTextFillColor: 'initial'
      };
    }
    const currentTime = actualTime.value * 1000;
    const wordStartTime = word.startTime;
    const wordEndTime = word.startTime + word.duration;
    if (currentTime >= wordStartTime && currentTime < wordEndTime) {
      const progress = Math.min((currentTime - wordStartTime) / word.duration, 1);
      const progressPercent = Math.round(progress * 100);
      return {
        backgroundImage: `linear-gradient(to right, var(--highlight-color) 0%, var(--highlight-color) ${progressPercent}%, var(--text-color) ${progressPercent}%, var(--text-color) 100%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        transition: 'all 0.1s ease'
      };
    } else if (currentTime >= wordEndTime) {
      return {
        color: 'var(--highlight-color)',
        WebkitTextFillColor: 'initial',
        transition: 'none'
      };
    } else {
      return {
        color: 'var(--text-color)',
        WebkitTextFillColor: 'initial',
        transition: 'none'
      };
    }
  };

  const getDynamicLineStyle = (line: LyricLine, withTranslation = true) => {
    const defaultHeight = lineHeight.value;
    if (withTranslation && line.trText) {
      const extraHeight = Math.round(fontSize.value * 0.6 * 1.4);
      return { height: `${defaultHeight + extraHeight}px` };
    }
    return { height: `${defaultHeight}px` };
  };

  const wrapperStyle = computed(() => {
    if (displayMode.value !== 'scroll') return {};
    if (!containerHeight.value) {
      return { transform: 'translateY(0)', transition: 'none' };
    }
    const containerCenter = containerHeight.value / 2;
    const getLineHeight = (line: LyricLine) => {
      const baseHeight = lineHeight.value;
      if (showTranslation.value && line.trText) {
        const extraHeight = Math.round(fontSize.value * 0.6 * 1.4);
        return baseHeight + extraHeight;
      }
      return baseHeight;
    };
    let accumulatedHeight = containerHeight.value * 0.2;
    for (let i = 0; i < currentIndex.value; i++) {
      if (i < staticData.value.lrcArray.length) {
        accumulatedHeight += getLineHeight(staticData.value.lrcArray[i]);
      } else {
        accumulatedHeight += lineHeight.value;
      }
    }
    const currentLineHeight =
      currentIndex.value < staticData.value.lrcArray.length
        ? getLineHeight(staticData.value.lrcArray[currentIndex.value])
        : lineHeight.value;
    accumulatedHeight += currentLineHeight;
    const targetOffset = containerCenter - accumulatedHeight;
    let contentHeight = containerHeight.value * 0.4;
    for (const line of staticData.value.lrcArray) {
      contentHeight += getLineHeight(line);
    }
    const minOffset = -(contentHeight - containerHeight.value);
    const maxOffset = 0;
    const finalOffset = Math.min(maxOffset, Math.max(minOffset, targetOffset));
    return {
      transform: `translateY(${finalOffset}px)`,
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  });

  const updateContainerHeight = () => {
    if (!containerRef.value) return;
    containerHeight.value = containerRef.value.clientHeight;
  };

  const saveFontSize = () => {
    localStorage.setItem('lyricFontSize', fontSize.value.toString());
  };

  const updateProgress = () => {
    if (!dynamicData.value.isPlay) {
      if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value);
        animationFrameId.value = null;
      }
      return;
    }
    const timeDiff = (performance.now() - lastUpdateTime.value) / 1000;
    actualTime.value = dynamicData.value.nowTime + timeDiff + TIME_OFFSET / 1000;
    animationFrameId.value = requestAnimationFrame(updateProgress);
  };

  const handleDataUpdate = (parsedData: {
    type?: string;
    nowTime: number;
    startCurrentTime: number;
    nextTime: number;
    isPlay: boolean;
    nowIndex: number;
    lrcArray?: Array<{ text: string; trText: string }>;
    lrcTimeArray?: number[];
    allTime?: number;
    playMusic?: SongResult;
  }) => {
    if (!parsedData) {
      console.error('Invalid update data received:', parsedData);
      return;
    }
    if (parsedData.type === 'update') {
      dynamicData.value = {
        ...dynamicData.value,
        nowTime: parsedData.nowTime || dynamicData.value.nowTime,
        isPlay: typeof parsedData.isPlay === 'boolean' ? parsedData.isPlay : dynamicData.value.isPlay
      };
      if (typeof parsedData.nowIndex === 'number') {
        currentIndex.value = parsedData.nowIndex;
      }
      return;
    }
    staticData.value = {
      lrcArray: parsedData.lrcArray || [],
      lrcTimeArray: parsedData.lrcTimeArray || [],
      allTime: parsedData.allTime || 0,
      playMusic: parsedData.playMusic || ({} as SongResult)
    };
    dynamicData.value = {
      nowTime: parsedData.nowTime || 0,
      startCurrentTime: parsedData.startCurrentTime || 0,
      nextTime: parsedData.nextTime || 0,
      isPlay: parsedData.isPlay
    };
    if (typeof parsedData.nowIndex === 'number') {
      currentIndex.value = parsedData.nowIndex;
    }
  };

  watch(
    () => dynamicData.value,
    (newData: any) => {
      lastUpdateTime.value = performance.now();
      actualTime.value = newData.nowTime + TIME_OFFSET / 1000;
      if (newData.isPlay && !animationFrameId.value) {
        updateProgress();
      }
    },
    { deep: true }
  );

  watch(
    () => dynamicData.value.isPlay,
    (isPlaying: boolean) => {
      if (isPlaying) {
        lastUpdateTime.value = performance.now();
        updateProgress();
      } else if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value);
        animationFrameId.value = null;
      }
    }
  );

  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    const savedFontSize = localStorage.getItem('lyricFontSize');
    if (savedFontSize) {
      fontSize.value = Number(savedFontSize);
    }

    updateContainerHeight();

    resizeObserver = new ResizeObserver(() => {
      updateContainerHeight();
    });
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value);
    }

    windowData.electron.ipcRenderer.on('receive-lyric', (_: any, data: string) => {
      try {
        const parsedData = JSON.parse(data);
        handleDataUpdate(parsedData);
      } catch (error) {
        console.error('Error parsing lyric data:', error);
      }
    });

    windowData.electron.ipcRenderer.send('lyric-ready');
  });

  onUnmounted(() => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (groupFadeTimer !== null) {
      clearTimeout(groupFadeTimer);
    }
  });

  const increaseFontSize = () => {
    if (fontSize.value < 48) {
      fontSize.value += fontSizeStep;
      saveFontSize();
      updateContainerHeight();
    }
  };

  const decreaseFontSize = () => {
    if (fontSize.value > 12) {
      fontSize.value -= fontSizeStep;
      saveFontSize();
      updateContainerHeight();
    }
  };

  return {
    staticData,
    dynamicData,
    currentIndex,
    fontSize,
    lineHeight,
    containerRef,
    containerHeight,
    handleDataUpdate,
    updateContainerHeight,
    hasTranslation,
    currentGroupLines,
    currentGroupIndex,
    isGroupTransitioning,
    displayMode,
    showTranslation,
    wrapperStyle,
    getDynamicLineStyle,
    getLyricStyle,
    getWordStyle,
    currentProgress,
    actualTime,
    increaseFontSize,
    decreaseFontSize
  };
}
