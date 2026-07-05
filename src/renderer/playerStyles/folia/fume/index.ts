import VisualizerFume from './VisualizerFume.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-fume',
  label: '浮名',
  component: VisualizerFume as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '显示翻译', default: true },
    { key: 'foliaFumeScrollSpeed', type: 'slider', label: '滚动速度', min: 0.3, max: 3, step: 0.1, marks: ['慢', '快'], default: 1 },
    { key: 'foliaFumeFontSize', type: 'slider', label: '字号比例', min: 0.015, max: 0.04, step: 0.005, marks: ['小', '大'], default: 0.025 }
  ]
})
