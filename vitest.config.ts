import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        'packages/*/src/**/*.test.ts',
        'packages/*/src/**/*.spec.ts',
        'packages/test-utils/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },

    // Test file patterns
    include: ['packages/*/src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json',
    },

    // Watch mode configuration
    watch: false,

    // Dependency optimization
    deps: {
      inline: [/@ptl\/.*/],
    },

    // Workspace configuration
    workspace: [
      {
        extends: true,
        test: {
          name: 'core',
          include: ['packages/core/src/**/*.{test,spec}.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'cli',
          include: ['packages/cli/src/**/*.{test,spec}.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'shared',
          include: ['packages/shared/src/**/*.{test,spec}.ts'],
        },
      },
    ],
  },

  resolve: {
    alias: {
      '@ptl/core': resolve(__dirname, 'packages/core/src'),
      '@ptl/shared': resolve(__dirname, 'packages/shared/src'),
      '@ptl/config': resolve(__dirname, 'packages/config/src'),
      '@ptl/test-utils': resolve(__dirname, 'packages/test-utils/src'),
    },
  },
});
