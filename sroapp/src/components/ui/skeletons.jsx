import { Skeleton } from "@/components/ui/skeleton";

/**
 * Table skeleton — mimics DataTable with toolbar, column headers, and rows
 */
export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <Skeleton height={36} width="100%" containerClassName="flex-1 max-w-64" />
        <div className="flex items-center gap-2">
          <Skeleton height={36} width={120} />
          <Skeleton height={36} width={100} />
        </div>
      </div>
      {/* Column headers */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/30">
        <Skeleton height={12} count={1} />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0">
          <Skeleton height={16} count={1} />
        </div>
      ))}
      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <Skeleton height={16} width={160} />
        <div className="flex items-center gap-2">
          <Skeleton height={32} width={32} count={3} inline />
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
            <Skeleton height={40} width={40} borderRadius={8} />
            <div className="flex-1">
              <Skeleton height={16} width="75%" />
              <Skeleton height={12} width="50%" />
            </div>
          </div>
          <Skeleton height={12} />
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
      <div className="flex items-center justify-between">
        <Skeleton height={24} width={192} />
        <div className="flex gap-2">
          <Skeleton height={32} width={32} circle />
          <Skeleton height={32} width={32} circle />
        </div>
      </div>
      <Skeleton height={16} width={144} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
          <div className="w-12 shrink-0 text-center">
            <Skeleton height={12} width={32} />
            <Skeleton height={24} width={32} />
          </div>
          <div className="flex-1">
            <Skeleton height={48} borderRadius={8} />
          </div>
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
      <Skeleton height={24} width="66%" />
      <Skeleton height={16} width="33%" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <Skeleton height={16} width={96} />
            <Skeleton height={16} count={2} />
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
      <Skeleton height={32} width={256} />
      <Skeleton height={16} width={192} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 flex items-center gap-3 h-[100px]">
            <Skeleton height={48} width={48} circle />
            <div className="flex-1">
              <Skeleton height={24} width={48} />
              <Skeleton height={12} width={80} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Skeleton height={300} borderRadius={12} />
        </div>
        <Skeleton height={300} borderRadius={12} />
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
          <Skeleton height={32} width={32} borderRadius={8} />
          <div className="flex-1">
            <Skeleton height={16} width="75%" />
            <Skeleton height={12} width="33%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page loading skeleton — full app shell placeholder for auth checks
 */
export function PageLoadingSkeleton() {
  return (
    <div className="fixed inset-0 bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden xl:flex w-72 bg-white border-r border-gray-200 flex-col pt-16 px-4 space-y-6">
        <div className="flex items-center gap-3 mt-4">
          <Skeleton height={44} width={44} circle />
          <div className="flex-1">
            <Skeleton height={16} width={128} />
            <Skeleton height={12} width={64} />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton height={36} count={6} borderRadius={8} />
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <Skeleton height={20} width={128} />
        </div>
        <div className="flex-1 p-6 md:p-8 space-y-6">
          <Skeleton height={32} width={256} />
          <Skeleton height={16} width={192} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton height={96} count={4} borderRadius={12} inline containerClassName="grid grid-cols-2 md:grid-cols-4 gap-4" />
          </div>
          <Skeleton height={256} borderRadius={12} />
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
      <Skeleton height={24} width={192} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height={16} width={128} />
          <Skeleton height={40} borderRadius={8} />
        </div>
      ))}
      <Skeleton height={40} width={128} borderRadius={8} />
    </div>
  );
}
