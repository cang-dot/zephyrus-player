/**
 * 社区数据 Store (CommunityData)
 *
 * 管理高潮段落、重点词、社区歌词的加载和缓存
 * 数据流: IndexedDB 缓存 → API 请求 → 缓存
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { loadClimaxForSong, type ClimaxSegment } from '@/api/climax';
import { loadKeywordsForSong, type KeywordMark } from '@/api/keywords';
import { loadCommunityLyricForSong, type CommunityLyric } from '@/api/communityLyric';
import {
  getClimaxCache,
  saveClimaxCache,
  getKeywordsCache,
  saveKeywordsCache,
  getCommunityLyricCache,
  saveCommunityLyricCache
} from '@/services/cacheService';

export const useCommunityDataStore = defineStore('communityData', () => {
  // ==================== State ====================
  const currentSongId = ref<string>('');

  // Climax
  const climaxSegments = ref<ClimaxSegment[]>([]);
  const climaxContributor = ref<string | null>(null);

  // Keywords
  const keywordMark = ref<KeywordMark | null>(null);

  // Community Lyric
  const communityLyric = ref<CommunityLyric | null>(null);

  // Loading states
  const loadingClimax = ref(false);
  const loadingKeywords = ref(false);
  const loadingLyric = ref(false);

  // ==================== Actions ====================

  /**
   * 加载歌曲的社区数据（缓存优先）
   * 流程: 高潮段落 → 重点词 → 社区歌词
   * 每一步只有在前置数据存在时才继续
   */
  async function loadAll(songId: string) {
    console.log('[CommunityData] loadAll called, songId:', songId, 'currentSongId:', currentSongId.value);
    if (!songId || songId === currentSongId.value) {
      console.log('[CommunityData] loadAll skipped (same song or empty)');
      return;
    }

    currentSongId.value = songId;
    climaxSegments.value = [];
    climaxContributor.value = null;
    keywordMark.value = null;
    communityLyric.value = null;

    console.log('[CommunityData] Step 1: loading climax...');
    await loadClimax(songId);
    console.log('[CommunityData] Climax loaded, segments:', climaxSegments.value.length);

    if (climaxSegments.value.length > 0) {
      console.log('[CommunityData] Step 2: loading keywords...');
      await loadKeywords(songId);
      console.log('[CommunityData] Keywords loaded:', keywordMark.value !== null);
    } else {
      console.log('[CommunityData] Step 2: skipped (no climax)');
    }

    console.log('[CommunityData] Step 3: loading community lyric...');
    await loadCommunityLyric(songId);
    console.log('[CommunityData] Community lyric loaded:', communityLyric.value !== null);
  }

  /**
   * 加载高潮段落（缓存优先）
   * 缓存包含空数组，避免重复请求不存在的数据
   */
  async function loadClimax(songId: string) {
    loadingClimax.value = true;
    try {
      const cached = await getClimaxCache(songId);
      console.log('[CommunityData] loadClimax cache:', cached != null ? 'hit' : 'miss');
      if (cached != null) {
        climaxSegments.value = cached.segments;
        climaxContributor.value = cached.contributor;
        return;
      }

      console.log('[CommunityData] loadClimax fetching API...');
      const result = await loadClimaxForSong(songId);
      console.log('[CommunityData] loadClimax API result:', result.segments?.length, 'segments');
      climaxSegments.value = result.segments || [];
      climaxContributor.value = result.contributor || null;

      await saveClimaxCache(songId, {
        segments: result.segments,
        contributor: result.contributor
      });
    } catch (err) {
      console.error('[CommunityData] loadClimax error:', err);
      climaxSegments.value = [];
      climaxContributor.value = null;
    } finally {
      loadingClimax.value = false;
    }
  }

  /**
   * 加载重点词（缓存优先）
   * 不缓存 null 值，允许后续上传后重新获取
   */
  async function loadKeywords(songId: string) {
    loadingKeywords.value = true;
    try {
      const cached = await getKeywordsCache(songId);
      console.log('[CommunityData] loadKeywords cache:', cached != null ? 'hit' : 'miss', 'data:', cached);
      if (cached != null) {
        keywordMark.value = cached;
        return;
      }

      console.log('[CommunityData] loadKeywords fetching API...');
      const result = await loadKeywordsForSong(songId);
      console.log('[CommunityData] loadKeywords API result:', result);
      keywordMark.value = result;

      // 只缓存有数据的结果，不缓存 null
      if (result) {
        await saveKeywordsCache(songId, result);
      }
    } catch (err) {
      console.error('[CommunityData] loadKeywords error:', err);
      keywordMark.value = null;
    } finally {
      loadingKeywords.value = false;
    }
  }

  /**
   * 加载社区歌词（缓存优先）
   * 不缓存 null 值，允许后续上传后重新获取
   */
  async function loadCommunityLyric(songId: string) {
    loadingLyric.value = true;
    try {
      const cached = await getCommunityLyricCache(songId);
      if (cached != null) {
        communityLyric.value = cached;
        return;
      }

      const result = await loadCommunityLyricForSong(songId);
      communityLyric.value = result;

      // 只缓存有数据的结果，不缓存 null
      if (result) {
        await saveCommunityLyricCache(songId, result);
      }
    } catch (err) {
      console.error('[CommunityData] 加载社区歌词失败:', err);
      communityLyric.value = null;
    } finally {
      loadingLyric.value = false;
    }
  }

  /**
   * 清空数据（切歌时调用）
   */
  function clear() {
    currentSongId.value = '';
    climaxSegments.value = [];
    climaxContributor.value = null;
    keywordMark.value = null;
    communityLyric.value = null;
  }

  /**
   * 获取指定行的重点词
   */
  function getKeywordsForLine(lineIndex: number) {
    if (!keywordMark.value) return [];
    const line = keywordMark.value.lines.find(l => l.lineIndex === lineIndex);
    return line?.words ?? [];
  }

  // ==================== Computed ====================
  const hasClimax = computed(() => climaxSegments.value.length > 0);
  const hasKeywords = computed(() => keywordMark.value !== null && keywordMark.value.lines.length > 0);
  const hasCommunityLyric = computed(() => communityLyric.value !== null);

  return {
    currentSongId,
    climaxSegments,
    climaxContributor,
    keywordMark,
    communityLyric,
    loadingClimax,
    loadingKeywords,
    loadingLyric,
    hasClimax,
    hasKeywords,
    hasCommunityLyric,
    loadAll,
    loadClimax,
    loadKeywords,
    loadCommunityLyric,
    clear,
    getKeywordsForLine
  };
});
