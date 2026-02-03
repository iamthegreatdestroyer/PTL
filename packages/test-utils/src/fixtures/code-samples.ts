/**
 * Code sample fixtures for testing
 */

/**
 * Simple variable declarations
 */
export const VARIABLE_SAMPLES = {
  primitives: `
const name = "Alice";
const age = 30;
const active = true;
const nothing = null;
`,
  arrays: `
const numbers = [1, 2, 3, 4, 5];
const strings = ["hello", "world"];
const mixed = [1, "two", true];
`,
  objects: `
const user = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};
`,
  nested: `
const config = {
  server: {
    host: "localhost",
    port: 3000
  },
  database: {
    url: "postgres://localhost/db"
  }
};
`,
};

/**
 * Function declaration samples
 */
export const FUNCTION_SAMPLES = {
  simpleArithmetic: `
function add(a, b) {
  return a + b;
}
`,
  stringOperations: `
function greet(name) {
  return "Hello, " + name + "!";
}
`,
  higherOrder: `
function map(array, fn) {
  const result = [];
  for (const item of array) {
    result.push(fn(item));
  }
  return result;
}
`,
  async: `
async function fetchData(url) {
  const response = await fetch(url);
  return await response.json();
}
`,
  generic: `
function identity(value) {
  return value;
}
`,
};

/**
 * Class declaration samples
 */
export const CLASS_SAMPLES = {
  simple: `
class Counter {
  count = 0;
  
  increment() {
    this.count++;
  }
  
  decrement() {
    this.count--;
  }
  
  getCount() {
    return this.count;
  }
}
`,
  withConstructor: `
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  
  getDisplayName() {
    return this.name;
  }
}
`,
  inheritance: `
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    return this.name + " makes a sound";
  }
}

class Dog extends Animal {
  speak() {
    return this.name + " barks";
  }
}
`,
};

/**
 * Edge case samples
 */
export const EDGE_CASES = {
  ambiguousPlus: `
function process(a, b) {
  return a + b;
}
`,
  multipleReturns: `
function getValue(condition) {
  if (condition) {
    return "yes";
  } else {
    return 42;
  }
}
`,
  recursion: `
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
`,
  closures: `
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    get: () => count
  };
}
`,
};

/**
 * React component samples
 */
export const REACT_SAMPLES = {
  functional: `
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}
`,
  withHooks: `
function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
`,
  customHook: `
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}
`,
};
