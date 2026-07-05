import VisualizerCadenza from './VisualizerCadenza.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-cadenza',
  label: '心象',
  component: VisualizerCadenza as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '显示翻译', default: true },
    { key: 'foliaCadenzaRadius', type: 'slider', label: '排列半径', min: 0.1, max: 0.5, step: 0.05, marks: ['小', '大'], default: 0.25 },
    { key: 'foliaGlowIntensity', type: 'slider', label: '辉光强度', min: 0, max: 2, step: 0.1, marks: ['弱', '强'], default: 1 }
  ]
})
