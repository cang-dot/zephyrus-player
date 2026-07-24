<template>
  <setting-section
    v-if="isAndroid"
    title="增强保活"
    description="设置应用权限以防止系统在后台杀掉应用，确保音乐在后台持续播放"
  >
    <!-- 电池优化 -->
    <setting-item
      title="关闭电池优化"
      description="将应用加入电池优化白名单，防止系统因省电策略在后台停止播放"
    >
      <template #action>
        <s-btn variant="primary" @click="handleBatteryOptimization">
          {{ batteryOptimized ? '已设置' : '去设置' }}
        </s-btn>
      </template>
      <template #extra>
        <div v-if="batteryOptimized" class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <i class="ri-check-line" />
          <span>已加入电池优化白名单</span>
        </div>
      </template>
    </setting-item>

    <!-- 自启动权限 -->
    <setting-item
      title="允许自启动"
      description="允许应用开机自启动和后台自启动，确保系统不会阻止应用在后台运行"
    >
      <template #action>
        <s-btn @click="handleAutoStart">去设置</s-btn>
      </template>
    </setting-item>

    <!-- 通知权限 -->
    <setting-item
      title="通知权限"
      description="允许应用发送通知，确保音乐控制通知正常显示在通知栏"
    >
      <template #action>
        <s-btn @click="handleNotificationSettings">去设置</s-btn>
      </template>
    </setting-item>

    <!-- 后台弹出界面权限 -->
    <setting-item
      title="后台弹出界面权限"
      description="允许应用在后台弹出界面，部分厂商系统需要此权限才能保持后台运行"
    >
      <template #action>
        <s-btn @click="handleDisplayOverOtherApps">去设置</s-btn>
      </template>
    </setting-item>

    <!-- 应用详情页 -->
    <setting-item
      title="应用详情设置"
      description="打开系统应用信息页，可手动管理所有权限（强制停止、省电策略、后台限制等）"
    >
      <template #action>
        <s-btn @click="handleAppDetails">去设置</s-btn>
      </template>
    </setting-item>

    <!-- 保活指南 -->
    <setting-item
      title="保活设置指南"
      description="不同品牌手机的保活设置路径可能不同，点击查看详细指南"
    >
      <template #action>
        <s-btn variant="ghost" @click="showGuide = true">查看指南</s-btn>
      </template>
    </setting-item>

    <!-- 指南弹窗 -->
    <n-modal v-model:show="showGuide" preset="card" title="保活设置指南" class="max-w-2xl">
      <div class="space-y-4 text-sm leading-relaxed">
        <div class="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-700 dark:text-amber-300">
          <i class="ri-information-line mr-1" />
          <span>以下设置因手机品牌不同，路径可能略有差异。如果按钮无法打开对应设置页，请手动在系统设置中查找。</span>
        </div>

        <div>
          <h4 class="font-semibold mb-2 text-base">1. 关闭电池优化（最重要）</h4>
          <p class="text-gray-600 dark:text-gray-400 mb-2">这是最关键的设置。系统会因电池优化策略在后台杀掉应用。</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400 ml-2">
            <li>点击上方「关闭电池优化」按钮</li>
            <li>在弹出的系统对话框中选择「允许」</li>
            <li>如果无法弹出，前往 设置 → 应用 → ZephyrusPlayer → 电池 → 不受限制</li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold mb-2 text-base">2. 允许自启动</h4>
          <p class="text-gray-600 dark:text-gray-400 mb-2">部分品牌（小米、华为、OPPO、vivo 等）默认禁止应用自启动。</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400 ml-2">
            <li>小米/红米：设置 → 应用设置 → 应用管理 → ZephyrusPlayer → 自启动 → 开启</li>
            <li>华为/荣耀：设置 → 应用 → 应用启动管理 → ZephyrusPlayer → 手动管理 → 全部开启</li>
            <li>OPPO/一加：设置 → 电池 → 应用耗电管理 → ZephyrusPlayer → 允许自启动</li>
            <li>vivo/iQOO：设置 → 电池 → 后台高耗电 → ZephyrusPlayer → 允许</li>
            <li>三星：设置 → 电池和设备维护 → 电池 → 后台使用限制 → 不限制 ZephyrusPlayer</li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold mb-2 text-base">3. 锁定后台</h4>
          <p class="text-gray-600 dark:text-gray-400 mb-2">在最近任务列表中锁定应用，防止被一键清理。</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400 ml-2">
            <li>从底部上滑打开最近任务列表</li>
            <li>找到 ZephyrusPlayer，下拉锁定（或点击锁定图标）</li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold mb-2 text-base">4. 通知权限</h4>
          <p class="text-gray-600 dark:text-gray-400 mb-2">确保通知权限已开启，否则无法显示音乐控制通知。</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400 ml-2">
            <li>点击上方「通知权限」按钮</li>
            <li>开启 ZephyrusPlayer 的通知权限</li>
          </ul>
        </div>
      </div>
    </n-modal>
  </setting-section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NModal } from 'naive-ui';

import {
  isAndroidNative,
  openAppDetailsSettings,
  openAutoStartSettings,
  openBatteryOptimizationSettings,
  openDisplayOverOtherAppsSettings,
  openNotificationSettings
} from '@/services/androidNative';

import SBtn from '../SBtn.vue';
import SettingItem from '../SettingItem.vue';
import SettingSection from '../SettingSection.vue';

const isAndroid = isAndroidNative();
const showGuide = ref(false);
const batteryOptimized = ref(false);

const handleBatteryOptimization = () => {
  openBatteryOptimizationSettings();
  // 延迟检查（用户可能已设置）
  setTimeout(() => {
    batteryOptimized.value = true;
  }, 3000);
};

const handleAutoStart = () => {
  openAutoStartSettings();
};

const handleNotificationSettings = () => {
  openNotificationSettings();
};

const handleDisplayOverOtherApps = () => {
  openDisplayOverOtherAppsSettings();
};

const handleAppDetails = () => {
  openAppDetailsSettings();
};

onMounted(() => {
  // 初始状态检查（简化处理）
  batteryOptimized.value = false;
});
</script>
