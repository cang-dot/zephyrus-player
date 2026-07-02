import { computed } from 'vue';

import { useStyleEngineStore } from '@/store/modules/styleEngine';
import { usePlayerStore } from '@/store/modules/player';
import { useClimaxStore } from '@/store/modules/climax';
import { useCoverColor } from '@/hooks/useCoverColor';
import { nowTime, lrcArray, lrcTimeArray, nowIndex } from '@/hooks/MusicHook';
import type { KeywordWord } from '@/api/keywords';
import type { ILyricText } from '@/types/music';

// ==================== 自定义函数 ====================

export function useStyleContext() {
  const styleEngine = useStyleEngineStore();
  const playerStore = usePlayerStore();
  const climaxStore = useClimaxStore();
  const { primaryColor, averageColor } = useCoverColor();

  // ── 歌词 ──

  /** 获取当前行歌词文本 */
  function getCurrentLyric(): string {
    const idx = nowIndex.value;
    if (idx >= 0 && idx < lrcArray.value.length) {
      return lrcArray.value[idx].text || '';
    }
    return '';
  }

  /** 获取完整歌词列表（带时间轴） */
  function getLyricsWithTimeline(): ILyricText[] {
    return lrcArray.value;
  }

  // ── 歌曲信息 ──

  /** 获取歌曲封面 URL */
  function getSongCover(): string {
    const song = playerStore.currentSong;
    return song?.picUrl || '';
  }

  /** 获取歌曲信息 */
  function getSongInfo(): { name: string; artist: string; album: string; duration: number } {
    const song = playerStore.currentSong;
    const artists = song?.ar || song?.artists || [];
    return {
      name: song?.name || '',
      artist: artists.map((a: any) => a.name).join(' / '),
      album: song?.al?.name || song?.album?.name || '',
      duration: (song?.dt || song?.duration || 0) / 1000
    };
  }

  // ── 视觉 ──

  /** 获取封面主色 */
  function getCoverColor(): { primary: string; average: string } {
    return {
      primary: primaryColor.value,
      average: averageColor.value
    };
  }

  /** 获取高潮状态 */
  function getClimaxState(): {
    isInClimax: boolean;
    segments: { start: number; end: number }[];
    energy: number;
    isBeat: boolean;
    kickEnergy: number;
    bpm: number;
  } {
    return {
      isInClimax: styleEngine.isInClimax,
      segments: climaxStore.segments,
      energy: styleEngine.energyLevel,
      isBeat: styleEngine.isBeat,
      kickEnergy: styleEngine.kickEnergy,
      bpm: styleEngine.bpm
    };
  }

  // ── 重点词 ──

  /** 获取当前行的强调词 */
  function getCurrentLineKeywords(): KeywordWord[] {
    return styleEngine.currentLineKeywords;
  }

  return {
    // 歌词
    getCurrentLyric,
    getLyricsWithTimeline,
    // 歌曲信息
    getSongCover,
    getSongInfo,
    // 视觉
    getCoverColor,
    getClimaxState,
    // 重点词
    getCurrentLineKeywords,
    // 直接访问响应式状态
    nowTime,
    nowIndex,
    lrcArray
  };
}
