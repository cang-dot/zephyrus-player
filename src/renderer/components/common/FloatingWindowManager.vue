<template>
  <div class="floating-window-manager">
    <floating-window
      v-for="win in windowStore.windows"
      :key="win.id"
      :win="win"
    />
  </div>
</template>

<script setup lang="ts">
import FloatingWindow from './FloatingWindow.vue';
import { useWindowStore } from '@/store/modules/windowStore';

const windowStore = useWindowStore();
</script>

<style scoped>
.floating-window-manager {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.floating-window-manager :deep(.floating-window) {
  pointer-events: auto;
}
</style>
