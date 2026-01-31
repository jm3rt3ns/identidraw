/**
 * Unified key-value store interface.
 *
 * Two backends are available:
 *   - "memory" (default) – in-process Map with TTL support, zero dependencies.
 *   - "redis"            – ioredis-backed, for multi-instance deployments.
 *
 * Set the STORE_TYPE env var to choose ("memory" | "redis").
 */

import { config } from './config';

// ---------------------------------------------------------------------------
// Interface – matches the subset of Redis commands used by the managers.
// ---------------------------------------------------------------------------

export interface Store {
  get(key: string): Promise<string | null>;
  setex(key: string, ttlSeconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<number>;

  // List operations (used by matchmaking queue)
  rpush(key: string, ...values: string[]): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// In-memory implementation
// ---------------------------------------------------------------------------

export class MemoryStore implements Store {
  private data = new Map<string, string>();
  private lists = new Map<string, string[]>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    this.data.set(key, value);
    this.resetTTL(key, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
    this.lists.delete(key);
    this.clearTTL(key);
  }

  async exists(key: string): Promise<number> {
    return this.data.has(key) || this.lists.has(key) ? 1 : 0;
  }

  async rpush(key: string, ...values: string[]): Promise<void> {
    const list = this.lists.get(key) ?? [];
    list.push(...values);
    this.lists.set(key, list);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) ?? [];
    // Redis lrange is inclusive on both ends; -1 means "to the end"
    const end = stop < 0 ? list.length + stop + 1 : stop + 1;
    return list.slice(start, end);
  }

  async llen(key: string): Promise<number> {
    return (this.lists.get(key) ?? []).length;
  }

  // -- TTL helpers ----------------------------------------------------------

  private resetTTL(key: string, ttlSeconds: number): void {
    this.clearTTL(key);
    const timer = setTimeout(() => {
      this.data.delete(key);
      this.timers.delete(key);
    }, ttlSeconds * 1000);
    // Allow the Node process to exit even if timers are pending
    timer.unref();
    this.timers.set(key, timer);
  }

  private clearTTL(key: string): void {
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Redis implementation (thin wrapper so ioredis remains an optional dep)
// ---------------------------------------------------------------------------

class RedisStore implements Store {
  private client: any; // ioredis instance

  constructor(url: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis');
      this.client = new Redis(url);
      this.client.on('error', (err: Error) =>
        console.error('Redis connection error:', err)
      );
      this.client.on('connect', () => console.log('Connected to Redis'));
    } catch {
      throw new Error(
        'ioredis is not installed. Run `npm install ioredis` or set STORE_TYPE=memory.'
      );
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async rpush(key: string, ...values: string[]): Promise<void> {
    await this.client.rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

function createStore(): Store {
  if (config.storeType === 'redis') {
    console.log('Using Redis store');
    return new RedisStore(config.redisUrl);
  }
  console.log('Using in-memory store');
  return new MemoryStore();
}

export const store: Store = createStore();
