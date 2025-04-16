import { Loader2 } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-white/30">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
};

export default LoadingSpinner;