import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  use: { viewport: { width: 1024, height: 768 }, hasTouch: true, baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173/firefly-jar/',
    reuseExistingServer: true,
  },
});
