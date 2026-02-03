/**
 * Basic parameter inference examples
 *
 * PTL uses usage patterns and naming conventions to infer parameter types.
 */

// String operations provide strong evidence
function greet(name) {
  return 'Hello, ' + name + '!';
}

// Template literals also indicate strings
function formatGreeting(firstName, lastName) {
  return `Hello, ${firstName} ${lastName}!`;
}

// Arithmetic operators indicate numbers
function add(a, b) {
  return a + b;
}

function multiply(x, y) {
  return x * y;
}

function divide(numerator, denominator) {
  if (denominator === 0) {
    throw new Error('Division by zero');
  }
  return numerator / denominator;
}

// Boolean operations
function and(left, right) {
  return left && right;
}

function negate(value) {
  return !value;
}

// Array operations
function first(array) {
  return array[0];
}

function length(array) {
  return array.length;
}

function sum(numbers) {
  let total = 0;
  for (const n of numbers) {
    total += n;
  }
  return total;
}

// Object operations
function getName(user) {
  return user.name;
}

function getProperty(obj, key) {
  return obj[key];
}

// Export for analysis
export {
  greet,
  formatGreeting,
  add,
  multiply,
  divide,
  and,
  negate,
  first,
  length,
  sum,
  getName,
  getProperty,
};
