/**
 * Hash Utilities
 *
 * Fast hashing functions for cache keys and deduplication.
 */

/**
 * Simple string hash function (djb2)
 *
 * Fast and reasonably distributed for short strings.
 *
 * @param str - String to hash
 * @returns Hash value
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Hash a string to a hex string
 *
 * @param str - String to hash
 * @param length - Length of output (default: 8)
 * @returns Hex hash string
 */
export function hashToHex(str: string, length = 8): string {
  const hash = hashString(str);
  return hash.toString(16).padStart(length, '0').slice(0, length);
}

/**
 * Create a stable hash from an object
 *
 * @param obj - Object to hash
 * @returns Hash value
 */
export function hashObject(obj: unknown): number {
  return hashString(stableStringify(obj));
}

/**
 * Create a stable JSON string (sorted keys)
 *
 * @param obj - Object to stringify
 * @returns Stable JSON string
 */
export function stableStringify(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj !== 'object') return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify((obj as Record<string, unknown>)[key])}`
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Generate a unique ID
 *
 * @param prefix - Optional prefix
 * @returns Unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Create a symbol ID from file path and symbol name
 *
 * @param file - File path
 * @param name - Symbol name
 * @param scope - Optional scope path
 * @returns Symbol ID
 */
export function createSymbolId(file: string, name: string, scope?: string[]): string {
  const normalized = file.replace(/\\/g, '/');
  const scopePath = scope && scope.length > 0 ? scope.join('.') + '.' : '';
  return `${normalized}#${scopePath}${name}`;
}

/**
 * Parse a symbol ID
 *
 * @param symbolId - Symbol ID
 * @returns Parsed components
 */
export function parseSymbolId(symbolId: string): {
  file: string;
  name: string;
  scope: string[];
} {
  const [file = '', rest] = symbolId.split('#', 2);
  const parts = rest?.split('.') ?? [];
  const name = parts.pop() ?? '';
  return { file, name, scope: parts };
}
