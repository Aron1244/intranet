import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

const LOGO_SRC = "/brand/logo.png";
const LOGO_ASPECT_RATIO = "562 / 374";

type CoherevLogoTone = "light" | "dark";

type CoherevLogoProps = {
  /** Alto del lockup en px. El ancho se deriva de la proporcion del asset. */
  height?: number;
  /**
   * `dark` pinta el logo con `--foreground` (oscuro en tema claro, claro en tema oscuro).
   * `light` lo pinta de blanco, para fondos oscuros o de color.
   */
  tone?: CoherevLogoTone;
  label?: string;
  className?: string;
};

const TONE_CLASSES: Record<CoherevLogoTone, string> = {
  light: "text-white",
  dark: "text-[var(--foreground)]",
};

const MASK_STYLE: CSSProperties = {
  maskImage: `url(${LOGO_SRC})`,
  WebkitMaskImage: `url(${LOGO_SRC})`,
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

/**
 * Lockup oficial de Coherev (isotipo + wordmark) renderizado desde
 * `public/brand/logo.png`. El asset es blanco sobre transparente, asi que se usa
 * como mascara y el color lo aporta `bg-current`, igual que el texto que lo rodea.
 */
export function CoherevLogo({
  height = 40,
  tone = "dark",
  label = "Coherev",
  className,
}: CoherevLogoProps) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{ ...MASK_STYLE, height, aspectRatio: LOGO_ASPECT_RATIO }}
      className={cn("inline-block shrink-0 bg-current", TONE_CLASSES[tone], className)}
    />
  );
}