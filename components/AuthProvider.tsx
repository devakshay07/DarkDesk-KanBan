"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signInWithMagicLink: async () => null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase is not configured";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase is not configured";
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }

  async function signInWithMagicLink(email: string): Promise<string | null> {
    if (!supabase) return "Supabase is not configured";
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error?.message ?? null;
  }

  async function signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("darkdesk-workspace-v1");
    }
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
