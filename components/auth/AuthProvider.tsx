"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { SessionUser } from "@/lib/auth";

interface AuthContextValue {
  session: SessionUser | null;
  isLoading: boolean;
  login: (user: SessionUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("dpr_session_client");
      if (savedSession) {
        setSession(JSON.parse(savedSession) as SessionUser);
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (user: SessionUser) => {
    setSession(user);
    localStorage.setItem("dpr_session_client", JSON.stringify(user));
  };

  const logout = async () => {
    setSession(null);
    localStorage.removeItem("dpr_session_client");
    await fetch("/api/auth/logout", { method: "POST" });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ session, isLoading, login, logout }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
