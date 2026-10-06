import { cn } from "@/lib/cn";

export function BrandMark({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dimension = size === "sm" ? 28 : size === "md" ? 36 : 44;
  const wordmarkClass = size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="relative inline-flex items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-[var(--shadow-md)]"
        style={{ width: dimension, height: dimension }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={Math.round(dimension * 0.55)}
          height={Math.round(dimension * 0.55)}
          aria-hidden="true"
        >
          <path
            d="M5 6.5C5 5.67 5.67 5 6.5 5H17.5C18.33 5 19 5.67 19 6.5V17.5C19 18.33 18.33 19 17.5 19H6.5C5.67 19 5 18.33 5 17.5V6.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8.5 10.2L10.4 12.1L15.5 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-[var(--accent)] pulse-dot"
        />
      </span>

      {showWordmark ? (
        <span
          className={cn(
            "font-semibold tracking-tight text-[var(--foreground)]",
            wordmarkClass,
          )}
        >
          Coherev<span className="text-[var(--primary)]">.</span>
        </span>
      ) : null}
    </div>
  );
}