/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';

import baseConfig from './vitest.config.mts';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'api-integration',
    include: ['src/**/*.integration.spec.ts'],
  },
});
