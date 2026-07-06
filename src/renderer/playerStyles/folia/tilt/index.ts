// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerTilt from './VisualizerTilt.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-tilt',
  label: '\u503E\u8BC9',
  component: VisualizerTilt as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '\u663E\u793A\u7FFB\u8BD1', default: true },
    { key: 'foliaTiltSplitCount', type: 'slider', label: '\u5206\u5272\u6BB5\u6570', min: 2, max: 5, step: 1, marks: ['2\u6BB5', '5\u6BB5'], default: 2 }
  ]
})
