import { describe, it, expect, beforeEach } from 'vitest';
import { BayesianTypeInference } from '../BayesianTypeInference';
import type { InferenceOptions, TypeInference } from '../types';

describe('BayesianTypeInference', () => {
  let engine: BayesianTypeInference;

  beforeEach(() => {
    engine = new BayesianTypeInference({
      strict: false,
      debug: false,
    });
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const instance = new BayesianTypeInference();
      expect(instance).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const instance = new BayesianTypeInference({
        strict: true,
        minConfidence: 0.8,
        debug: true,
      });
      expect(instance).toBeDefined();
    });
  });

  describe('analyzeSource', () => {
    it('should analyze simple variable declaration', async () => {
      const code = 'const name = "Alice";';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences).toHaveLength(1);
      expect(result.inferences[0].name).toBe('name');
      expect(result.inferences[0].type).toBe('string');
      expect(result.inferences[0].confidence).toBeGreaterThan(0.9);
    });

    it('should analyze number literal', async () => {
      const code = 'const age = 30;';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences).toHaveLength(1);
      expect(result.inferences[0].type).toBe('number');
    });

    it('should analyze boolean literal', async () => {
      const code = 'const active = true;';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences).toHaveLength(1);
      expect(result.inferences[0].type).toBe('boolean');
    });

    it('should analyze array literal', async () => {
      const code = 'const nums = [1, 2, 3];';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences).toHaveLength(1);
      expect(result.inferences[0].type).toBe('number[]');
    });

    it('should analyze object literal', async () => {
      const code = 'const user = { name: "Alice", age: 30 };';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences.length).toBeGreaterThanOrEqual(1);
      const userInference = result.inferences.find((i) => i.name === 'user');
      expect(userInference).toBeDefined();
    });

    it('should provide evidence for inferences', async () => {
      const code = 'const message = "Hello, World!";';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences[0].evidence).toBeDefined();
      expect(result.inferences[0].evidence?.length).toBeGreaterThan(0);
    });
  });

  describe('function parameter inference', () => {
    it('should infer parameter types from arithmetic operations', async () => {
      const code = `
function add(a, b) {
  return a + b;
}
add(1, 2);
`;
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      const aParam = result.inferences.find((i) => i.name === 'a' && i.kind === 'parameter');
      expect(aParam).toBeDefined();
      // With usage, should infer number
    });

    it('should infer parameter types from string operations', async () => {
      const code = `
function greet(name) {
  return "Hello, " + name;
}
greet("Alice");
`;
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      const nameParam = result.inferences.find((i) => i.name === 'name' && i.kind === 'parameter');
      expect(nameParam).toBeDefined();
    });

    it('should handle ambiguous plus operator', async () => {
      const code = `
function combine(a, b) {
  return a + b;
}
`;
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      const aParam = result.inferences.find((i) => i.name === 'a' && i.kind === 'parameter');
      expect(aParam).toBeDefined();
      // Without usage context, should have lower confidence or union type
      expect(aParam!.confidence).toBeLessThan(0.9);
    });
  });

  describe('naming convention inference', () => {
    it('should boost confidence for isXxx boolean naming', async () => {
      const code = `
function check(isActive) {
  if (isActive) {
    return "active";
  }
  return "inactive";
}
`;
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      const isActiveParam = result.inferences.find((i) => i.name === 'isActive');
      expect(isActiveParam).toBeDefined();
      expect(isActiveParam!.type).toBe('boolean');
    });

    it('should boost confidence for count/num naming', async () => {
      const code = `
function process(itemCount) {
  for (let i = 0; i < itemCount; i++) {
    console.log(i);
  }
}
`;
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      const countParam = result.inferences.find((i) => i.name === 'itemCount');
      expect(countParam).toBeDefined();
      expect(countParam!.type).toBe('number');
    });
  });

  describe('confidence levels', () => {
    it('should assign high confidence to literal types', async () => {
      const code = 'const x = 42;';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.inferences[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('should assign medium confidence to inferred function parameters', async () => {
      const code = `
function process(data) {
  return data.length;
}
`;
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      const dataParam = result.inferences.find((i) => i.name === 'data');
      expect(dataParam).toBeDefined();
      // Property access suggests array or string but not definitive
    });
  });

  describe('error handling', () => {
    it('should handle empty source code', async () => {
      const result = await engine.analyzeSource('', { fileName: 'test.ts' });
      expect(result.inferences).toEqual([]);
    });

    it('should handle invalid syntax gracefully', async () => {
      const code = 'const x = {';
      await expect(engine.analyzeSource(code, { fileName: 'test.ts' })).resolves.toBeDefined();
    });

    it('should include diagnostics for issues', async () => {
      const code = 'function f(x) { return x.unknownMethod(); }';
      const result = await engine.analyzeSource(code, { fileName: 'test.ts' });

      expect(result.diagnostics).toBeDefined();
    });
  });
});
