# vitest.workspace.ts - Vitest Monorepo Configuration
# See https://vitest.dev/guide/workspace.html

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
]);
