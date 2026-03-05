import Memcached from 'memcached';

/**
 * Simple cache abstraction to allow for future horizontal scaling
 * (e.g. replacing MemoryCache with Redis)
 */
export interface ICache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, lifetime?: number): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Default in-memory implementation
 */
export class MemoryCache<T> implements ICache<T> {
  private cache = new Map<string, { value: T; expires?: number }>();

  async get(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: T, lifetime?: number): Promise<void> {
    const expires = lifetime ? Date.now() + lifetime * 1000 : undefined;
    this.cache.set(key, { value, expires });
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

/**
 * Memcached implementation with fallback to MemoryCache on failure
 */
export class MemcachedCache<T> implements ICache<T> {
  private client: Memcached | null = null;
  private fallbackCache = new MemoryCache<T>();
  private isConnected = false;

  constructor(
    serverLocations: string | string[] | Record<string, number> = '127.0.0.1:11211',
    options?: Memcached.options
  ) {
    try {
      this.client = new Memcached(serverLocations, {
        ...options,
        retries: 0, // Don't hang the build trying to reconnect
        retry: 100,
        timeout: 500
      });

      this.client.on('issue', (details) => {
        console.warn(`[Cache Warning] Memcached issue: ${details.server}`);
        this.isConnected = false;
      });

      this.client.on('failure', (details) => {
        console.warn(
          `[Cache Warning] Memcached failure: ${details.server}. Falling back to MemoryCache.`
        );
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.isConnected = false;
      });

      // Assume connected initially until an error occurs
      this.isConnected = true;
    } catch (e) {
      console.warn(
        '[Cache Warning] Failed to initialize Memcached. Falling back to MemoryCache.',
        e
      );
      this.client = null;
    }
  }

  async get(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return this.fallbackCache.get(key);
    }

    return new Promise((resolve) => {
      this.client!.get(key, (err, data) => {
        if (err) {
          console.warn(`[Cache Warning] Memcached get error for ${key}:`, err);
          // Fallback to memory cache on error
          this.fallbackCache.get(key).then(resolve);
          return;
        }
        resolve(data ? (data as T) : null);
      });
    });
  }

  async set(key: string, value: T, lifetime: number = 86400): Promise<void> {
    // Always set in fallback cache as backup
    await this.fallbackCache.set(key, value, lifetime);

    if (!this.client || !this.isConnected) {
      return;
    }

    return new Promise((resolve) => {
      this.client!.set(key, value, lifetime, (err) => {
        if (err) {
          console.warn(`[Cache Warning] Memcached set error for ${key}:`, err);
        }
        // Resolve anyway to not block the request
        resolve();
      });
    });
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

/**
 * Shared energy class cache instance.
 * Use MemcachedCache for production scaling or MemoryCache for simple environments.
 */
// export const energyCache = new MemoryCache<string>();
export const energyCache = new MemcachedCache<string>(
  process.env.MEMCACHED_URL || '127.0.0.1:11211'
);
