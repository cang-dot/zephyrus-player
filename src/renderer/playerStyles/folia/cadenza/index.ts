// SPDX-License-Identifier: AGPL-3.0-only
// Originally ported from Folia (AGPL-3.0) — see NOTICE
import VisualizerCadenza from './VisualizerCadenza.vue'
import { registerStyle } from '../../registry'

export default registerStyle({
  key: 'folia-cadenza',
  label: '\u5FC3\u8C61',
  component: VisualizerCadenza as any,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: true,
  settings: [
    { key: 'foliaShowTranslation', type: 'boolean', label: '\u663E\u793A\u7FFB\u8BD1', default: true },
    { key: 'foliaCadenzaRadius', type: 'slider', label: '\u6392\u5217\u534A\u5F84', min: 0.1, max: 0.5, step: 0.05, marks: ['\u5C0F', '\u5927'], default: 0.25 },
    { key: 'foliaGlowIntensity', type: 'slider', label: '\u8F89\u5149\u5F3A\u5EA6', min: 0, max: 2, step: 0.1, marks: ['\u5F31', '\u5F3A'], default: 1 }
  ]
})
