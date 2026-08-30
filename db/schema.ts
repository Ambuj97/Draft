import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Sessions — GPS pub crawl paths ("The Stumble Path")
 * Stores the movement data for a night out.
 */
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  /** JSON: Coordinate[][] — one array per tracked segment (a pause splits it). */
  pathJson: text("path_json").notNull().default("[]"),
  /** Metres, gap-aware running total. */
  distance: real("distance").default(0),
  /** Total time spent paused (manual + auto), in ms. */
  pausedMs: real("paused_ms").default(0),
  /** Time spent actually walking, in ms — the headline "moving time". */
  movingMs: real("moving_ms").default(0),
  isLive: integer("is_live", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull(),
});

/**
 * Beers — individual pour logs with price tracking.
 * Each beer can optionally belong to a session.
 */
export const beers = sqliteTable("beers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => sessions.id),
  name: text("name").notNull(),
  brewery: text("brewery"),
  abv: real("abv"),
  price: real("price"),
  currency: text("currency").default("GBP"),
  venue: text("venue"),
  photoUri: text("photo_uri"),
  rating: integer("rating"),
  notes: text("notes"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  loggedAt: text("logged_at").notNull(),
  createdAt: text("created_at").notNull(),
});

/**
 * Threads — social layer for Zone Boards and Session Threads.
 * Stored locally first, synced to backend later.
 */
export const threads = sqliteTable("threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: text("zone_id"),
  sessionId: integer("session_id").references(() => sessions.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: text("author_id"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isEphemeral: integer("is_ephemeral", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
});

// Type exports for use throughout the app
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Beer = typeof beers.$inferSelect;
export type NewBeer = typeof beers.$inferInsert;
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
