import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for the on-device SQLite database.
 *
 *   npm run db:generate   # after editing db/schema.ts — writes db/migrations/*
 *
 * The `expo` driver emits an importable `migrations.js` bundle that
 * `useMigrations` runs at app startup (see db/provider.tsx).
 */
export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./db/schema.ts",
  out: "./db/migrations",
});
