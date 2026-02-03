/**
 * Function inference examples
 *
 * PTL infers function types from signatures, implementations, and usage.
 */

// Arrow functions
const square = (n) => n * n;
const double = (n) => n * 2;
const isPositive = (n) => n > 0;

// Higher-order functions
function map(array, fn) {
  const result = [];
  for (const item of array) {
    result.push(fn(item));
  }
  return result;
}

function filter(array, predicate) {
  const result = [];
  for (const item of array) {
    if (predicate(item)) {
      result.push(item);
    }
  }
  return result;
}

function reduce(array, fn, initial) {
  let accumulator = initial;
  for (const item of array) {
    accumulator = fn(accumulator, item);
  }
  return accumulator;
}

// Composition
function compose(f, g) {
  return (x) => f(g(x));
}

function pipe(value, ...fns) {
  return fns.reduce((acc, fn) => fn(acc), value);
}

// Currying
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

// Memoization
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Usage examples that help inference
const doubled = map([1, 2, 3], double);
const positives = filter([1, -2, 3, -4], isPositive);
const total = reduce([1, 2, 3, 4], (a, b) => a + b, 0);

const addThenSquare = compose(square, (n) => n + 1);
const result = pipe(5, double, square, (n) => n + 1);

export {
  square,
  double,
  isPositive,
  map,
  filter,
  reduce,
  compose,
  pipe,
  curry,
  memoize,
  doubled,
  positives,
  total,
  addThenSquare,
  result,
};
