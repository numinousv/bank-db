// E2E suite (Assignment 2, Part 3). Runs against the isolated test stack
// (docker-compose.test.yml at repo root): web on :3002, api on :3101,
// throwaway database volume. No webServer here: the stack is started
// separately before the run, both locally and in GitHub Actions.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3002",
    trace: "retain-on-failure",
  },
});
