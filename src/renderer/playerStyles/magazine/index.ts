import TypographicPlayer from '@/components/lyric/TypographicPlayer.vue';
import settings from './settings.json';
import { registerStyle } from '../registry';

export default registerStyle({
  key: 'magazine',
  label: '杂志',
  component: TypographicPlayer,
  isFullScreen: false,
  theme: 'light',
  showStyleSwitch: true,
  settings
});
