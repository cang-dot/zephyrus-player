// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerPartita from './VisualizerPartita.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-partita',
  label: '浜戦樁',
  component: VisualizerPartita as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '鏄剧ず缈昏瘧', default: true },
    { key: 'foliaPartitaChunks', type: 'slider', label: '鍒嗙粍鏁伴噺', min: 2, max: 6, step: 1, marks: ['2缁?, '6缁?], default: 3 }
  ]
})

