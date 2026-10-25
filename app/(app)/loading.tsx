import { Skeleton } from "@/components/ui/skeleton";

/** Suspense fallback for every app page while its data loads. */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
