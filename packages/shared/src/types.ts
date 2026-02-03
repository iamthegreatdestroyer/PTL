/**
 * Shared Type Definitions
 *
 * Common types used across all PTL packages.
 *
 * @packageDocumentation
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Unique identifier type
 */
export type Id = string;

/**
 * Timestamp in milliseconds since epoch
 */
export type Timestamp = number;

/**
 * A probability value between 0 and 1
 */
export type Probability = number;

/**
 * A confidence value between 0 and 1
 */
export type Confidence = number;

// =============================================================================
// Result Types
// =============================================================================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Create a success result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Check if a result is ok
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Check if a result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

// =============================================================================
// Option Types
// =============================================================================

/**
 * Option type for values that may not exist
 */
export type Option<T> =
  | { readonly some: true; readonly value: T }
  | { readonly some: false };

/**
 * Create a some option
 */
export function some<T>(value: T): Option<T> {
  return { some: true, value };
}

/**
 * Create a none option
 */
export function none<T = never>(): Option<T> {
  return { some: false };
}

/**
 * Check if an option has a value
 */
export function isSome<T>(option: Option<T>): option is { some: true; value: T } {
  return option.some;
}

/**
 * Check if an option is empty
 */
export function isNone<T>(option: Option<T>): option is { some: false } {
  return !option.some;
}

// =============================================================================
// Source Location Types
// =============================================================================

/**
 * Position in a source file
 */
export interface Position {
  /** Line number (1-indexed) */
  readonly line: number;

  /** Column number (1-indexed) */
  readonly column: number;

  /** Character offset from start of file (0-indexed) */
  readonly offset: number;
}

/**
 * Range in a source file
 */
export interface Range {
  /** Start position */
  readonly start: Position;

  /** End position */
  readonly end: Position;
}

/**
 * Location in a source file
 */
export interface Location {
  /** File path */
  readonly file: string;

  /** Range in the file */
  readonly range: Range;
}

// =============================================================================
// Diagnostic Types
// =============================================================================

/**
 * Severity level for diagnostics
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

/**
 * A diagnostic message
 */
export interface Diagnostic {
  /** Diagnostic code */
  readonly code: string;

  /** Human-readable message */
  readonly message: string;

  /** Severity level */
  readonly severity: DiagnosticSeverity;

  /** Location in source */
  readonly location?: Location;

  /** Related information */
  readonly relatedInformation?: ReadonlyArray<{
    readonly location: Location;
    readonly message: string;
  }>;

  /** Suggested fixes */
  readonly fixes?: ReadonlyArray<{
    readonly title: string;
    readonly edits: ReadonlyArray<{
      readonly range: Range;
      readonly newText: string;
    }>;
  }>;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Log level
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Logger interface
 */
export interface Logger {
  trace(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Event handler type
 */
export type EventHandler<T> = (event: T) => void;

/**
 * Disposable resource
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Event emitter interface
 */
export interface EventEmitter<T> {
  on(handler: EventHandler<T>): Disposable;
  off(handler: EventHandler<T>): void;
  emit(event: T): void;
}

// =============================================================================
// Serialization Types
// =============================================================================

/**
 * JSON-serializable value
 */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Serializable interface
 */
export interface Serializable {
  toJSON(): JsonValue;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Required keys of a type
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

/**
 * Optional keys of a type
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

/**
 * Brand type for nominal typing
 */
export type Brand<T, B> = T & { readonly __brand: B };
