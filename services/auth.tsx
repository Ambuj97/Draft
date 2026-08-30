import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Local-only accounts. A "user" is a handle (+ optional email) stored on the
 * device — no server, no password, no verification. Identity only needs to be
 * real once the Taproom goes multiplayer; this AuthProvider interface is the
 * seam where a Supabase-backed provider would slot in later.
 */

const STORAGE_KEY = "draft_user";
const LEGACY_KEY = "draft_mock_user";

export interface User {
  id: string;
  handle: string;
  email: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (handle: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<User, "handle" | "email">>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

function makeId() {
  return `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@+/, "");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
          return;
        }
        // Migrate the pre-rewrite mock-auth record, if any.
        const legacy = await AsyncStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const old = JSON.parse(legacy);
          const migrated: User = {
            id: old.id ?? makeId(),
            handle: normalizeHandle(old.handle ?? "you"),
            email: old.email || null,
            createdAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          await AsyncStorage.removeItem(LEGACY_KEY);
          setUser(migrated);
        }
      } catch (err) {
        console.error("[auth] load failed", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (next: User | null) => {
    setUser(next);
    if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const signIn = async (handle: string, email?: string) => {
    await persist({
      id: makeId(),
      handle: normalizeHandle(handle),
      email: email?.trim() ? email.trim() : null,
      createdAt: new Date().toISOString(),
    });
  };

  const signOut = async () => {
    await persist(null);
  };

  const updateProfile = async (
    patch: Partial<Pick<User, "handle" | "email">>
  ) => {
    if (!user) return;
    await persist({
      ...user,
      ...(patch.handle !== undefined
        ? { handle: normalizeHandle(patch.handle) }
        : {}),
      ...(patch.email !== undefined
        ? { email: patch.email?.trim() ? patch.email.trim() : null }
        : {}),
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
