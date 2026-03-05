import { browser } from '$app/environment';

class OfflineState {
  isOffline = $state(false);

  constructor() {
    if (browser) {
      this.isOffline = !window.navigator.onLine;

      window.addEventListener('online', () => {
        this.isOffline = false;
      });

      window.addEventListener('offline', () => {
        this.isOffline = true;
      });
    }
  }
}

export const offlineState = new OfflineState();
