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
import { Loader2, AlertTriangle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-gray-600">
        <Loader2 className="h-6 w-6 mb-2 animate-spin text-[#7B1113]" />
        <p>Checking access...</p>
      </div>
    );
  }  

  return hasAccess ? (
    children
  ) : (
    <Dialog open={showDialog}>
      <DialogContent className="z-[100] max-w-md rounded-xl shadow-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Access Denied
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-gray-600">
            You are not authorized to view this page. You will be redirected to the homepage shortly.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
          <p className="text-sm text-gray-500 italic">Redirecting in 3 seconds...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequireUser;
