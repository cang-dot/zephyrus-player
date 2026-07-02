import FrenzyPlayer from '@/components/lyric/FrenzyPlayer.vue';
import settings from './settings.json';
import { registerStyle } from '../registry';

export default registerStyle({
  key: 'frenzy',
  label: '狂躁',
  component: FrenzyPlayer,
  isFullScreen: true,
  theme: 'dark',
  showStyleSwitch: false,
  settings
});
