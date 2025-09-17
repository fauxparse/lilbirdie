"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Session, User } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        session: session || null,
        user: session?.user || null,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
