import type { CSSProperties } from "react";
import type { PublicHomeImageSlot } from "@/content/home";

export function getPublicHomeImageStyle(prefix: string, image: PublicHomeImageSlot) {
  return {
    [`--${prefix}-image`]: `url("${image.src}")`,
    [`--${prefix}-image-opacity`]: String(image.opacity),
    [`--${prefix}-image-position`]: image.objectPosition,
  } as CSSProperties;
}
