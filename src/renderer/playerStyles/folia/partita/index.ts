import VisualizerPartita from './VisualizerPartita.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-partita',
  label: '云阶',
  component: VisualizerPartita as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '显示翻译', default: true },
    { key: 'foliaPartitaChunks', type: 'slider', label: '分组数量', min: 2, max: 6, step: 1, marks: ['2组', '6组'], default: 3 }
  ]
})
