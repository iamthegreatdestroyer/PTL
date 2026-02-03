/**
 * Playground Store
 *
 * State management using Zustand.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Type inference result
 */
export interface InferenceResult {
  id: string;
  type: string;
  confidence: number;
  confidenceInterval: [number, number];
  location: {
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
  };
  alternatives: Array<{
    type: string;
    confidence: number;
  }>;
}

/**
 * Analysis state
 */
export interface AnalysisState {
  inferences: InferenceResult[];
  isAnalyzing: boolean;
  error: string | null;
  analysisTime: number;
}

/**
 * Editor settings
 */
export interface EditorSettings {
  fontSize: number;
  theme: 'dark' | 'light';
  showLineNumbers: boolean;
  minimap: boolean;
}

/**
 * Store state
 */
interface PlaygroundState {
  // Code
  code: string;
  setCode: (code: string) => void;

  // Analysis
  analysis: AnalysisState;
  setAnalysis: (analysis: AnalysisState) => void;
  startAnalysis: () => void;
  setAnalysisError: (error: string) => void;

  // Selected inference
  selectedInferenceId: string | null;
  selectInference: (id: string | null) => void;

  // Editor settings
  settings: EditorSettings;
  updateSettings: (settings: Partial<EditorSettings>) => void;

  // View state
  showLattice: boolean;
  toggleLattice: () => void;
  showSettings: boolean;
  toggleSettings: () => void;

  // Examples
  loadExample: (name: string) => void;
}

/**
 * Default code example
 */
const defaultCode = `// Welcome to PTL Playground!
// Edit this code to see Bayesian type inference in action.

function greet(name) {
  return "Hello, " + name;
}

const user = {
  name: "Alice",
  age: 30,
  email: "alice@example.com"
};

// PTL will infer types with confidence intervals
const result = greet(user.name);

// Try adding more code to see how confidence changes!
function add(a, b) {
  return a + b;
}

const sum = add(1, 2);
const mixed = add(1, "2"); // Ambiguous - lower confidence
`;

/**
 * Code examples
 */
const examples: Record<string, string> = {
  basic: defaultCode,
  functions: `// Function type inference examples

// High confidence - clear parameter and return types
function square(x) {
  return x * x;
}

// Medium confidence - callback type depends on usage
function map(arr, fn) {
  return arr.map(fn);
}

// Lower confidence - generic function
function identity(x) {
  return x;
}

const result1 = square(5);
const result2 = map([1, 2, 3], square);
const result3 = identity("hello");
`,
  objects: `// Object type inference examples

// High confidence - well-defined shape
const user = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  isActive: true
};

// Medium confidence - nested objects
const company = {
  name: "Acme Corp",
  employees: [user],
  address: {
    street: "123 Main St",
    city: "Springfield"
  }
};

// Lower confidence - dynamic property access
function getValue(obj, key) {
  return obj[key];
}

const name = getValue(user, "name");
`,
  generics: `// Generic type inference examples

// Array inference
const numbers = [1, 2, 3, 4, 5];
const strings = ["a", "b", "c"];
const mixed = [1, "two", true]; // Lower confidence

// Promise inference
async function fetchData() {
  return { data: "result" };
}

// Map and Set inference
const map = new Map();
map.set("key", 123);

const set = new Set([1, 2, 3]);

// Generic function usage
function first(arr) {
  return arr[0];
}

const firstNum = first(numbers);
const firstStr = first(strings);
`,
};

/**
 * Create the store
 */
export const usePlaygroundStore = create<PlaygroundState>()(
  devtools(
    persist(
      (set) => ({
        // Code
        code: defaultCode,
        setCode: (code) => set({ code }),

        // Analysis
        analysis: {
          inferences: [],
          isAnalyzing: false,
          error: null,
          analysisTime: 0,
        },
        setAnalysis: (analysis) => set({ analysis }),
        startAnalysis: () =>
          set((state) => ({
            analysis: {
              ...state.analysis,
              isAnalyzing: true,
              error: null,
            },
          })),
        setAnalysisError: (error) =>
          set((state) => ({
            analysis: {
              ...state.analysis,
              isAnalyzing: false,
              error,
            },
          })),

        // Selected inference
        selectedInferenceId: null,
        selectInference: (id) => set({ selectedInferenceId: id }),

        // Editor settings
        settings: {
          fontSize: 14,
          theme: 'dark',
          showLineNumbers: true,
          minimap: false,
        },
        updateSettings: (newSettings) =>
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          })),

        // View state
        showLattice: false,
        toggleLattice: () => set((state) => ({ showLattice: !state.showLattice })),
        showSettings: false,
        toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

        // Examples
        loadExample: (name) => set({ code: examples[name] || examples.basic }),
      }),
      {
        name: 'ptl-playground',
        partialize: (state) => ({
          code: state.code,
          settings: state.settings,
        }),
      }
    )
  )
);
