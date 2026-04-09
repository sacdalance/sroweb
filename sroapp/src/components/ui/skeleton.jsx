import { cn } from "@/lib/utils";

/**
 * Skeleton component with shimmer animation.
 *
 * Usage: <Skeleton className="h-8 w-32 rounded-full" />
 *
 * Uses a CSS shimmer gradient animation for a polished loading effect.
 * react-loading-skeleton is available as a dependency for advanced
 * use cases (count, circle, inline) — import it directly where needed.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
