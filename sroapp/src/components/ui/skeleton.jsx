import ReactSkeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/utils";

/**
 * Skeleton component backed by react-loading-skeleton.
 *
 * Supports two usage patterns:
 * 1. Tailwind classes: <Skeleton className="h-8 w-32 rounded-full" />
 * 2. Props: <Skeleton height={32} width={128} circle />
 *
 * When using className (pattern 1), the skeleton renders inside a
 * sized div wrapper for backward compatibility with ShadCN usage.
 */
function Skeleton({ className, circle, count, height, width, inline, borderRadius, containerClassName, ...props }) {
  // If explicit height/width are provided, use react-loading-skeleton directly
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

  // Fallback: className-based sizing (backward compat with ShadCN pattern)
  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <ReactSkeleton
        height="100%"
        borderRadius={0}
        baseColor="hsl(var(--muted))"
        highlightColor="hsl(var(--muted) / 0.5)"
      />
    </div>
  );
}

export { Skeleton };
