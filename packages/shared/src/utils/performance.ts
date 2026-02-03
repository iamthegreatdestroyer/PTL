/**
 * Performance Utilities
 *
 * Timing, benchmarking, and performance measurement utilities.
 */

/**
 * High-resolution timer result
 */
export interface TimerResult {
  /** Duration in milliseconds */
  readonly ms: number;

  /** Duration in seconds */
  readonly seconds: number;

  /** Human-readable duration string */
  readonly formatted: string;
}

/**
 * Format duration in milliseconds
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Create a timer
 *
 * @returns Timer object with stop method
 */
export function createTimer(): { stop: () => TimerResult } {
  const start = performance.now();

  return {
    stop(): TimerResult {
      const end = performance.now();
      const ms = end - start;
      return {
        ms,
        seconds: ms / 1000,
        formatted: formatDuration(ms),
      };
    },
  };
}

/**
 * Measure execution time of a function
 *
 * @param fn - Function to measure
 * @returns Result and timing
 */
export function measure<T>(fn: () => T): { result: T; time: TimerResult } {
  const timer = createTimer();
  const result = fn();
  const time = timer.stop();
  return { result, time };
}

/**
 * Measure execution time of an async function
 *
 * @param fn - Async function to measure
 * @returns Result and timing
 */
export async function measureAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; time: TimerResult }> {
  const timer = createTimer();
  const result = await fn();
  const time = timer.stop();
  return { result, time };
}

/**
 * Benchmark a function
 *
 * @param name - Benchmark name
 * @param fn - Function to benchmark
 * @param options - Benchmark options
 * @returns Benchmark results
 */
export function benchmark(
  name: string,
  fn: () => void,
  options?: {
    /** Number of iterations */
    iterations?: number;
    /** Warmup iterations */
    warmup?: number;
  }
): {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSecond: number;
} {
  const { iterations = 1000, warmup = 10 } = options ?? {};

  // Warmup
  for (let i = 0; i < warmup; i++) {
    fn();
  }

  // Benchmark
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const totalMs = times.reduce((a, b) => a + b, 0);
  const avgMs = totalMs / iterations;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  const opsPerSecond = 1000 / avgMs;

  return {
    name,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    opsPerSecond,
  };
}

/**
 * Debounce a function
 *
 * @param fn - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced as T & { cancel: () => void };
}

/**
 * Throttle a function
 *
 * @param fn - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): T {
  let lastCall = 0;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      lastResult = fn(...args) as ReturnType<T>;
    }
    return lastResult;
  }) as T;
}

/**
 * Rate limit async function calls
 *
 * @param fn - Async function to rate limit
 * @param limit - Maximum calls per second
 * @returns Rate-limited function
 */
export function rateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  limit: number
): T {
  const minInterval = 1000 / limit;
  let lastCall = 0;
  let queue: Array<{
    args: Parameters<T>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  let processing = false;

  const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
      const elapsed = Date.now() - lastCall;
      if (elapsed < minInterval) {
        await new Promise((resolve) => setTimeout(resolve, minInterval - elapsed));
      }

      const item = queue.shift()!;
      lastCall = Date.now();

      try {
        const result = await fn(...item.args);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    processing = false;
  };

  return ((...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      processQueue();
    });
  }) as T;
}
