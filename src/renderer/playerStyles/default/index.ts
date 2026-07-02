import MusicFull from '@/components/lyric/MusicFull.vue';
import settings from './settings.json';
import { registerStyle } from '../registry';

export default registerStyle({
  key: 'default',
  label: '默认',
  component: MusicFull,
  isFullScreen: false,
  theme: 'light',
  showStyleSwitch: false,
  settings
});
