import { Skeleton } from "@/components/ui/skeleton";

/**
 * Table skeleton — mimics DataTable with toolbar, column headers, and rows
 */
export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Toolbar: search + filters + view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <Skeleton className="h-9 w-full sm:w-64 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
      {/* Column headers */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/30">
        <Skeleton className="h-3 w-[18%]" />
        <Skeleton className="h-3 w-[22%]" />
        <Skeleton className="h-3 w-[15%]" />
        <Skeleton className="h-3 w-[15%]" />
        <Skeleton className="h-3 w-[12%]" />
        <Skeleton className="h-3 w-[10%]" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0">
          <Skeleton className="h-4 w-[18%]" />
          <Skeleton className="h-4 w-[22%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-5 w-[12%] rounded-full" />
          <Skeleton className="h-4 w-[10%]" />
        </div>
      ))}
      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Card list skeleton — grid of placeholder cards
 */
export function CardListSkeleton({ count = 4, cols = "grid-cols-1 sm:grid-cols-2" }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Calendar skeleton — weekly calendar placeholder
 */
export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-36" />
      {/* Day rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
          <div className="space-y-1 w-12 shrink-0">
            <Skeleton className="h-3 w-8 mx-auto" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * Detail skeleton — dialog/detail view placeholder
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton — stat cards + content area
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 md:p-10">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 flex items-center gap-3 h-[100px]">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      {/* Chart + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="xl:col-span-2 h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

/**
 * List skeleton — vertical list of items (for feeds, appointment lists)
 */
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page loading skeleton — full app shell placeholder for auth checks
 * Mimics navbar + sidebar + content area before Layout mounts
 */
export function PageLoadingSkeleton() {
  return (
    <div className="fixed inset-0 bg-gray-50 flex">
      {/* Sidebar skeleton */}
      <div className="hidden xl:flex w-72 bg-white border-r border-gray-200 flex-col pt-16 px-4 space-y-6">
        <div className="flex items-center gap-3 mt-4">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Navbar skeleton */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <Skeleton className="h-5 w-32" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 md:p-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Settings skeleton — form-like placeholder
 */
export function SettingsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
