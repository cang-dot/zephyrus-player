import VisualizerClassic from './VisualizerClassic.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-classic',
  label: '流光',
  component: VisualizerClassic as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '显示翻译', default: true },
    { key: 'foliaFloatSpeed', type: 'slider', label: '浮动速度', min: 3, max: 15, step: 1, marks: ['慢', '快'], default: 7 },
    { key: 'foliaGlowIntensity', type: 'slider', label: '辉光强度', min: 0, max: 2, step: 0.1, marks: ['弱', '强'], default: 1 }
  ]
})
