// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerPartita from './VisualizerPartita.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-partita',
  label: '\u4E91\u9636',
  component: VisualizerPartita as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '\u663E\u793A\u7FFB\u8BD1', default: true },
    { key: 'foliaPartitaChunks', type: 'slider', label: '\u5206\u7EC4\u6570\u91CF', min: 2, max: 6, step: 1, marks: ['2\u7EC4', '6\u7EC4'], default: 3 }
  ]
})
