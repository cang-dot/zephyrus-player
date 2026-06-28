<template>
  <n-modal v-model:show="visible" preset="card" title="标记高潮段落" :bordered="false" class="climax-editor">
    <div class="climax-editor-content">
      <!-- 当前歌曲信息 -->
      <div class="song-info" v-if="playMusic">
        <span class="song-name">{{ playMusic.name }}</span>
        <span class="song-contributor" v-if="climaxStore.contributor">
          贡献者: {{ climaxStore.contributor }}
        </span>
      </div>

      <!-- 时间轴 -->
      <div class="timeline-wrapper">
        <!-- 时间刻度 -->
        <div class="time-scale">
          <span v-for="mark in timeMarks" :key="mark" class="time-mark" :style="{ left: (mark / duration * 100) + '%' }">
            {{ formatTime(mark) }}
          </span>
        </div>

        <!-- 时间轴主体 -->
        <div class="timeline" ref="timelineRef" @mousedown="handleTimelineMouseDown">
          <!-- 已有段落 -->
          <div
            v-for="(seg, i) in climaxStore.segments"
            :key="i"
            class="climax-region"
            :class="{ 'climax-region-active': nowTime >= seg.start && nowTime <= seg.end }"
            :style="getRegionStyle(seg)"
          >
            <!-- 左侧拖拽手柄 -->
            <div class="region-handle left" @mousedown.stop="handleEdgeDrag($event, i, 'start')"></div>
            <!-- 中间内容区 -->
            <div class="region-content" @click.stop>
              <span class="region-label">{{ formatTime(seg.start) }} - {{ formatTime(seg.end) }}</span>
            </div>
            <!-- 右侧拖拽手柄 -->
            <div class="region-handle right" @mousedown.stop="handleEdgeDrag($event, i, 'end')"></div>
          </div>

          <!-- 拖拽选区 -->
          <div v-if="isDragging" class="climax-preview" :style="getPreviewStyle()"></div>

          <!-- 当前播放位置 -->
          <div class="playhead" :style="{ left: (currentTime / duration * 100) + '%' }"></div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="editor-actions">
        <n-button size="small" @click="clearAll" :disabled="climaxStore.segments.length === 0">清空所有</n-button>
        <n-button type="primary" size="small" @click="saveToServer" :loading="saving">
          保存到服务器
        </n-button>
      </div>

      <!-- 段落列表 -->
      <div class="segment-list" v-if="climaxStore.segments.length > 0">
        <div class="segment-list-title">已标记段落 ({{ climaxStore.segments.length }})</div>
        <div v-for="(seg, i) in climaxStore.segments" :key="i" class="segment-item">
          <span>{{ formatTime(seg.start) }} - {{ formatTime(seg.end) }}</span>
          <span class="segment-duration">({{ formatTime(seg.end - seg.start) }})</span>
          <button class="remove-btn" @click="removeSegment(i)">×</button>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { uploadClimax, type ClimaxSegment } from '@/api/climax';
import { nowTime, allTime, playMusic } from '@/hooks/MusicHook';
import { useClimaxStore } from '@/store/modules/climax';
import { useUserStore } from '@/store/modules/user';
import { secondToMinute } from '@/utils';

const climaxStore = useClimaxStore();
const userStore = useUserStore();

const visible = defineModel<boolean>({ default: false });

const timelineRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStart = ref(0);
const dragEnd = ref(0);
const saving = ref(false);

// 边缘拖拽状态
const edgeDragState = ref<{
  segIndex: number;
  edge: 'start' | 'end';
  startX: number;
  originalStart: number;
  originalEnd: number;
} | null>(null);

const currentTime = computed(() => nowTime.value);
const duration = computed(() => allTime.value || 1);

// 时间刻度标记（每10秒一个刻度，最多显示20个）
const timeMarks = computed(() => {
  const marks: number[] = [];
  const step = Math.max(10, Math.ceil(duration.value / 20));
  for (let t = 0; t <= duration.value; t += step) {
    marks.push(t);
  }
  return marks;
});

// 格式化时间
function formatTime(seconds: number): string {
  return secondToMinute(Math.max(0, seconds));
}

// 获取段落样式
function getRegionStyle(seg: ClimaxSegment) {
  const left = (seg.start / duration.value) * 100;
  const width = ((seg.end - seg.start) / duration.value) * 100;
  return {
    left: `${left}%`,
    width: `${Math.max(0.5, width)}%`,
  };
}

// 获取预览选区样式
function getPreviewStyle() {
  const start = Math.min(dragStart.value, dragEnd.value);
  const end = Math.max(dragStart.value, dragEnd.value);
  const left = (start / duration.value) * 100;
  const width = ((end - start) / duration.value) * 100;
  return {
    left: `${left}%`,
    width: `${Math.max(0.5, width)}%`,
  };
}

