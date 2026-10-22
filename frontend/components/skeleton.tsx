import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  rounded = "lg",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  const radius = {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer relative overflow-hidden",
        "bg-[var(--surface-muted)]",
        radius,
        className,
      )}
    />
  );
}

export function SkeletonStack({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-4"
          rounded="md"
        />
      ))}
    </div>
  );
}