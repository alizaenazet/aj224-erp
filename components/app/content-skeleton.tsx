import { Skeleton } from "@/components/ui/skeleton";

/** Suspense fallback for a page's data area (list or form). */
export function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-2/3" />
    </div>
  );
}
