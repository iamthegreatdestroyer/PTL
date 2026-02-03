/**
 * Generic constraint inference examples
 *
 * PTL infers type constraints from usage patterns.
 */

// Comparable constraint
function max(a, b) {
  return a > b ? a : b;
}

function min(a, b) {
  return a < b ? a : b;
}

function clamp(value, minValue, maxValue) {
  return max(minValue, min(maxValue, value));
}

// Object key constraints
function getKeys(obj) {
  return Object.keys(obj);
}

function getValues(obj) {
  return Object.values(obj);
}

function getEntries(obj) {
  return Object.entries(obj);
}

function fromEntries(entries) {
  const result = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
}

// Array element constraints
function unique(array) {
  return [...new Set(array)];
}

function flatten(array) {
  const result = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Function constraints
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

function throttle(fn, wait) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      return fn.apply(this, args);
    }
  };
}

function debounce(fn, wait) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Nullable/Optional constraints
function isNullish(value) {
  return value === null || value === undefined;
}

function defaultTo(value, defaultValue) {
  return isNullish(value) ? defaultValue : value;
}

function compact(array) {
  return array.filter((item) => !isNullish(item));
}

// Type guard patterns
function isString(value) {
  return typeof value === 'string';
}

function isNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isArray(value) {
  return Array.isArray(value);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFunction(value) {
  return typeof value === 'function';
}

// Conditional type patterns
function processValue(value, onString, onNumber, onOther) {
  if (isString(value)) {
    return onString(value);
  }
  if (isNumber(value)) {
    return onNumber(value);
  }
  return onOther(value);
}

// Usage examples
const maxNum = max(10, 20);
const minNum = min(10, 20);
const clamped = clamp(15, 0, 10);

const arr = [1, 2, 2, 3, 3, 3];
const uniqueArr = unique(arr);
const chunked = chunk([1, 2, 3, 4, 5], 2);

const nested = [1, [2, 3], [[4, 5]]];
const flattened = flatten(nested);

export {
  max,
  min,
  clamp,
  getKeys,
  getValues,
  getEntries,
  fromEntries,
  unique,
  flatten,
  chunk,
  once,
  throttle,
  debounce,
  isNullish,
  defaultTo,
  compact,
  isString,
  isNumber,
  isArray,
  isObject,
  isFunction,
  processValue,
  maxNum,
  minNum,
  clamped,
  uniqueArr,
  chunked,
  flattened,
};
