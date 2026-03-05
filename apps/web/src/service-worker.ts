/// <reference types="@sveltejs/kit" />
import { build, files, prerendered, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE_NAME = `cache-${version}`;

const ASSETS = [...build, ...files, ...prerendered, '/', '/app'];

self.addEventListener('install', (event: ExtendableEvent) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE_NAME) {
        await caches.delete(key);
      }
    }
  }

  event.waitUntil(deleteOldCaches());
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') {
    return;
  }

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE_NAME);

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      const cachedResponse = await cache.match(url.pathname);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // for everything else, try the network first, but fall back to the cache if we're offline
    try {
      const response = await fetch(event.request);

      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (err) {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fallback to cached entry points if it's a navigation request and we're offline
      if (event.request.mode === 'navigate') {
        const fallbackResponse = (await cache.match('/app')) || (await cache.match('/'));
        if (fallbackResponse) {
          return fallbackResponse;
        }
      }

      throw err;
    }
  }

  event.respondWith(respond());
});
