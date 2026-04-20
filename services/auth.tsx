import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

type User = {
  id: string;
  email: string;
  handle: string;
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, handle: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    const loadSession = async () => {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || "",
              handle: data.session.user.user_metadata?.handle || "User",
            });
          }
        } else {
          // Mock local auth fallback
          const mockUser = await AsyncStorage.getItem("draft_mock_user");
          if (mockUser) {
            setUser(JSON.parse(mockUser));
          }
        }
      } catch (err) {
        console.error("Session load error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              handle: session.user.user_metadata?.handle || "User",
            });
          } else {
            setUser(null);
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, handle: string) => {
    if (supabase) {
      // In a real app, this would be signInWithPassword or signUp.
      // For this demo structure, if we have keys we'd use real auth.
      // Assuming mock auth for ease of demonstration if no real account provided:
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      // Real flow would await confirmation link. Let's fallback to mock if needed.
    } else {
      // Mock flow
      const mock = { id: `usr_${Date.now()}`, email, handle };
      await AsyncStorage.setItem("draft_mock_user", JSON.stringify(mock));
      setUser(mock);
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      await AsyncStorage.removeItem("draft_mock_user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
