import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "draft.db";

/**
 * The on-device SQLite database, wrapped with Drizzle.
 *
 * Schema is applied by migrations (db/migrations/*), run at startup by
 * `useMigrations` in db/provider.tsx — never hand-written CREATE TABLE.
 * To change the schema: edit db/schema.ts, then `npm run db:generate`.
 */
export const expoDb = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDb, { schema });
