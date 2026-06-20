<div align="center">

# 🎵 Thymos Music Player

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88ce02?logo=greensock&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-40-47848f?logo=electron&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)
![Naive UI](https://img.shields.io/badge/Naive_UI-2.43-18a058?logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646cff?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3.0-ffd859?logo=pinia&logoColor=black)

一个沉浸式音乐播放器，支持动态强调色、Stage 舞台模式、三档歌词动画幅度。

基于 [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) v5.1.0 修改

</div>

---

## ✨ 新增功能

### 🎨 Stage 舞台模式
- 全屏沉浸式歌词播放界面
- 封面取色烟雾背景
- 封面取色强调色（全局 UI 颜色跟随封面）
- 设置面板（显示/界面/排版/背景）

### 🎬 三档歌词动画

| 模式 | 效果 |
|------|------|
| **柔和** | 慢速缓入，间隔 80ms |
| **正常** | 标准速度，间隔 50ms |
| **力量** | 极速冲击，间隔 18ms |

**8 种动画预设：** 右侧滑入、左侧滑入、上方滑入、下方滑入、淡入、逐字淡入、缩放进入、模糊进入

### 🔤 响应式字号
- 字号随窗口高度自动调整
- 800px 高 → 44px 字，1000px 高 → 55px 字
- 限制在 28px ~ 72px 之间

### 🎯 动画逻辑
- 划入动画：直接隐藏 → 切换文字 → 动画入场
- 其他动画：渐隐 → 切换文字 → 动画入场
- 切歌时：清空歌词，等待新歌词时间点

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 打包 Windows
npm run build:win

# 打包 macOS
npm run build:mac

# 打包 Linux
npm run build:linux
```

---

## 📁 项目结构

```
src/
├── renderer/              # 前端渲染进程
│   ├── components/
│   │   └── lyric/
│   │       ├── StagePlayer.vue      # Stage 舞台播放器
│   │       ├── LyricSettings.vue    # 歌词设置面板
│   │       └── MusicFull.vue        # 全屏播放器
│   ├── utils/
│   │   ├── stageAnimations.ts       # 27 种动画预设
│   │   └── animationSelector.ts     # 动画选择器
│   ├── types/
│   │   └── lyric.ts                 # 歌词配置类型
│   └── hooks/
│       └── useCoverColor.ts         # 封面取色 hook
├── main/                  # 主进程
└── preload/               # 预加载脚本
```

---

## 🎮 播放器样式

| 样式 | 说明 |
|------|------|
| **默认** | 标准播放界面 |
| **经典** | 经典播放界面 |
| **Stage** | 沉浸式舞台界面 |

点击右上角切换按钮或在设置中切换。

---

## ⚙️ Stage 模式设置

在 Stage 模式下点击齿轮图标，可配置：

- **显示**：纯净模式、隐藏封面、居中歌词、显示翻译
- **界面**：迷你播放栏、内容宽度
- **排版**：字号、字间距、字重、行高
- **背景**：自定义背景、主题、背景模式
- **歌词动画**：柔和 / 正常 / 力量

---

## 📝 更新日志

### v1.0.4 (2026.06.20)

#### ✅ 新增
- **TTML 歌词解析** - 支持 TTML 格式歌词，含 background words (`isBG`) 渲染
- **本地歌词绑定** - 右键歌曲可绑定本地 TTML/LRC 歌词文件
- **设置页本地歌词管理** - 界面设置中可查看/选择/清除已绑定歌词

#### 🔧 修复
- 修复舞台模式歌词动画属性残留（字体缩小、模糊卡住）
- 修复舞台模式歌词重复显示问题
- 修复设置页启动默认页下拉菜单无法正常显示的问题
- 修复右键菜单"绑定本地歌词文件"点击无响应的问题（emit 未触发）
- 移除捐赠模块

---

### v1.0.2 (2026.06.19)

#### ✅ 新增
- **侧边栏自定义** - 设置 → 界面设置
  - 调整侧边栏项目显示顺序
  - 显示/隐藏侧边栏项目（设置页不可隐藏）
  - 拖拽排序调整
- **启动默认页** - 选择应用启动时默认显示的页面
- **设置面板增强** - 添加"界面设置"标签页

#### 🔧 修复
- 修复 `ring-primary/50` 等 Tailwind 类不存在的错误
- 修复 `shadow-primary` 类不存在的错误
- 移除歌词节奏模式自动检测逻辑（简化动画流程）
- 修复舞台模式歌词重复显示问题
- 修复动画中断后属性残留导致的字体变小/模糊卡住问题

---

### v1.0.1 (2026.06.19)

#### ✅ 新增
- **Stage 动态背景** - 舞台模式背景全面动态化
  - 4层烟雾动画（不同速度、位置、旋转）
  - 呼吸/脉动效果（烟雾层有节奏地缩放）
  - 慢速旋转效果（烟雾层持续旋转）
  - 色彩呼吸效果（封面亮度/饱和度微妙变化）
  - 浮动粒子效果（强调色圆点向上漂浮）

#### 🔧 优化
- 烟雾层从2层增加到4层，视觉效果更丰富
- 封面背景添加呼吸动画，增加动感
- 暗角效果添加微妙脉动

---

### v1.0.0 (2026.06.19)

#### ✅ 新增
- **Stage 舞台模式** - 全屏沉浸式歌词播放界面，处于可用状态
  - 封面取色烟雾背景
  - 封面取色强调色（全局 UI 颜色跟随封面）
  - 响应式字号（随窗口高度自动调整）
  - 歌词动画：柔和 / 正常 / 力量 三档可选
  - 7 种动画预设：右侧滑入、左侧滑入、上方滑入、下方滑入、淡入、缩放进入、模糊进入
  - 设置面板（显示/界面/排版/背景）
- **经典模式** - 目前不可用，后续开发中
- **动态强调色** - 歌曲封面颜色自动应用到全局 UI

#### 🔧 优化
- 动画逻辑：划入动画直接隐藏，其他动画渐隐后入场
- 切歌时清空歌词，等待新歌词时间点到达

---

## 📜 许可证

[AGPL-3.0 License](LICENSE) - 基于 [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) 修改

---

## 🙏 致谢

- [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) - 原项目
- [GSAP](https://greensock.com/gsap/) - 动画引擎
- [Naive UI](https://www.naiveui.com/) - UI 组件库
- [Remix Icon](https://remixicon.com/) - 图标库
