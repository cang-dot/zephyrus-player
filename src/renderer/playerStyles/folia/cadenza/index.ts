// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerCadenza from './VisualizerCadenza.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-cadenza',
  label: '蹇冭薄',
  component: VisualizerCadenza as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '鏄剧ず缈昏瘧', default: true },
    { key: 'foliaCadenzaRadius', type: 'slider', label: '鎺掑垪鍗婂緞', min: 0.1, max: 0.5, step: 0.05, marks: ['灏?, '澶?], default: 0.25 },
    { key: 'foliaGlowIntensity', type: 'slider', label: '杈夊厜寮哄害', min: 0, max: 2, step: 0.1, marks: ['寮?, '寮?], default: 1 }
  ]
})

