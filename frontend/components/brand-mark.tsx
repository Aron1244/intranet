import { CoherevLogo } from "@/components/coherev-logo";

const SIZE_HEIGHTS: Record<"sm" | "md" | "lg", number> = {
  sm: 30,
  md: 40,
  lg: 52,
};

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** `light` para fondos oscuros o de color; `dark` para superficies claras. */
  tone?: "light" | "dark";
};

export function BrandMark({ className, size = "md", tone = "dark" }: BrandMarkProps) {
  return <CoherevLogo height={SIZE_HEIGHTS[size]} tone={tone} className={className} />;
}
