<p align="center">
  <img src="splash-expanded.png" alt="Zephyrus Player" width="600" />
</p>

<div align="center">

# Zephyrus Player

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3.5-42b883?logo=vue.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript_5.9-3178c6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Electron_40-47848f?logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/GSAP_3.15-88ce02?logo=greensock&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite_6.4-646cff?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Pinia-ffd859?logo=pinia&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_3.4-06b6d4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Naive_UI_2.43-18a058" />
</p>

<div align="center">

**西风播放器** — 一个沉浸式音乐播放器，支持动态强调色、4 种全屏播放器样式、逐字歌词、桌面歌词窗口、实时高潮检测。

</div>

---

## 功能特性

### 🎵 音乐源

- **网易云音乐** 完整集成 — 搜索、歌单、专辑、歌手、排行榜、推荐、用户主页、FM
- **多平台音乐解锁** — 咪咕、酷狗、酷我、PyNCMD
- **LX Music 音源脚本** — 导入与执行第三方音源脚本
- **本地音乐** — 扫描本地文件夹并播放
- **播客** — 浏览与播放播客节目
- **MV 播放**

### 🎮 音频引擎

- **10 段均衡器** — Web Audio API，支持预设
- **变速播放** — 不改变音调
- **音频输出设备切换**
- **无缝预加载** — 当前曲目即将结束时预加载下一首
- **热切换** — 多音源间无缝切换，不中断播放
- **睡眠定时器** — 按时间 / 歌曲数 / 播放列表结束
- **Media Session API** — 操作系统级媒体控制

### 🎨 视觉系统

#### 全屏播放器（6 种样式）

| 样式 | 说明 |
|------|------|
| 默认 | 标准分栏播放界面（封面 + 滚动歌词） |
| Stage | 沉浸式舞台界面（烟幕、粒子、高潮驱动视觉增强） |
| 杂志排版 | 散落式文字布局，色块装饰，节奏驱动特效 |
| Frenzy（狂躁） | 白色背景、轻微故障、双层歌词，可配置红字强调色 |

#### 歌词系统

- **逐字歌词（YRC）** — 每字独立时间轴，渐变进度动画
- **桌面歌词窗口** — 置顶、透明、可拖拽、多显示器支持、锁定模式（点击穿透 + 悬停检测 + 全局快捷键解锁）
- **3 种歌词显示模式** — 单行 / 双行 / 滚动
- **响应式字号** — 28px ~ 72px，随窗口高度自动调整
- **自定义字体 / 文本颜色 / 描边颜色**（系统字体列表选择）
- **歌词翻译** — 支持 OpenCC 繁体中文转换
- **歌词时间校正** — 手动偏移调整
- **封面取色** — Canvas 像素采样，动态主题色级联到全局 UI

#### 动画系统

- **27+ GSAP 动画预设** — 滑入、淡入、缩放、模糊、逐字、掉落、震动
- **3 级动画强度** — 柔和 80ms / 正常 50ms / 力量 18ms
- **实时高潮检测** — RMS 能量 + 频谱分析，驱动 Stage / 杂志模式视觉增强

#### 社区重点词

- 服务器重点词标注（高潮段落、关键词）
- IndexedDB 本地缓存（24h TTL）
- 编辑器：拖动选择连续字符标记为重点词
- Gritty / Frenzy 配置：红字开关、扫描线开关、强调字颜色（红色 / 封面色 / 自定义）

### 🖥 UI/UX

- **深色/浅色主题** — 手动切换或跟随系统
- **移动端/平板自适应** — 响应式布局
- **迷你播放器模式**
- **系统托盘** — 最小化到托盘，支持播放控制
- **全局快捷键** — 可自定义
- **桌面歌词解锁快捷键** — 可自定义默认 `Ctrl+L`
- **远程控制** — 外部设备控制播放
- **侧栏自定义** — 排序 / 隐藏
- **自定义首页默认页面**
- **播放历史热力图**
- **下载管理** — 进度跟踪
- **歌单导入**
- **搜索建议** — 实时自动补全
- **5 种语言** — 简体中文、繁体中文、英文、日文、韩文

---

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式（Electron 桌面）
npm run dev

# 开发模式（Web，需外部 API 服务器）
npm run dev:web

# 构建
npm run build

# 打包
npm run build:win      # Windows (NSIS 安装包)
npm run build:mac      # macOS (DMG + ZIP, x64/arm64)
npm run build:linux    # Linux (AppImage / DEB / RPM)

# 预览生产构建
npm run start
```

### 代码质量

```bash
npm run lint         # ESLint + i18n 键值检查
npm run format       # Prettier 格式化
npm run typecheck    # TypeScript 类型检查
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 40 |
| 前端框架 | Vue 3.5 + TypeScript 5.9 |
| 构建工具 | electron-vite 5 + Vite 6.4 |
| UI 组件库 | Naive UI 2.43 |
| CSS 框架 | Tailwind CSS 3.4 + SCSS |
| 状态管理 | Pinia 3.0 + pinia-plugin-persistedstate |
| 路由 | Vue Router 4.6 (hash history) |
| 动画引擎 | GSAP 3.15 |
| 音频播放 | Howler.js 2.2 + Web Audio API |
| 国际化 | vue-i18n 11.2 |
| 音乐 API | netease-cloud-music-api-alger 4.30 (本地 Express 服务) |
| 音乐解锁 | @unblockneteasemusic/server 0.27 |
| 打包 | electron-builder 26 |
| WebGL | OGL |

