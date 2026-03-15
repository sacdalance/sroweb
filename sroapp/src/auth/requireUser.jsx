import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import supabase from "@/lib/supabase";
import { PageLoadingSkeleton } from "@/components/ui/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { SUPERADMIN_EMAILS } from "@/lib/permissions";

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

      if (!error && (data?.role_id === 1 || data?.role_id === 4 || SUPERADMIN_EMAILS.includes(user.email))) {
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
    return <PageLoadingSkeleton />;
  }

  return hasAccess ? (
    children
  ) : (
    <Dialog open={showDialog}>
      <DialogContent className="max-w-md rounded-lg shadow-lg bg-white p-6 border-none focus:outline-none">
        <DialogHeader className="flex flex-col items-center justify-center text-center sm:text-center">
          <div className="mb-4 rounded-full bg-sro-primary/10 p-3">
            <AlertTriangle className="h-10 w-10 text-sro-primary" />
          </div>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl text-sro-primary font-bold leading-tight">
            Access Denied
          </DialogTitle>
          <DialogDescription className="mt-2 text-center text-sm text-gray-500">
            You are not authorized to view this page. You will be redirected to the homepage shortly.
          </DialogDescription>
        </DialogHeader>

        {/* Animated Loading Dots */}
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-2.5 h-2.5 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequireUser;
