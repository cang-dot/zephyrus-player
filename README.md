<p align="center">
  <img src="splash-expanded.png" alt="Zephyrus Player" width="600" />
</p>

<div align="center">

# Zephyrus Player

**西风播放器** — 沉浸式音乐播放器

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3.5-42b883?logo=vue.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript_5.9-3178c6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Electron_40-47848f?logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/GSAP_3.15-88ce02?logo=greensock&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite_6.4-646cff?logo=vite&logoColor=white" />
</p>

---

## 功能亮点

- 🎵 **多平台音乐源** — 网易云音乐完整集成 + 咪咕/酷狗/酷我解锁 + LX Music 脚本 + 本地音乐扫描
- 🎨 **4 种全屏播放器** — 默认 / Stage / 杂志 / Frenzy，27+ GSAP 动画预设，实时高潮检测驱动视觉增强
- 🎤 **逐字歌词系统** — YRC 逐字时间轴 + 桌面歌词窗口（置顶/透明/锁定模式/多显示器支持）
- 🔧 **10 段均衡器** — Web Audio API，支持预设 + 变速播放 + 音频输出设备切换
- 🌈 **动态主题色** — 封面取色自动级联到全局 UI，支持自定义已播放/未播放/描边颜色
- 📱 **跨平台** — Windows / macOS / Linux + 移动端响应式适配 + 5 种语言

---

## 快速开始

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
npm run build:win      # Windows (NSIS)
npm run build:mac      # macOS (DMG + ZIP)
npm run build:linux    # Linux (AppImage / DEB / RPM)
```

---

## 功能一览

| 分类 | 功能 |
|------|------|
| **音乐源** | 网易云完整集成 · 多平台解锁 · LX Music 脚本 · 本地音乐扫描 · 播客 · MV |
| **音频引擎** | 10 段 EQ · 变速播放 · 无缝预加载 · 热切换 · 睡眠定时器 · Media Session |
| **歌词系统** | 逐字歌词 · 桌面歌词窗口 · 3 种显示模式 · 翻译 · 时间校正 · 封面取色 |
| **视觉系统** | 4 种全屏样式 · 27+ 动画预设 · 实时高潮检测 · WebGL 故障背景 |
| **界面** | 深色/浅色主题 · 迷你播放器 · 系统托盘 · 全局快捷键 · 远程控制 |
| **本地音乐** | 文件夹扫描 · 歌词绑定 · 内嵌歌词提取 · Web Audio API 独立播放 |
| **社区数据** | 高潮段落标注 · 重点词标注 · 社区歌词 · IndexedDB 缓存 |

---

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 40 |
| 前端框架 | Vue 3.5 + TypeScript 5.9 |
| 构建工具 | electron-vite 5 + Vite 6.4 |
| UI 组件库 | Naive UI 2.43 |
| CSS 框架 | Tailwind CSS 3.4 + SCSS |
| 状态管理 | Pinia + pinia-plugin-persistedstate |
| 动画引擎 | GSAP 3.15 |
| 音频播放 | Howler.js + Web Audio API + LocalAudioPlayer |
| 音乐 API | netease-cloud-music-api-alger (本地 Express) |

---

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 入口
│   ├── lyric.ts             # 桌面歌词窗口
│   ├── server.ts            # 本地 API 服务
│   └── modules/             # 主进程模块
├── preload/                 # 预加载脚本
└── renderer/                # Vue 3 渲染进程
    ├── components/          # 组件
    │   ├── lyric/           # 歌词组件（6 种样式）
    │   └── player/          # 播放条
    ├── hooks/               # 组合式函数
    ├── services/            # 核心服务
    │   ├── audioService.ts  # 音频引擎
    │   ├── localAudioPlayer.ts  # 本地音乐播放器
    │   ├── climaxDetector.ts    # 高潮检测
    │   └── cacheService.ts      # 缓存服务
    ├── store/               # Pinia 状态管理
    ├── views/               # 页面视图
    │   └── lyric/           # 桌面歌词窗口
    └── utils/               # 工具函数
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
- [GSAP](https://greensock.com/gsap/) — 动画引擎
- [Naive UI](https://www.naiveui.com/) — UI 组件库
- [OGL](https://github.com/oframe/ogl) — WebGL 渲染库