// 时间轴点击/拖拽 — 新增段落
function handleTimelineMouseDown(e: MouseEvent) {
  if (!timelineRef.value || edgeDragState.value) return;
  const rect = timelineRef.value.getBoundingClientRect();
  const startX = ((e.clientX - rect.left) / rect.width) * duration.value;

  isDragging.value = true;
  dragStart.value = startX;
  dragEnd.value = startX;

  const handleMouseMove = (me: MouseEvent) => {
    const currentX = ((me.clientX - rect.left) / rect.width) * duration.value;
    dragEnd.value = Math.max(0, Math.min(duration.value, currentX));
  };

  const handleMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const start = Math.min(dragStart.value, dragEnd.value);
    const end = Math.max(dragStart.value, dragEnd.value);
    if (end - start > 0.5) {
      addSegment(start, end);
    }
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// 边缘拖拽 — 延长/缩短段落
function handleEdgeDrag(e: MouseEvent, segIndex: number, edge: 'start' | 'end') {
  if (!timelineRef.value) return;
  const rect = timelineRef.value.getBoundingClientRect();
  const seg = climaxStore.segments[segIndex];

  edgeDragState.value = {
    segIndex,
    edge,
    startX: ((e.clientX - rect.left) / rect.width) * duration.value,
    originalStart: seg.start,
    originalEnd: seg.end,
  };

  const handleMouseMove = (me: MouseEvent) => {
    if (!edgeDragState.value) return;
    const currentX = ((me.clientX - rect.left) / rect.width) * duration.value;
    const delta = currentX - edgeDragState.value.startX;
    const segments = [...climaxStore.segments];
    const target = segments[segIndex];

    if (edgeDragState.value.edge === 'start') {
      target.start = Math.max(0, Math.min(target.end - 0.5, edgeDragState.value.originalStart + delta));
    } else {
      target.end = Math.min(duration.value, Math.max(target.start + 0.5, edgeDragState.value.originalEnd + delta));
    }

    climaxStore.updateSegments(segments);
  };

  const handleMouseUp = () => {
    edgeDragState.value = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// 添加段落
function addSegment(start: number, end: number) {
  const newSeg: ClimaxSegment = { start, end };
  const existing = [...climaxStore.segments];

  const merged: ClimaxSegment[] = [];
  let current = newSeg;

  for (const seg of existing.sort((a, b) => a.start - b.start)) {
    if (current.end < seg.start) {
      merged.push(current);
      current = seg;
    } else {
      current = {
        start: Math.min(current.start, seg.start),
        end: Math.max(current.end, seg.end),
      };
    }
  }
  merged.push(current);

  climaxStore.updateSegments(merged.sort((a, b) => a.start - b.start));
}

// 删除段落
function removeSegment(index: number) {
  const segments = [...climaxStore.segments];
  segments.splice(index, 1);
  climaxStore.updateSegments(segments);
}

// 清空所有
function clearAll() {
  climaxStore.updateSegments([]);
}

// 保存到服务器
async function saveToServer() {
  if (!playMusic.value?.id) return;
  saving.value = true;
  try {
    await uploadClimax({
      songId: String(playMusic.value.id),
      songName: playMusic.value.name || '',
      artist: playMusic.value.ar?.map((a) => a.name).join('/') || '',
      album: playMusic.value.al?.name || '',
      duration: duration.value,
      segments: climaxStore.segments,
      contributorName: userStore.user?.nickname || 'Anonymous',
    });
  } catch (err) {
    console.error('[ClimaxEditor] 保存失败:', err);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.climax-editor {
  max-width: 600px;
}

.climax-editor-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.song-info {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .song-name {
    font-weight: 600;
  }

  .song-contributor {
    font-size: 12px;
    color: #999;
  }
}

.timeline-wrapper {
  position: relative;
}

// 时间刻度
.time-scale {
  position: relative;
  height: 16px;
  margin-bottom: 4px;

  .time-mark {
    position: absolute;
    transform: translateX(-50%);
    font-size: 10px;
    color: #999;
    white-space: nowrap;
  }
}

// 时间轴主体
.timeline {
  position: relative;
  height: 36px;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: crosshair;
  overflow: visible;
}

.dark .timeline {
  background: #333;
}

// 高潮段落区域
.climax-region {
  position: absolute;
  top: 2px;
  bottom: 2px;
  background: rgba(var(--accent-color-rgb, 34, 197, 94), 0.4);
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  z-index: 2;

  &.climax-region-active {
    background: rgba(var(--accent-color-rgb, 34, 197, 94), 0.7);
  }
}

// 拖拽手柄
.region-handle {
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  flex-shrink: 0;
  position: relative;
  z-index: 3;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 16px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px;
    transition: background 0.2s;
  }

  &.left::after {
    left: 2px;
  }

  &.right::after {
    right: 2px;
  }

  &:hover::after {
    background: rgba(255, 255, 255, 0.9);
  }
}

// 段落内容区
.region-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .region-label {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.6);
    white-space: nowrap;
  }
}

// 拖拽预览
.climax-preview {
  position: absolute;
  top: 2px;
  bottom: 2px;
  background: rgba(var(--accent-color-rgb, 34, 197, 94), 0.3);
  pointer-events: none;
  z-index: 1;
}

// 播放头
.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff0000;
  transform: translateX(-1px);
  pointer-events: none;
  z-index: 5;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.segment-list {
  max-height: 150px;
  overflow-y: auto;

  .segment-list-title {
    font-size: 12px;
    color: #999;
    margin-bottom: 8px;
  }

  .segment-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 4px;

    .segment-duration {
      color: #999;
      font-size: 12px;
    }

    .remove-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 16px;

      &:hover {
        color: #ff4444;
      }
    }
  }
}

.dark .segment-item {
  background: #2a2a2a;
}
</style>
