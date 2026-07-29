import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Skeleton className="h-6 w-56 rounded-full" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-12 w-3/4 max-w-xl" />
        <Skeleton className="mt-4 h-14 w-full max-w-xl rounded-2xl" />
      </div>

      {/* Section skeletons */}
      {[0, 1].map((s) => (
        <div key={s} className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
