import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radio-sm)] bg-superficie-2",
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonLinea({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonTarjeta() {
  return (
    <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
