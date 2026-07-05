import VisualizerTilt from './VisualizerTilt.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-tilt',
  label: '倾诉',
  component: VisualizerTilt as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '显示翻译', default: true },
    { key: 'foliaTiltSplitCount', type: 'slider', label: '分割段数', min: 2, max: 5, step: 1, marks: ['2段', '5段'], default: 2 }
  ]
})
