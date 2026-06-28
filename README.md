<div align="center">

# 🎵 Zephyrus Player

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

## 📜 许可证

[AGPL-3.0 License](LICENSE) - 基于 [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) 修改

---

## 🙏 致谢

- [AlgerMusicPlayer](https://github.com/algerkong/AlgerMusicPlayer) - 原项目
- [GSAP](https://greensock.com/gsap/) - 动画引擎
- [Naive UI](https://www.naiveui.com/) - UI 组件库
- [Remix Icon](https://remixicon.com/) - 图标库
