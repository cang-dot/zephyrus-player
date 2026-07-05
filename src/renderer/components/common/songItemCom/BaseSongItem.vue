<template>
  <div
    class="song-item"
    @contextmenu.prevent="handleContextMenu"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dblclick.stop="playMusicEvent(item)"
  >
    <slot name="index"></slot>
    <slot name="select" v-if="selectable"></slot>
    <slot name="image"></slot>
    <slot name="content"></slot>
    <slot name="operating"></slot>

    <song-item-dropdown
      v-if="isElectron"
      :item="item"
      :show="showDropdown"
      :x="dropdownX"
      :y="dropdownY"
      :is-favorite="isFavorite"
      :is-dislike="isDislike"
      :can-remove="canRemove"
      @update:show="showDropdown = $event"
      @play="playMusicEvent(item)"
      @play-next="handlePlayNext"
      @download="downloadMusic(item)"
      @download-lyric="downloadLyric(item)"
      @bind-local-lyric="bindLocalLyric"
      @toggle-favorite="toggleFavorite"
      @toggle-dislike="toggleDislike"
      @remove="$emit('remove-song', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
import { useSongItem } from '@/hooks/useSongItem';
import { usePlayerStore } from '@/store/modules/player';
import type { SongResult } from '@/types/music';
import { isElectron } from '@/utils';
import { readLocalLyricFile, selectLyricFile, setLocalLyricPath } from '@/utils/localLyricStorage';
import { parseTtml } from '@/utils/ttmlParser';
import { parseLyrics } from '@/utils/yrcParser';

import SongItemDropdown from './SongItemDropdown.vue';

const props = defineProps<{
  item: SongResult;
  selectable?: boolean;
  selected?: boolean;
  canRemove?: boolean;
  isNext?: boolean;
  index?: number;
}>();

const emits = defineEmits(['play', 'select', 'remove-song', 'bind-local-lyric']);

const playerStore = usePlayerStore();

// 使用公共逻辑
const {
  playLoading,
  isPlaying,
  isFavorite,
  isDislike,
  artists,
  showDropdown,
  dropdownX,
  dropdownY,
  isHovering,
  handleImageLoad,
  playMusicEvent,
  toggleFavorite,
  toggleDislike,
  handlePlayNext,
  handleContextMenu,
  handleMenuClick,
  handleArtistClick,
  handleMouseEnter,
  handleMouseLeave,
  downloadMusic,
  downloadLyric
} = useSongItem(props);

// 处理图片加载
const imageLoad = async (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (!target) return;
  await handleImageLoad(target);
};

// 切换选择状态
const toggleSelect = () => {
  emits('select', props.item.id, !props.selected);
};

// 绑定本地歌词文件
const bindLocalLyric = async () => {
  if (!isElectron) return;
  const songId = props.item.id?.toString();
  if (!songId) return;

  const filePath = await selectLyricFile();
  if (!filePath) return;

  setLocalLyricPath(songId, filePath);

  // 如果当前正在播放这首歌，立即重新加载歌词
  if (playerStore.playMusic?.id?.toString() === songId) {
    const content = await readLocalLyricFile(filePath);
    if (content) {
      const isTtml = filePath.toLowerCase().endsWith('.ttml');
      if (isTtml) {
        const ttmlLines = parseTtml(content);
        playerStore.playMusic.lyric = {
          lrcArray: ttmlLines,
          lrcTimeArray: ttmlLines.map((l) => l.startTime || 0)
        };
      } else {
        const { lyrics } = parseLyrics(content);
        const lrcArray = lyrics.map((l) => ({
          text: l.fullText,
          trText: '',
          words: l.words?.map((w) => ({
            text: w.text,
            startTime: w.startTime,
            duration: w.duration
          })),
          hasWordByWord: l.words && l.words.length > 1,
          startTime: l.startTime,
          duration: l.duration
        }));
        playerStore.playMusic.lyric = {
          lrcArray,
          lrcTimeArray: lrcArray.map((l) => l.startTime || 0)
        };
      }
    }
  }
};

// 把图片处理、艺术家处理等公共方法暴露给子组件
defineExpose({
  imageLoad,
  toggleSelect,
  handleArtistClick,
  handleMenuClick,
  playMusicEvent,
  toggleFavorite,
  handlePlayNext,
  playLoading,
  isPlaying,
  isFavorite,
  isDislike,
  artists,
  isHovering
});
</script>

<style lang="scss" scoped>
.song-item {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  @apply rounded-xl p-3 flex items-center transition bg-transparent dark:text-white text-gray-900;
}

.text-ellipsis {
  width: 100%;
}
</style>
