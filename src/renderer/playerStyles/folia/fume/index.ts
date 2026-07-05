// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerFume from './VisualizerFume.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-fume',
  label: '娴悕',
  component: VisualizerFume as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '鏄剧ず缈昏瘧', default: true },
    { key: 'foliaFumeScrollSpeed', type: 'slider', label: '婊氬姩閫熷害', min: 0.3, max: 3, step: 0.1, marks: ['鎱?, '蹇?], default: 1 },
    { key: 'foliaFumeFontSize', type: 'slider', label: '瀛楀彿姣斾緥', min: 0.015, max: 0.04, step: 0.005, marks: ['灏?, '澶?], default: 0.025 }
  ]
})

