// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerClassic from './VisualizerClassic.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-classic',
  label: '娴佸厜',
  component: VisualizerClassic as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '鏄剧ず缈昏瘧', default: true },
    { key: 'foliaFloatSpeed', type: 'slider', label: '娴姩閫熷害', min: 3, max: 15, step: 1, marks: ['鎱?, '蹇?], default: 7 },
    { key: 'foliaGlowIntensity', type: 'slider', label: '杈夊厜寮哄害', min: 0, max: 2, step: 0.1, marks: ['寮?, '寮?], default: 1 }
  ]
})

