import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Profile } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";
import { getCurrentProfile } from "../profiles/services/profileService";

type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
  session: Session | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  async function refreshProfile() {
    if (!supabase) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getCurrentProfile();
    setProfile(nextProfile);
    return nextProfile;
  }

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;

      setSession(data.session);

      if (data.session) {
        try {
          await refreshProfile();
        } catch {
          setProfile(null);
        }
      }

      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      refreshProfile()
        .catch(() => setProfile(null))
        .finally(() => setIsLoading(false));
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      isConfigured: Boolean(supabase),
      isLoading,
      profile,
      refreshProfile,
      session,
    }),
    [isLoading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return value;
}
