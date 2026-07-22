/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'api',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    watch: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/apps/api',
    },
  },
});
