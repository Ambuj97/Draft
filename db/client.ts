import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "draft.db";

/**
 * Opens the SQLite database and wraps it with Drizzle ORM.
 * The database file persists across app launches.
 */
const expoDb = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDb, { schema });

/**
 * Initialize database tables.
 * Uses raw SQL CREATE TABLE IF NOT EXISTS for reliability on first launch.
 */
export async function initializeDatabase() {
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      path_json TEXT NOT NULL DEFAULT '[]',
      distance REAL DEFAULT 0,
      is_live INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS beers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id),
      name TEXT NOT NULL,
      brewery TEXT,
      abv REAL,
      price REAL,
      currency TEXT DEFAULT 'GBP',
      venue TEXT,
      photo_uri TEXT,
      rating INTEGER,
      notes TEXT,
      latitude REAL,
      longitude REAL,
      logged_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_id TEXT,
      session_id INTEGER REFERENCES sessions(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      author_id TEXT,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      is_ephemeral INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}
