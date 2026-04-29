import { useEffect, useRef, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, AppRole } from "./auth-context-core";

export { useAuth } from "./auth-context-core";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const latestRoleRequestFor = useRef<string | null>(null);

  const fetchRoles = async (userId: string): Promise<AppRole[]> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    return (data ?? []).map((r) => r.role as AppRole);
  };

  const currentUserIdRef = useRef<string | null>(null);

  const syncAuthState = (nextSession: Session | null) => {
    const nextUserId = nextSession?.user?.id ?? null;
    const sameUser = currentUserIdRef.current === nextUserId;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    // If the user hasn't changed (e.g. token refresh on tab focus),
    // don't reset role/loading state — that would cause dashboards to
    // flash their loading UI and re-fetch data unnecessarily.
    if (sameUser) {
      return;
    }

    currentUserIdRef.current = nextUserId;
    latestRoleRequestFor.current = nextUserId;

    if (!nextUserId) {
      setRole(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchRoles(nextUserId).then((nextRoles) => {
      if (latestRoleRequestFor.current === nextUserId) {
        setRoles(nextRoles);
        setRole(nextRoles[0] ?? null);
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncAuthState(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      syncAuthState(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
      syncAuthState(data.session);
    }

    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    latestRoleRequestFor.current = null;
    currentUserIdRef.current = null;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setRoles([]);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, roles, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
