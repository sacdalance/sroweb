import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "@/lib/supabase";

const RequireAdmin = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return setLoading(false);

      const { data, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("email", user.email)
        .single();

      if (!error && data && (data.role_id === 2 || data.role_id === 3)) {
        setIsAdmin(true);
      }

      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) return <p className="text-center p-10">Checking access...</p>;

  return isAdmin ? children : (
    <div className="text-center p-10 text-red-600">
      <h1 className="text-2xl font-bold mb-2">🚫 Access Denied</h1>
      <p>You are not authorized to view this page.</p>
    </div>
  );
};

export default RequireAdmin;
