import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 10000,
    hookTimeout: 10000,
    watch: false,
    deps: {
      inline: [/@ptl\/.*/],
    },
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
