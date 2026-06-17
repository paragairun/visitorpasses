import { useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { appUrl } from "@/lib/app-url";
import { AuthContext, AppRole } from "./auth-context-core";

export { useAuth } from "./auth-context-core";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [societyName, setSocietyName] = useState<string | null>(null);
  const [societySlug, setSocietySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const latestRoleRequestFor = useRef<string | null>(null);

  const fetchRolesAndSociety = async (userId: string) => {
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("society_id").eq("user_id", userId).maybeSingle(),
    ]);

    const nextRoles = (roleData ?? []).map((r) => r.role as AppRole);
    const nextSocietyId = profileData?.society_id ?? null;

    let nextSocietyName: string | null = null;
    let nextSocietySlug: string | null = null;
    if (nextSocietyId) {
      const { data: soc } = await supabase
        .from("societies")
        .select("name, slug")
        .eq("id", nextSocietyId)
        .maybeSingle();
      nextSocietyName = soc?.name ?? null;
      nextSocietySlug = soc?.slug ?? null;
    }

    return { nextRoles, nextSocietyId, nextSocietyName, nextSocietySlug };
  };

  const currentUserIdRef = useRef<string | null>(null);

  const syncAuthState = (nextSession: Session | null) => {
    const nextUserId = nextSession?.user?.id ?? null;
    const sameUser = currentUserIdRef.current === nextUserId;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (sameUser) return;

    currentUserIdRef.current = nextUserId;
    latestRoleRequestFor.current = nextUserId;

    if (!nextUserId) {
      setRole(null);
      setRoles([]);
      setSocietyId(null);
      setSocietyName(null);
      setSocietySlug(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchRolesAndSociety(nextUserId).then(({ nextRoles, nextSocietyId, nextSocietyName, nextSocietySlug }) => {
      if (latestRoleRequestFor.current === nextUserId) {
        setRoles(nextRoles);
        setRole(nextRoles[0] ?? null);
        setSocietyId(nextSocietyId);
        setSocietyName(nextSocietyName);
        setSocietySlug(nextSocietySlug);
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
    if (!error) syncAuthState(data.session);
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: appUrl("/"),
      },
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
    setSocietyId(null);
    setSocietyName(null);
    setSocietySlug(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, role, roles, societyId, societyName, societySlug, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
