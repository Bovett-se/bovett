import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.bovett.app',
  appName: 'Bovett',
  webDir: 'apps/web/build',
  server: {
    url: 'https://bovett.se/app',
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'bovett.se'
  },
  android: {
    path: 'apps/android'
  },
  ios: {
    path: 'apps/ios'
  }
};

export default config;
