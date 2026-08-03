import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run unit/integration tests here. Playwright e2e specs live in
    // e2e/ and are run separately via `npm run test:e2e`.
    include: ['lib/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
