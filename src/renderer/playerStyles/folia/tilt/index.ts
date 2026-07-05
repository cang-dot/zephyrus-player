// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerTilt from './VisualizerTilt.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-tilt',
  label: '鍊捐瘔',
  component: VisualizerTilt as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '鏄剧ず缈昏瘧', default: true },
    { key: 'foliaTiltSplitCount', type: 'slider', label: '鍒嗗壊娈垫暟', min: 2, max: 5, step: 1, marks: ['2娈?, '5娈?], default: 2 }
  ]
})