---

## 架构设计

### 音频服务单例

`audioService.ts` 封装 Howler.js，集成 Web Audio API（EQ 滤波器链、GainNode 音量控制、AnalyserNode 高潮检测）。实现操作锁模式防止并发音频操作，超时自动释放。

```
用户操作 → 操作锁（超时 5s） → Howler.js 播放 → AnalyserNode → EQ 链 → 输出
```

### 样式引擎

`styleEngine` Store 聚合播放状态、音频特征、副歌数据、封面颜色、社区数据（重点词），为所有视觉模式提供统一数据源。全屏播放器样式切换通过 `MusicFullWrapper` 按需加载对应组件。

### 封面色彩提取

`useCoverColor` 从专辑封面 Canvas 像素采样提取主色调，调整亮度和色温后作为 CSS 自定义属性（`--accent-color`、`--highlight-color` 等），通过 Tailwind 配置和组件样式级联到全局 UI。

### 社区数据流

```
IndexedDB 缓存（24h TTL） → API 请求 → 缓存更新
```

加载顺序：高潮段落 → 重点词 → 社区歌词。每步仅在前置数据存在时继续。

### GSAP 动画系统

`stageAnimations.ts` 提供 3 级强度（soft / normal / power）共 27+ 动画预设，参数随能量缩放。`AnimationSelector` 类确保动画多样性并避免重复。所有动画使用 GSAP Timeline，支持中断和清理。

### 桌面歌词窗口

独立 BrowserWindow，通过 IPC 与主窗口通信：
- `lyric-ready` → 主窗口发送完整歌词数据
- `lyric-hover-state` — 主进程 `screen.getCursorScreenPoint()` 轮询检测悬停
- `receive-cover-color` — 封面取色实时同步
- `receive-lyric-style` — 字体/颜色/描边配置同步
- 锁定模式：`setIgnoreMouseEvents(true, { forward: true })` 实现点击穿透

### 模块化 Store

`player` Store 是一个聚合门面，组合 `playerCore`、`playlist`、`favorite`、`sleepTimer`、`intelligenceMode` 五个子 Store，通过 `storeToRefs` 提供统一 API，同时保持关注点分离。

---

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 入口：单实例锁、GPU 加速、窗口创建、模块初始化
│   ├── lyric.ts             # 桌面歌词窗口管理 + 全局快捷键
│   ├── server.ts            # 本地网易云音乐 API 服务（端口 30488）
│   ├── set.json             # 默认配置
│   └── modules/
│       ├── cache.ts         # 歌词/音乐缓存
│       ├── config.ts        # electron-store 配置管理
│       ├── fonts.ts         # 系统字体枚举（font-list）
│       ├── localMusicScanner.ts
│       ├── remoteControl.ts
│       ├── shortcuts.ts     # 全局快捷键
│       ├── tray.ts          # 系统托盘
│       ├── update.ts        # 自动更新
│       └── window.ts        # 主窗口创建
│
├── preload/                 # 预加载脚本（contextBridge）
│
├── renderer/                # Vue 3 渲染进程
│   ├── main.ts              # 入口
│   ├── App.vue              # 根组件（主题/语言/启动画面）
│   ├── api/                 # API 层
│   ├── components/
│   │   ├── common/          # 通用组件
│   │   ├── cover/           # 封面组件
│   │   ├── lyric/           # 歌词组件（6 种样式）
│   │   ├── player/          # 播放条
│   │   ├── podcast/         # 播客
│   │   ├── settings/        # 设置
│   │   └── splash/          # 启动画面
│   ├── hooks/               # 组合式函数
│   │   ├── MusicHook.ts     # 核心音乐播放 hook
│   │   ├── useCoverColor.ts # 封面色彩提取
│   │   ├── usePlaybackControl.ts
│   │   └── ...
│   ├── layout/              # 布局组件
│   ├── router/
│   ├── services/            # 核心服务
│   │   ├── audioService.ts  # 音频引擎（Howler.js + Web Audio API）
│   │   ├── climaxDetector.ts# 实时高潮检测
│   │   ├── drumDetector.ts  # 鼓点检测
│   │   └── cacheService.ts  # IndexedDB 社区数据缓存
│   ├── store/               # Pinia 状态管理
│   │   ├── modules/
│   │   │   ├── player.ts    # 聚合 Store
│   │   │   ├── playerCore.ts
│   │   │   ├── playlist.ts
│   │   │   ├── styleEngine.ts
│   │   │   ├── communityData.ts
│   │   │   └── ...
│   │   └── index.ts
│   ├── types/               # 类型定义
│   ├── utils/               # 工具函数
│   │   ├── stageAnimations.ts # 27+ GSAP 预设
│   │   ├── yrcParser.ts     # 逐字歌词解析器
│   │   └── ...
│   └── views/               # 页面视图
│       ├── lyric/           # 桌面歌词窗口
│       └── set/             # 设置页
│
└── shared/                  # 主进程/渲染进程共享
    ├── appUpdate.ts
    └── shortcuts.ts
```

---

## 开发者文档

详见 [DEV.md](DEV.md)

---

## 许可证

[MIT License](LICENSE)

基于 [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) 修改

---

## 致谢

- [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) — 原项目
- [OGL](https://github.com/oframe/ogl) — WebGL 渲染库
- [GSAP](https://greensock.com/gsap/) — 动画引擎
- [Naive UI](https://www.naiveui.com/) — UI 组件库
- [Remix Icon](https://remixicon.com/) — 图标库
