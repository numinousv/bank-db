import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(testsDirectory, '../frontend');
const backendDirectory = path.resolve(testsDirectory, '../backend');
const frontendPort = Number(process.env.FRONTEND_PORT || 3000);
const backendPort = Number(process.env.BACKEND_PORT || 3001);
const frontendURL = process.env.FRONTEND_URL || `http://127.0.0.1:${frontendPort}`;
const backendURL = process.env.BACKEND_URL || `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: testsDirectory,
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: frontendURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm start',
      cwd: backendDirectory,
      port: backendPort,
      env: {
        ...process.env,
        PORT: String(backendPort),
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: frontendDirectory,
      port: frontendPort,
      env: {
        ...process.env,
        PORT: String(frontendPort),
        NEXT_PUBLIC_API_URL: backendURL,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
