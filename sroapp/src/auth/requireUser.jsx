import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

const RequireUser = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("email", user.email)
        .single();

    if (!error && (data?.role_id === 1 || data?.role_id === 4)) {
        setHasAccess(true);
      } else {
        setShowDialog(true);
        setTimeout(() => {
          navigate("/");
        }, 3000); // redirect in 3s
      }

      setLoading(false);
    };

    checkRole();
  }, [navigate]);

  if (loading) return <p className="text-center p-10">Checking access...</p>;

  return hasAccess ? (
    children
  ) : (
    <Dialog open={showDialog}>
      <DialogContent className="z-[100] backdrop-blur-md bg-white/80">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Access Denied
          </DialogTitle>
          <DialogDescription className="text-gray-700 mt-2">
            You are not authorized to view this page.
            <br />
            <span className="inline-flex items-center gap-1 mt-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
              Redirecting you to the homepage...
            </span>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default RequireUser;
