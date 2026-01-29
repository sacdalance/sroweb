import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Unified Loading Component
 * @param {string} text - Optional text to display below or beside the spinner
 * @param {string} variant - "fullscreen" | "section" | "inline"
 * @param {string} className - Optional className for the container
 */
const LoadingSpinner = ({ text, variant = "section", className }) => {
  // Shared visual styles
  const spinnerClass = "h-10 w-10 animate-spin text-[#7B1113]";
  const textClass = "mt-4 text-sm font-medium text-gray-600";
  const containerClass = "flex flex-col items-center justify-center";

  // Variant: Fullscreen Overlay (e.g., Auth checks, initial app load)
  if (variant === "fullscreen") {
    return (
      <div className={cn("fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm", containerClass, className)}>
        <Loader2 className={spinnerClass} />
        {text && <p className={textClass}>{text}</p>}
      </div>
    );
  }

  // Variant: Section / Block (e.g., Table loading, Card content)
  if (variant === "section") {
    return (
      <div className={cn("w-full min-h-[200px] p-8", containerClass, className)}>
        <Loader2 className={spinnerClass} />
        {text && <p className={textClass}>{text}</p>}
      </div>
    );
  }

  // Variant: Inline (e.g., Buttons, small status indicators)
  if (variant === "inline") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-current" />
        {text && <span>{text}</span>}
      </div>
    );
  }

  return null;
};

export default LoadingSpinner;