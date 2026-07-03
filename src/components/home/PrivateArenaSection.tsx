"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { publicHomeImages } from "@/content/home";
import { useRuntimeImageSlotStyle } from "@/components/home/useRuntimeImageSlotStyle";

export function PrivateArenaSection() {
  const imageStyle = useRuntimeImageSlotStyle("public-home-private", "publicHomePrivate", publicHomeImages.privateArena);

  return (
    <section
      aria-labelledby="public-home-private-title"
      className="public-home-section public-home-banner public-home-private"
      data-image-slot="public-home.privateArena"
      style={imageStyle}
    >
      <div className="public-home-banner-image" aria-hidden="true" />
      <div className="public-home-banner-copy">
        <span className="public-home-banner-icon" aria-hidden="true">
          <LockKeyhole />
        </span>
        <div>
          <h2 id="public-home-private-title">
            Arene <span>private</span>
          </h2>
          <p>Gioca solo con chi vuoi tu. Nessun estraneo, solo vera competizione.</p>
          <ButtonLink className="public-home-banner-button" href="/arene" variant="secondary">
            Scopri di piu
            <ArrowRight aria-hidden="true" className="public-home-button-icon" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
