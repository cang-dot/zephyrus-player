import StagePlayer from '@/components/lyric/StagePlayer.vue';
import settings from './settings.json';
import { registerStyle } from '../registry';

export default registerStyle({
  key: 'stage',
  label: '舞台',
  component: StagePlayer,
  isFullScreen: false,
  theme: 'light',
  showStyleSwitch: true,
  settings
});
