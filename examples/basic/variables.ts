/**
 * Basic variable inference examples
 *
 * PTL infers types from literal values with very high confidence.
 */

// Primitive literals - 99% confidence
const name = 'Alice';
const age = 30;
const active = true;
const nothing = null;
const missing = undefined;

// Array literals - 95%+ confidence
const numbers = [1, 2, 3, 4, 5];
const strings = ['hello', 'world'];
const mixed = [1, 'two', true]; // (number | string | boolean)[]

// Object literals - 90%+ confidence
const user = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  isAdmin: false,
};

// Nested objects - 85%+ confidence
const config = {
  server: {
    host: 'localhost',
    port: 3000,
  },
  database: {
    url: 'postgres://localhost/db',
    poolSize: 10,
  },
};

// Export for analysis
export { name, age, active, nothing, missing, numbers, strings, mixed, user, config };
