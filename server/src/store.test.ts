import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryStore } from './store';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new MemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------- get / setex ---------------------------------------------------

  describe('get and setex', () => {
    it('returns null for a missing key', async () => {
      expect(await store.get('missing')).toBeNull();
    });

    it('stores and retrieves a value', async () => {
      await store.setex('k', 60, 'v');
      expect(await store.get('k')).toBe('v');
    });

    it('overwrites an existing value', async () => {
      await store.setex('k', 60, 'first');
      await store.setex('k', 60, 'second');
      expect(await store.get('k')).toBe('second');
    });
  });

  // ---------- TTL -----------------------------------------------------------

  describe('TTL expiration', () => {
    it('expires a key after the TTL elapses', async () => {
      await store.setex('k', 2, 'v');
      expect(await store.get('k')).toBe('v');

      // Advance just under the TTL — key should still be present
      vi.advanceTimersByTime(1999);
      expect(await store.get('k')).toBe('v');

      // Advance past the TTL
      vi.advanceTimersByTime(1);
      expect(await store.get('k')).toBeNull();
    });

    it('resets the TTL when overwriting a key', async () => {
      await store.setex('k', 2, 'v1');

      // Advance 1.5s, then overwrite with a new 2s TTL
      vi.advanceTimersByTime(1500);
      await store.setex('k', 2, 'v2');

      // 1.5s after the overwrite the original TTL would have expired,
      // but the key should still be alive because the TTL was reset
      vi.advanceTimersByTime(1500);
      expect(await store.get('k')).toBe('v2');

      // Now advance past the new TTL
      vi.advanceTimersByTime(500);
      expect(await store.get('k')).toBeNull();
    });

    it('clears the TTL when a key is deleted', async () => {
      await store.setex('k', 1, 'v');
      await store.del('k');

      // Re-create the key with a longer TTL
      await store.setex('k', 10, 'v2');

      // Advance past the original 1s TTL — key should still exist
      vi.advanceTimersByTime(1000);
      expect(await store.get('k')).toBe('v2');
    });
  });

  // ---------- del -----------------------------------------------------------

  describe('del', () => {
    it('deletes a string key', async () => {
      await store.setex('k', 60, 'v');
      await store.del('k');
      expect(await store.get('k')).toBeNull();
    });

    it('deletes a list key', async () => {
      await store.rpush('list', 'a', 'b');
      await store.del('list');
      expect(await store.llen('list')).toBe(0);
    });

    it('is a no-op for non-existent keys', async () => {
      await expect(store.del('nope')).resolves.toBeUndefined();
    });
  });

  // ---------- exists --------------------------------------------------------

  describe('exists', () => {
    it('returns 0 for missing keys', async () => {
      expect(await store.exists('missing')).toBe(0);
    });

    it('returns 1 for string keys', async () => {
      await store.setex('k', 60, 'v');
      expect(await store.exists('k')).toBe(1);
    });

    it('returns 1 for list keys', async () => {
      await store.rpush('list', 'a');
      expect(await store.exists('list')).toBe(1);
    });

    it('returns 0 after a key expires', async () => {
      await store.setex('k', 1, 'v');
      vi.advanceTimersByTime(1000);
      expect(await store.exists('k')).toBe(0);
    });
  });

  // ---------- list operations -----------------------------------------------

  describe('rpush / lrange / llen', () => {
    it('pushes values and reports the correct length', async () => {
      await store.rpush('q', 'a');
      await store.rpush('q', 'b', 'c');
      expect(await store.llen('q')).toBe(3);
    });

    it('returns all items with lrange(0, -1)', async () => {
      await store.rpush('q', 'a', 'b', 'c');
      expect(await store.lrange('q', 0, -1)).toEqual(['a', 'b', 'c']);
    });

    it('supports positive inclusive stop index', async () => {
      await store.rpush('q', 'a', 'b', 'c', 'd');
      expect(await store.lrange('q', 1, 2)).toEqual(['b', 'c']);
    });

    it('returns an empty array for a missing key', async () => {
      expect(await store.lrange('nope', 0, -1)).toEqual([]);
      expect(await store.llen('nope')).toBe(0);
    });
  });
});
