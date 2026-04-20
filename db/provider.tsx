import React, { createContext, useContext, useEffect, useState } from "react";
import { db, initializeDatabase } from "./client";

type DatabaseContextType = {
  db: typeof db;
  isReady: boolean;
};

const DatabaseContext = createContext<DatabaseContextType>({
  db,
  isReady: false,
});

/**
 * Provides the Drizzle database instance to the component tree.
 * Initializes tables on mount and exposes a loading state.
 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Failed to initialize database:", err);
        // Still set ready so app doesn't hang — tables may already exist
        setIsReady(true);
      });
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to access the database instance and readiness state.
 */
export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}
