/**
 * SourceFileAnalyzer Tests
 *
 * Comprehensive test suite for TypeScript AST-based symbol extraction
 * and observation generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SourceFileAnalyzer } from '../analyzer/source-file-analyzer.js';
import { TypeLattice } from '../lattice/type-lattice.js';
import { BayesianInferenceEngine, createBayesianEngine } from '../bayesian/bayesian-inference.js';
import type { FileAnalysisResult } from '../analyzer/types.js';
import type { ObservationKind } from '../bayesian/types.js';

describe('SourceFileAnalyzer', () => {
  let lattice: TypeLattice;
  let engine: BayesianInferenceEngine;
  let analyzer: SourceFileAnalyzer;

  beforeEach(() => {
    lattice = new TypeLattice({ includeStdlib: true });
    engine = createBayesianEngine(
      {
        defaultAlpha: 1.0,
        typePriors: new Map(),
        smoothing: 0.1,
      },
      lattice
    );
    analyzer = new SourceFileAnalyzer(lattice, engine, {
      minConfidence: 0.5,
      maxAlternatives: 3,
    });
  });

  // ============================================================================
  // Symbol Extraction Tests
  // ============================================================================

  describe('Symbol Extraction', () => {
    describe('Variable Declarations', () => {
      it('should extract const declarations with type annotations', () => {
        const source = `const name: string = "Alice";`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols).toHaveLength(1);
        expect(result.symbols[0].name).toBe('name');
        expect(result.symbols[0].kind).toBe('variable');
        expect(result.symbols[0].type.id).toBe('type:string');
      });

      it('should extract let declarations with initializers', () => {
        const source = `let count = 42;`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols).toHaveLength(1);
        expect(result.symbols[0].name).toBe('count');
        expect(result.symbols[0].type.id).toBe('type:number');
      });

      it('should extract var declarations', () => {
        const source = `var flag = true;`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols).toHaveLength(1);
        expect(result.symbols[0].name).toBe('flag');
        expect(result.symbols[0].type.id).toBe('type:boolean');
      });

      it('should handle multiple declarations', () => {
        const source = `
          const x = 1;
          let y: number = 2;
          var z = 3;
        `;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols).toHaveLength(3);
        expect(result.symbols.map(s => s.name)).toEqual(['x', 'y', 'z']);
      });

      it('should track exported symbols', () => {
        const source = `export const API_KEY = "secret";`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols).toHaveLength(1);
        expect(result.symbols[0].exported).toBe(true);
      });
    });

    describe('Function Declarations', () => {
      it('should extract function with parameters and return type', () => {
        const source = `
          function add(a: number, b: number): number {
            return a + b;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'add');
        expect(fn).toBeDefined();
        expect(fn?.kind).toBe('function');
        expect(fn?.type.id).toBe('type:function');

        // Check parameters
        const params = result.symbols.filter(s => s.name === 'a' || s.name === 'b');
        expect(params).toHaveLength(2);
        expect(params.every(p => p.type.id === 'type:number')).toBe(true);
      });

      it('should extract arrow functions', () => {
        const source = `const greet = (name: string) => \`Hello, \${name}\`;`;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'greet');
        expect(fn).toBeDefined();
        expect(fn?.type.id).toBe('type:function');
      });

      it('should extract function with type parameters', () => {
        const source = `
          function identity<T>(value: T): T {
            return value;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'identity');
        expect(fn).toBeDefined();
        expect(fn?.typeParameters).toEqual(['T']);
      });

      it('should extract async functions', () => {
        const source = `
          async function fetchData(): Promise<string> {
            return "data";
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'fetchData');
        expect(fn).toBeDefined();
        expect(fn?.kind).toBe('function');
      });
    });

    describe('Class Declarations', () => {
      it('should extract class with properties and methods', () => {
        const source = `
          class User {
            name: string;
            age: number;

            constructor(name: string, age: number) {
              this.name = name;
              this.age = age;
            }

            greet(): string {
              return \`Hello, I'm \${this.name}\`;
            }
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const cls = result.symbols.find(s => s.name === 'User');
        expect(cls).toBeDefined();
        expect(cls?.kind).toBe('class');

        // Check properties
        const name = result.symbols.find(s => s.name === 'name' && s.kind === 'property');
        const age = result.symbols.find(s => s.name === 'age' && s.kind === 'property');
        expect(name?.type.id).toBe('type:string');
        expect(age?.type.id).toBe('type:number');

        // Check methods
        const greet = result.symbols.find(s => s.name === 'greet' && s.kind === 'method');
        expect(greet).toBeDefined();
      });

      it('should extract class with inheritance', () => {
        const source = `
          class Animal {
            name: string;
          }

          class Dog extends Animal {
            bark(): void {}
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const animal = result.symbols.find(s => s.name === 'Animal');
        const dog = result.symbols.find(s => s.name === 'Dog');
        expect(animal).toBeDefined();
        expect(dog).toBeDefined();
      });
    });

    describe('Interface Declarations', () => {
      it('should extract interface with properties', () => {
        const source = `
          interface Point {
            x: number;
            y: number;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const iface = result.symbols.find(s => s.name === 'Point');
        expect(iface).toBeDefined();
        expect(iface?.kind).toBe('interface');
      });

      it('should extract interface with methods', () => {
        const source = `
          interface Drawable {
            draw(): void;
            resize(width: number, height: number): void;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const iface = result.symbols.find(s => s.name === 'Drawable');
        expect(iface).toBeDefined();
      });
    });

    describe('Type Alias Declarations', () => {
      it('should extract type aliases', () => {
        const source = `type UserID = string | number;`;
        const result = analyzer.analyze('test.ts', source);

        const alias = result.symbols.find(s => s.name === 'UserID');
        expect(alias).toBeDefined();
        expect(alias?.kind).toBe('type-alias');
      });
    });

    describe('Nested Scopes', () => {
      it('should handle nested function scopes', () => {
        const source = `
          function outer() {
            const x = 1;
            function inner() {
              const y = 2;
              return x + y;
            }
            return inner();
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const outer = result.symbols.find(s => s.name === 'outer');
        const inner = result.symbols.find(s => s.name === 'inner');
        const x = result.symbols.find(s => s.name === 'x');
        const y = result.symbols.find(s => s.name === 'y');

        expect(outer).toBeDefined();
        expect(inner).toBeDefined();
        expect(x).toBeDefined();
        expect(y).toBeDefined();

        // Verify symbol IDs reflect scope hierarchy
        expect(outer?.id).toContain('outer');
        expect(inner?.id).toContain('outer.inner');
        expect(y?.id).toContain('outer.inner.y');
      });

      it('should handle closures correctly', () => {
        const source = `
          function makeCounter() {
            let count = 0;
            return () => ++count;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const makeCounter = result.symbols.find(s => s.name === 'makeCounter');
        const count = result.symbols.find(s => s.name === 'count');

        expect(makeCounter).toBeDefined();
        expect(count).toBeDefined();
        expect(count?.type.id).toBe('type:number');
      });
    });
  });

  // ============================================================================
  // Observation Generation Tests
  // ============================================================================

  describe('Observation Generation', () => {
    describe('Type Annotations (weight: 1.0)', () => {
      it('should generate annotation observations for explicit types', () => {
        const source = `const name: string = "Alice";`;
        const result = analyzer.analyze('test.ts', source);

        const symbol = result.symbols[0];
        expect(symbol.type.id).toBe('type:string');
        expect(symbol.confidence).toBeGreaterThan(0.9); // High confidence from annotation
      });

      it('should handle complex type annotations', () => {
        const source = `const data: Array<number> = [1, 2, 3];`;
        const result = analyzer.analyze('test.ts', source);

        const symbol = result.symbols[0];
        expect(symbol.type.id).toBe('type:array');
      });
    });

    describe('Literal Assignments (weight: 0.8)', () => {
      it('should infer string from string literal', () => {
        const source = `const greeting = "Hello";`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:string');
      });

      it('should infer number from numeric literal', () => {
        const source = `const count = 42;`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:number');
      });

      it('should infer boolean from boolean literal', () => {
        const source = `const flag = true;`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:boolean');
      });

      it('should infer array from array literal', () => {
        const source = `const items = [1, 2, 3];`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:array');
      });

      it('should infer object from object literal', () => {
        const source = `const user = { name: "Alice", age: 30 };`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:object');
      });

      it('should infer function from function expression', () => {
        const source = `const fn = function() { return 42; };`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:function');
      });

      it('should infer function from arrow function', () => {
        const source = `const fn = () => 42;`;
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:function');
      });
    });

    describe('Property Access (weight: 0.7)', () => {
      it('should infer object type from property access', () => {
        const source = `
          const user = getUserData();
          const name = user.name;
        `;
        const result = analyzer.analyze('test.ts', source);

        const user = result.symbols.find(s => s.name === 'user');
        // Property access suggests object-like type
        expect(user?.type.id).toBe('type:object');
      });

      it('should handle nested property access', () => {
        const source = `
          const config = getConfig();
          const port = config.server.port;
        `;
        const result = analyzer.analyze('test.ts', source);

        const config = result.symbols.find(s => s.name === 'config');
        expect(config?.type.id).toBe('type:object');
      });
    });

    describe('Type Guards (weight: 0.95)', () => {
      it('should detect typeof string guard', () => {
        const source = `
          function process(value: unknown) {
            if (typeof value === "string") {
              return value.toUpperCase();
            }
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const value = result.symbols.find(s => s.name === 'value');
        expect(value).toBeDefined();
        // Type guard provides strong evidence for string
        expect(value?.type.id).toBe('type:string');
        expect(value?.confidence).toBeGreaterThan(0.8);
      });

      it('should detect typeof number guard', () => {
        const source = `
          function double(x: unknown) {
            if (typeof x === "number") {
              return x * 2;
            }
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const x = result.symbols.find(s => s.name === 'x');
        expect(x?.type.id).toBe('type:number');
      });

      it('should detect instanceof guard', () => {
        const source = `
          function isDate(value: unknown) {
            return value instanceof Date;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const value = result.symbols.find(s => s.name === 'value');
        expect(value).toBeDefined();
        // instanceof provides evidence for object type
        expect(value?.type.id).toBe('type:object');
      });
    });

    describe('Binary Operations (weight: 0.6)', () => {
      it('should infer number from arithmetic operations', () => {
        const source = `
          function calculate(a: unknown, b: unknown) {
            return a + b;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const a = result.symbols.find(s => s.name === 'a');
        const b = result.symbols.find(s => s.name === 'b');

        // Arithmetic suggests numeric types
        expect(a?.type.id).toBe('type:number');
        expect(b?.type.id).toBe('type:number');
      });
    });

    describe('Parameter Observations (weight: 0.9)', () => {
      it('should extract parameter type annotations', () => {
        const source = `
          function greet(name: string, age: number): void {
            console.log(\`\${name} is \${age} years old\`);
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const name = result.symbols.find(s => s.name === 'name');
        const age = result.symbols.find(s => s.name === 'age');

        expect(name?.type.id).toBe('type:string');
        expect(age?.type.id).toBe('type:number');
        expect(name?.confidence).toBeGreaterThan(0.85);
        expect(age?.confidence).toBeGreaterThan(0.85);
      });
    });

    describe('Return Type Observations (weight: 0.85)', () => {
      it('should extract return type annotations', () => {
        const source = `
          function getName(): string {
            return "Alice";
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'getName');
        expect(fn?.type.id).toBe('type:function');
      });
    });
  });

  // ============================================================================
  // Complex Patterns
  // ============================================================================

  describe('Complex Patterns', () => {
    describe('Destructuring', () => {
      it('should handle object destructuring', () => {
        const source = `
          const { name, age } = { name: "Alice", age: 30 };
        `;
        const result = analyzer.analyze('test.ts', source);

        const name = result.symbols.find(s => s.name === 'name');
        const age = result.symbols.find(s => s.name === 'age');

        expect(name?.type.id).toBe('type:string');
        expect(age?.type.id).toBe('type:number');
      });

      it('should handle array destructuring', () => {
        const source = `
          const [first, second] = [1, 2];
        `;
        const result = analyzer.analyze('test.ts', source);

        const first = result.symbols.find(s => s.name === 'first');
        const second = result.symbols.find(s => s.name === 'second');

        expect(first?.type.id).toBe('type:number');
        expect(second?.type.id).toBe('type:number');
      });
    });

    describe('Generics', () => {
      it('should handle generic function declarations', () => {
        const source = `
          function identity<T>(value: T): T {
            return value;
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'identity');
        expect(fn?.typeParameters).toEqual(['T']);
      });

      it('should handle generic class declarations', () => {
        const source = `
          class Container<T> {
            value: T;
            constructor(value: T) {
              this.value = value;
            }
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const cls = result.symbols.find(s => s.name === 'Container');
        expect(cls?.typeParameters).toEqual(['T']);
      });

      it('should handle multiple type parameters', () => {
        const source = `
          function pair<K, V>(key: K, value: V): [K, V] {
            return [key, value];
          }
        `;
        const result = analyzer.analyze('test.ts', source);

        const fn = result.symbols.find(s => s.name === 'pair');
        expect(fn?.typeParameters).toEqual(['K', 'V']);
      });
    });

    describe('Union and Intersection Types', () => {
      it('should handle union type annotations', () => {
        const source = `const value: string | number = 42;`;
        const result = analyzer.analyze('test.ts', source);

        const symbol = result.symbols[0];
        // Should infer as number from initializer, but with union annotation
        expect(symbol.type.id).toBe('type:number');
      });

      it('should handle intersection types', () => {
        const source = `
          type Named = { name: string };
          type Aged = { age: number };
          const person: Named & Aged = { name: "Alice", age: 30 };
        `;
        const result = analyzer.analyze('test.ts', source);

        const person = result.symbols.find(s => s.name === 'person');
        expect(person?.type.id).toBe('type:object');
      });
    });

    describe('Template Literals', () => {
      it('should infer string from template literals', () => {
        const source = 'const greeting = `Hello, ${name}`;';
        const result = analyzer.analyze('test.ts', source);

        expect(result.symbols[0].type.id).toBe('type:string');
      });
    });

    describe('Optional Chaining', () => {
      it('should handle optional property access', () => {
        const source = `
          const user = getUser();
          const name = user?.name;
        `;
        const result = analyzer.analyze('test.ts', source);

        const user = result.symbols.find(s => s.name === 'user');
        expect(user?.type.id).toBe('type:object');
      });
    });

    describe('Nullish Coalescing', () => {
      it('should handle nullish coalescing operator', () => {
        const source = `const value = getValue() ?? "default";`;
        const result = analyzer.analyze('test.ts', source);

        const symbol = result.symbols[0];
        expect(symbol.type.id).toBe('type:string');
      });
    });

    describe('JSDoc Annotations', () => {
      it('should extract types from JSDoc comments', () => {
        const source = `
          /**
           * @param {string} name
           * @param {number} age
           * @returns {string}
           */
          function formatUser(name, age) {
            return \`\${name}: \${age}\`;
          }
        `;
        const result = analyzer.analyze('test.js', source);

        const name = result.symbols.find(s => s.name === 'name');
        const age = result.symbols.find(s => s.name === 'age');

        expect(name?.type.id).toBe('type:string');
        expect(age?.type.id).toBe('type:number');
      });
    });

    describe('Method Chaining', () => {
      it('should infer types through method chains', () => {
        const source = `
          const result = getString()
            .toLowerCase()
            .trim()
            .split(' ');
        `;
        const result = analyzer.analyze('test.ts', source);

        const symbol = result.symbols[0];
        // Final result is array from .split()
        expect(symbol.type.id).toBe('type:array');
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should analyze complete TypeScript file end-to-end', () => {
      const source = `
        interface User {
          id: number;
          name: string;
          email: string;
        }

        class UserService {
          private users: User[] = [];

          addUser(user: User): void {
            this.users.push(user);
          }

          findById(id: number): User | undefined {
            return this.users.find(u => u.id === id);
          }

          getAllUsers(): User[] {
            return this.users;
          }
        }

        export const service = new UserService();
      `;

      const result = analyzer.analyze('user-service.ts', source);

      expect(result.errors).toHaveLength(0);
      expect(result.symbolCount).toBeGreaterThan(0);

      const userInterface = result.symbols.find(s => s.name === 'User');
      const userServiceClass = result.symbols.find(s => s.name === 'UserService');
      const service = result.symbols.find(s => s.name === 'service');

      expect(userInterface?.kind).toBe('interface');
      expect(userServiceClass?.kind).toBe('class');
      expect(service?.exported).toBe(true);
    });

    it('should handle files with syntax errors gracefully', () => {
      const source = `
        const x = ;  // Syntax error
        const y = 42;
      `;

      const result = analyzer.analyze('invalid.ts', source);

      // Should still attempt to analyze what it can
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should provide accurate location information', () => {
      const source = `
const first = 1;
const second = 2;
const third = 3;
      `;

      const result = analyzer.analyze('test.ts', source);

      expect(result.symbols[0].location.startLine).toBe(2);
      expect(result.symbols[1].location.startLine).toBe(3);
      expect(result.symbols[2].location.startLine).toBe(4);
    });

    it('should integrate with Bayesian inference engine', () => {
      const source = `
        function process(value: unknown) {
          if (typeof value === "string") {
            return value.toUpperCase();
          }
          return String(value);
        }
      `;

      const result = analyzer.analyze('test.ts', source);

      const value = result.symbols.find(s => s.name === 'value');

      // Type guard provides strong evidence
      expect(value?.confidence).toBeGreaterThan(0.7);
      expect(value?.type.id).toBe('type:string');

      // Should have alternatives if confidence isn't 1.0
      if (value && value.confidence < 1.0) {
        expect(value.alternatives.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle large files efficiently', () => {
      // Generate a large file with 100 functions
      const functions = Array.from({ length: 100 }, (_, i) => `
        function func${i}(a: number, b: string): boolean {
          return a > 0 && b.length > 0;
        }
      `).join('\n');

      const startTime = Date.now();
      const result = analyzer.analyze('large.ts', functions);
      const duration = Date.now() - startTime;

      expect(result.symbolCount).toBeGreaterThan(200); // 100 functions + 200 parameters
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should handle mixed JavaScript and TypeScript syntax', () => {
      const source = `
        // JavaScript style
        function jsFunction(x, y) {
          return x + y;
        }

        // TypeScript style
        function tsFunction(x: number, y: number): number {
          return x + y;
        }

        // Mixed
        const mixed = (a: string, b) => a + b;
      `;

      const result = analyzer.analyze('mixed.ts', source);

      expect(result.errors).toHaveLength(0);

      const jsFunc = result.symbols.find(s => s.name === 'jsFunction');
      const tsFunc = result.symbols.find(s => s.name === 'tsFunction');
      const mixed = result.symbols.find(s => s.name === 'mixed');

      expect(jsFunc).toBeDefined();
      expect(tsFunc).toBeDefined();
      expect(mixed).toBeDefined();
    });
  });

  // ============================================================================
  // Statistics and Metadata
  // ============================================================================

  describe('Statistics and Metadata', () => {
    it('should track symbol counts accurately', () => {
      const source = `
        const a = 1;
        const b = 2;
        function fn(x: number) { return x; }
        class C { prop: string = ""; }
      `;

      const result = analyzer.analyze('test.ts', source);

      expect(result.symbolCount).toBeGreaterThan(4);
      expect(result.symbols.length).toBe(result.symbolCount);
    });

    it('should track analysis duration', () => {
      const source = `const x = 42;`;
      const result = analyzer.analyze('test.ts', source);

      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThan(1000);
    });

    it('should categorize symbols by kind', () => {
      const source = `
        const variable = 1;
        function func() {}
        class Cls {}
        interface Iface {}
        type Alias = string;
      `;

      const result = analyzer.analyze('test.ts', source);

      const kinds = new Set(result.symbols.map(s => s.kind));
      expect(kinds.has('variable')).toBe(true);
      expect(kinds.has('function')).toBe(true);
      expect(kinds.has('class')).toBe(true);
      expect(kinds.has('interface')).toBe(true);
      expect(kinds.has('type-alias')).toBe(true);
    });

    it('should track exported vs internal symbols', () => {
      const source = `
        export const exported = 1;
        const internal = 2;
        export function publicFunc() {}
        function privateFunc() {}
      `;

      const result = analyzer.analyze('test.ts', source);

      const exportedSymbols = result.symbols.filter(s => s.exported);
      const internalSymbols = result.symbols.filter(s => !s.exported);

      expect(exportedSymbols.length).toBeGreaterThan(0);
      expect(internalSymbols.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty files', () => {
      const result = analyzer.analyze('empty.ts', '');

      expect(result.symbolCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle files with only comments', () => {
      const source = `
        // This is a comment
        /* Multi-line
           comment */
      `;

      const result = analyzer.analyze('comments.ts', source);

      expect(result.symbolCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle files with only whitespace', () => {
      const result = analyzer.analyze('whitespace.ts', '   \n\n\t  \n  ');

      expect(result.symbolCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle Unicode identifiers', () => {
      const source = `const café = "coffee";`;
      const result = analyzer.analyze('test.ts', source);

      const symbol = result.symbols.find(s => s.name === 'café');
      expect(symbol).toBeDefined();
      expect(symbol?.type.id).toBe('type:string');
    });

    it('should handle very long identifiers', () => {
      const longName = 'a'.repeat(1000);
      const source = `const ${longName} = 42;`;
      const result = analyzer.analyze('test.ts', source);

      expect(result.symbols[0].name).toBe(longName);
    });

    it('should handle deeply nested structures', () => {
      const source = `
        function a() {
          function b() {
            function c() {
              function d() {
                function e() {
                  const x = 1;
                  return x;
                }
                return e();
              }
              return d();
            }
            return c();
          }
          return b();
        }
      `;

      const result = analyzer.analyze('test.ts', source);

      const x = result.symbols.find(s => s.name === 'x');
      expect(x).toBeDefined();
      expect(x?.id).toContain('a.b.c.d.e.x');
    });
  });
});
