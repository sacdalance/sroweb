import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import supabase from "@/lib/supabase";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-init from StrictMode
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser?.email) {
          const { data, error } = await supabase
            .from("account")
            .select("account_id, role_id, email")
            .eq("email", currentUser.email)
            .maybeSingle();

          if (data) setAccount(data);
        }
      } catch (err) {
        console.error("[AuthContext] init error:", err);
      }
      setLoading(false);
    };

    init();

    // Listen for future auth changes (skip account re-query on token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "TOKEN_REFRESHED") return; // Token refresh doesn't change account data

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser?.email) {
        const { data } = await supabase
          .from("account")
          .select("account_id, role_id, email")
          .eq("email", currentUser.email)
          .maybeSingle();
        setAccount(data || null);
      } else {
        setAccount(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    account,
    role: account?.role_id ?? null,
    accountId: account?.account_id ?? null,
    email: account?.email ?? user?.email ?? null,
    loading,
  }), [user, account, loading]);

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a UserAuthProvider");
  }
  return context;
}

export default UserAuthContext;
