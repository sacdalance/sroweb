import ReactSkeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/utils";

/**
 * Skeleton component backed by react-loading-skeleton.
 *
 * Two usage patterns:
 * 1. Props: <Skeleton height={32} width={128} circle count={3} />
 * 2. Tailwind classes: <Skeleton className="h-8 w-32 rounded-full" />
 *
 * Pattern 2 uses a CSS shimmer div for backward compatibility.
 */
function Skeleton({ className, circle, count, height, width, inline, borderRadius, containerClassName, ...props }) {
  if (height !== undefined || width !== undefined || count || circle || inline || containerClassName) {
    return (
      <ReactSkeleton
        className={cn(className)}
        circle={circle}
        count={count}
        height={height}
        width={width}
        inline={inline}
        borderRadius={borderRadius}
        containerClassName={containerClassName}
        baseColor="hsl(var(--muted))"
        highlightColor="hsl(var(--muted) / 0.5)"
        {...props}
      />
    );
  }

  // Fallback: className-based sizing with CSS shimmer animation
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
