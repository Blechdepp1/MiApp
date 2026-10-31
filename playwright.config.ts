import { defineConfig, devices } from '@playwright/test';

// Android-Viewport (412×915) wie in SPEC Abschnitt 8
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173/MiApp/',
    ...devices['Pixel 7'],
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/MiApp/',
    reuseExistingServer: true,
  },
});
