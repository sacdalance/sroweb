import { useEffect, useState, cloneElement } from "react";
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
import LoadingSpinner from "@/components/ui/loading-spinner";

const RequireAdminRole = ({ childrenByRole }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("email", user.email)
        .single();

      const roleId = data?.role_id;

      if (!error && childrenByRole[roleId]) {
        setRole(roleId);
      } else {
        setShowDialog(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }

      setLoading(false);
    };

    fetchRole();
  }, [navigate, childrenByRole]);

  if (loading) return <LoadingSpinner text="Checking User Role..." variant="fullscreen" />;

  return role && childrenByRole[role] ? (
    cloneElement(childrenByRole[role], { userRole: role })
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
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-2.5 h-2.5 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequireAdminRole;
