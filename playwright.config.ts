import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";
import { FAKE_DISCORD_PORT } from "./tests/e2e/fake-discord";
import { BASE_URL, E2E_PORT } from "./tests/e2e/users";

// Mêmes variables que le site (.env.local), sauf la base : les tests écrivent dans E2E_DATABASE_URL.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/setup.ts",
  // Les tests partagent la base de test : un seul à la fois, dans l'ordre.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm dev -p ${E2E_PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? "",
      DISCORD_API_URL: `http://localhost:${FAKE_DISCORD_PORT}`,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
    },
  },
});
