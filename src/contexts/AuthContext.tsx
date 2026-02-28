import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  workstation_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);

    if (!profileRes.data) return null;

    const p: UserProfile = {
      id: profileRes.data.id,
      user_id: profileRes.data.user_id,
      email: profileRes.data.email,
      full_name: profileRes.data.full_name,
      role: roleRes.data?.role ?? null,
      workstation_id: profileRes.data.workstation_id,
    };

    setProfile(p);
    return p;
  }, []);

  const redirectByRole = useCallback((p: UserProfile) => {
    if (p.role === "operator") {
      if (p.workstation_id) {
        navigate(`/workstation/${p.workstation_id}`, { replace: true });
      } else {
        navigate("/no-workstation", { replace: true });
      }
    } else {
      navigate("/orders", { replace: true });
    }
  }, [navigate]);

  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    // Clear localStorage except sidebar preference
    const sidebarVal = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    localStorage.clear();
    if (sidebarVal !== null) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarVal);
    }
  }, []);

  useEffect(() => {
    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          clearState();
          navigate("/login", { replace: true });
          return;
        }

        if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password", { replace: true });
          return;
        }

        if (event === "SIGNED_IN" && newSession?.user) {
          // Defer DB calls to avoid Supabase auth deadlock
          setTimeout(async () => {
            const p = await loadProfile(newSession.user.id);
            // Only auto-redirect if we're on login or root
            const path = window.location.pathname;
            if (p && (path === "/login" || path === "/")) {
              redirectByRole(p);
            }
          }, 0);
        }
      }
    );

    // 2. Then check existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        await loadProfile(existingSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearState();
    toast.success("Uspješno ste se odjavili.");
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

/** Convenience hook – same as useAuth().profile */
export function useProfile() {
  const { profile } = useAuth();
  return profile;
}
