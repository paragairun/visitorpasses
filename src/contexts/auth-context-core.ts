import { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";

export type AppRole = "guard" | "resident" | "admin" | "visitor";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};