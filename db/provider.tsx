import React, { createContext, useContext } from "react";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "./client";
import migrations from "./migrations/migrations";

type DatabaseContextType = {
  db: typeof db;
  isReady: boolean;
  error?: Error;
};

const DatabaseContext = createContext<DatabaseContextType>({
  db,
  isReady: false,
});

/**
 * Runs pending migrations on mount and exposes the db once they're applied.
 * `isReady` stays false until migrations succeed — screens gate their queries
 * on it.
 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    console.error("[db] migration failed:", error);
  }

  return (
    <DatabaseContext.Provider
      value={{ db, isReady: success, error: error ?? undefined }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}
