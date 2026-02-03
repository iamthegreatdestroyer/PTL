/**
 * Object type inference examples
 *
 * PTL infers object shapes from property access and usage patterns.
 */

// Object creation functions
function createUser(name, email, age) {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    email,
    age,
    createdAt: new Date(),
  };
}

function createProduct(title, price, inventory) {
  return {
    id: Math.random().toString(36).slice(2),
    title,
    price,
    inventory,
    isAvailable: inventory > 0,
  };
}

// Object transformation
function updateUser(user, updates) {
  return {
    ...user,
    ...updates,
    updatedAt: new Date(),
  };
}

function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

function omit(obj, keys) {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Nested object access
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
  return obj;
}

// Object validation
function hasRequiredFields(obj, fields) {
  return fields.every((field) => field in obj && obj[field] != null);
}

function validateUser(user) {
  const errors = [];

  if (!user.name || user.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!user.email || !user.email.includes('@')) {
    errors.push('Invalid email address');
  }

  if (user.age != null && (user.age < 0 || user.age > 150)) {
    errors.push('Age must be between 0 and 150');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Usage examples
const alice = createUser('Alice', 'alice@example.com', 30);
const laptop = createProduct('Laptop', 999.99, 50);

const updatedAlice = updateUser(alice, { name: 'Alice Smith' });
const publicUser = omit(alice, ['email']);
const userPreview = pick(alice, ['id', 'name']);

export {
  createUser,
  createProduct,
  updateUser,
  pick,
  omit,
  getNestedValue,
  setNestedValue,
  hasRequiredFields,
  validateUser,
  alice,
  laptop,
  updatedAlice,
  publicUser,
  userPreview,
};
