import { createContext, useContext, useState, useEffect, useMemo } from "react";
import supabase from "@/lib/supabase";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = (ms) => new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    );

    // Listen for auth changes. INITIAL_SESSION fires once on load with the restored
    // session (or null) — avoids a separate getSession() call, which can contend
    // with other callers for the browser's navigator.locks session lock and hang
    // indefinitely in some environments.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return; // Token refresh doesn't change account data

      const currentUser = session?.user || null;
      setUser(currentUser);

      // Defer: querying Supabase synchronously inside onAuthStateChange can
      // deadlock on the internal session lock the callback is invoked under.
      setTimeout(async () => {
        try {
          if (currentUser?.email) {
            const { data } = await Promise.race([
              supabase
                .from("account")
                .select("account_id, role_id, email")
                .eq("email", currentUser.email)
                .maybeSingle(),
              timeout(8000),
            ]);
            setAccount(data || null);
          } else {
            setAccount(null);
          }
        } catch (err) {
          console.error("[AuthContext] account lookup error:", err);
        }

        setLoading(false);
      }, 0);
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
