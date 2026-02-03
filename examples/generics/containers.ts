/**
 * Generic type inference examples
 *
 * PTL infers generic type parameters from usage patterns.
 */

// Generic identity function
function identity(value) {
  return value;
}

// Generic container
class Box {
  constructor(value) {
    this.value = value;
  }

  map(fn) {
    return new Box(fn(this.value));
  }

  flatMap(fn) {
    return fn(this.value);
  }

  getOrElse(defaultValue) {
    return this.value ?? defaultValue;
  }
}

// Generic data structures
class Stack {
  #items = [];

  push(item) {
    this.#items.push(item);
  }

  pop() {
    return this.#items.pop();
  }

  peek() {
    return this.#items[this.#items.length - 1];
  }

  isEmpty() {
    return this.#items.length === 0;
  }

  size() {
    return this.#items.length;
  }
}

class Queue {
  #items = [];

  enqueue(item) {
    this.#items.push(item);
  }

  dequeue() {
    return this.#items.shift();
  }

  front() {
    return this.#items[0];
  }

  isEmpty() {
    return this.#items.length === 0;
  }

  size() {
    return this.#items.length;
  }
}

// Generic tree structure
class TreeNode {
  constructor(value, children = []) {
    this.value = value;
    this.children = children;
  }

  addChild(child) {
    this.children.push(child);
    return this;
  }

  find(predicate) {
    if (predicate(this.value)) {
      return this;
    }
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) {
        return found;
      }
    }
    return null;
  }

  map(fn) {
    return new TreeNode(
      fn(this.value),
      this.children.map((child) => child.map(fn))
    );
  }

  reduce(fn, initial) {
    let acc = fn(initial, this.value);
    for (const child of this.children) {
      acc = child.reduce(fn, acc);
    }
    return acc;
  }
}

// Generic utility functions
function swap(pair) {
  return [pair[1], pair[0]];
}

function zip(array1, array2) {
  const length = Math.min(array1.length, array2.length);
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push([array1[i], array2[i]]);
  }
  return result;
}

function unzip(pairs) {
  const first = [];
  const second = [];
  for (const [a, b] of pairs) {
    first.push(a);
    second.push(b);
  }
  return [first, second];
}

function groupBy(array, keyFn) {
  const groups = new Map();
  for (const item of array) {
    const key = keyFn(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  return groups;
}

// Usage examples with inferred types
const numBox = new Box(42);
const strBox = numBox.map((n) => n.toString());

const numStack = new Stack();
numStack.push(1);
numStack.push(2);
const top = numStack.pop();

const pairs = zip([1, 2, 3], ['a', 'b', 'c']);
const [nums, strs] = unzip(pairs);

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' },
];
const byRole = groupBy(users, (u) => u.role);

export {
  identity,
  Box,
  Stack,
  Queue,
  TreeNode,
  swap,
  zip,
  unzip,
  groupBy,
  numBox,
  strBox,
  numStack,
  top,
  pairs,
  nums,
  strs,
  byRole,
};
