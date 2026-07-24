import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zephyrus.player',
  appName: 'ZephyrusPlayer',
  webDir: 'out/renderer',
  backgroundColor: '#ffffff',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
