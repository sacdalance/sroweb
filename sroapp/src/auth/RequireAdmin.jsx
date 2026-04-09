import { useEffect, useState, cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { PageLoadingSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/context/UserAuthContext";

const RequireAdminRole = ({ childrenByRole }) => {
  const { role, loading } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== null && !childrenByRole[role]) {
      setShowDialog(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    }
    if (!loading && role === null) {
      navigate("/login");
    }
  }, [loading, role, childrenByRole, navigate]);

  if (loading) return <PageLoadingSkeleton />;

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
