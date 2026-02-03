/**
 * Validation Utilities
 *
 * Type guards, assertions, and validation helpers.
 */

/**
 * Assert a condition is true
 *
 * @param condition - Condition to check
 * @param message - Error message
 * @throws Error if condition is false
 */
export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed');
  }
}

/**
 * Assert a value is not null or undefined
 *
 * @param value - Value to check
 * @param message - Error message
 * @returns The value
 * @throws Error if value is null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value is null or undefined');
  }
}

/**
 * Assert a condition is true, returning the value
 *
 * @param value - Value to check
 * @param message - Error message
 * @returns The value
 * @throws Error if value is null or undefined
 */
export function unwrap<T>(value: T | null | undefined, message?: string): T {
  assertDefined(value, message);
  return value;
}

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Check if a value is a finite number
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Check if a value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Check if a value is a valid probability (0-1)
 */
export function isProbability(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/**
 * Check if a string is a valid identifier
 */
export function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * Check if a string is a valid file path
 */
export function isValidFilePath(str: string): boolean {
  // Basic check - not empty, no null bytes
  return str.length > 0 && !str.includes('\0');
}

/**
 * Clamp a number to a range
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a probability to 0-1 range
 *
 * @param value - Value to normalize
 * @returns Normalized probability
 */
export function normalizeProbability(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 1);
}

/**
 * Validate configuration object against schema
 *
 * @param config - Configuration to validate
 * @param schema - Schema definition
 * @returns Validation result
 */
export function validateConfig<T extends Record<string, unknown>>(
  config: unknown,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required?: boolean;
      default?: T[K];
      validate?: (value: T[K]) => boolean;
    };
  }
): { valid: boolean; errors: string[]; config: T } {
  const errors: string[] = [];
  const result: Record<string, unknown> = {};

  if (!isObject(config)) {
    errors.push('Configuration must be an object');
    return { valid: false, errors, config: {} as T };
  }

  for (const [key, def] of Object.entries(schema)) {
    const value = config[key];

    if (value === undefined) {
      if (def.required && def.default === undefined) {
        errors.push(`Missing required field: ${key}`);
      } else if (def.default !== undefined) {
        result[key] = def.default;
      }
      continue;
    }

    // Type check
    let valid = false;
    switch (def.type) {
      case 'string':
        valid = isString(value);
        break;
      case 'number':
        valid = isNumber(value);
        break;
      case 'boolean':
        valid = isBoolean(value);
        break;
      case 'array':
        valid = isArray(value);
        break;
      case 'object':
        valid = isObject(value);
        break;
    }

    if (!valid) {
      errors.push(`Field ${key} must be of type ${def.type}`);
      continue;
    }

    // Custom validation
    if (def.validate && !def.validate(value as T[keyof T])) {
      errors.push(`Field ${key} failed validation`);
      continue;
    }

    result[key] = value;
  }

  return {
    valid: errors.length === 0,
    errors,
    config: result as T,
  };
}
