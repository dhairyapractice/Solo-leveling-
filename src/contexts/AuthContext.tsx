import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfileExists(session.user).catch(() => {});
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfileExists(session.user).catch(() => {});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfileExists = async (signedInUser: User) => {
    // Check for existing profile
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", signedInUser.id)
      .maybeSingle();
    if (!error && existing) return;

    const fallbackName =
      (signedInUser.user_metadata as any)?.name ||
      signedInUser.email?.split("@")[0] ||
      "Hunter";

    await supabase.from("profiles").insert({
      user_id: signedInUser.id,
      name: fallbackName,
    } as any);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
