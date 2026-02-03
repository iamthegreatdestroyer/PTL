/**
 * Memoization Utilities
 *
 * Caching decorators and functions for expensive computations.
 */

/**
 * Memoize a single-argument function
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 */
export function memoize<T, R>(
  fn: (arg: T) => R,
  options?: {
    /** Maximum cache size */
    maxSize?: number;
    /** Key function for non-primitive arguments */
    keyFn?: (arg: T) => string;
    /** TTL in milliseconds */
    ttl?: number;
  }
): ((arg: T) => R) & { cache: Map<unknown, { value: R; timestamp: number }> } {
  const { maxSize = 1000, keyFn, ttl } = options ?? {};
  const cache = new Map<unknown, { value: R; timestamp: number }>();

  const memoized = (arg: T): R => {
    const key = keyFn ? keyFn(arg) : arg;
    const now = Date.now();

    const cached = cache.get(key);
    if (cached) {
      if (ttl && now - cached.timestamp > ttl) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    const result = fn(arg);

    // Evict oldest entries if over size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { value: result, timestamp: now });
    return result;
  };

  memoized.cache = cache;
  return memoized;
}

/**
 * Memoize a multi-argument function
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 */
export function memoizeMulti<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  options?: {
    /** Maximum cache size */
    maxSize?: number;
    /** Key function */
    keyFn?: (...args: Args) => string;
  }
): ((...args: Args) => R) & { cache: Map<string, R> } {
  const { maxSize = 1000, keyFn } = options ?? {};
  const cache = new Map<string, R>();

  const memoized = (...args: Args): R => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, result);
    return result;
  };

  memoized.cache = cache;
  return memoized;
}

/**
 * Memoize an async function
 *
 * @param fn - Async function to memoize
 * @param options - Memoization options
 * @returns Memoized async function
 */
export function memoizeAsync<T, R>(
  fn: (arg: T) => Promise<R>,
  options?: {
    /** Maximum cache size */
    maxSize?: number;
    /** Key function */
    keyFn?: (arg: T) => string;
    /** TTL in milliseconds */
    ttl?: number;
  }
): ((arg: T) => Promise<R>) & { cache: Map<unknown, { value: R; timestamp: number }> } {
  const { maxSize = 1000, keyFn, ttl } = options ?? {};
  const cache = new Map<unknown, { value: R; timestamp: number }>();
  const pending = new Map<unknown, Promise<R>>();

  const memoized = async (arg: T): Promise<R> => {
    const key = keyFn ? keyFn(arg) : arg;
    const now = Date.now();

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      if (ttl && now - cached.timestamp > ttl) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    // Check pending
    const pendingPromise = pending.get(key);
    if (pendingPromise) {
      return pendingPromise;
    }

    // Execute and cache
    const promise = fn(arg).then((result) => {
      pending.delete(key);

      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }

      cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    });

    pending.set(key, promise);
    return promise;
  };

  memoized.cache = cache;
  return memoized;
}

/**
 * Create a lazy value
 *
 * @param factory - Factory function
 * @returns Lazy value getter
 */
export function lazy<T>(factory: () => T): () => T {
  let cached: T | undefined;
  let computed = false;

  return () => {
    if (!computed) {
      cached = factory();
      computed = true;
    }
    return cached!;
  };
}

/**
 * Create a lazy async value
 *
 * @param factory - Async factory function
 * @returns Lazy async value getter
 */
export function lazyAsync<T>(factory: () => Promise<T>): () => Promise<T> {
  let cached: T | undefined;
  let pending: Promise<T> | undefined;
  let computed = false;

  return async () => {
    if (computed) {
      return cached!;
    }

    if (pending) {
      return pending;
    }

    pending = factory().then((value) => {
      cached = value;
      computed = true;
      pending = undefined;
      return value;
    });

    return pending;
  };
}
