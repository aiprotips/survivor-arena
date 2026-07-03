"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { publicHomeImages } from "@/content/home";
import { useRuntimeImageSlotStyle } from "@/components/home/useRuntimeImageSlotStyle";

export function FinalCTASection() {
  const imageStyle = useRuntimeImageSlotStyle("public-home-final", "publicHomeFinal", publicHomeImages.finalCta);

  return (
    <section
      aria-labelledby="public-home-final-title"
      className="public-home-section public-home-final"
      data-image-slot="public-home.finalCta"
      style={imageStyle}
    >
      <div className="public-home-final-image" aria-hidden="true" />
      <div className="public-home-final-copy">
        <h2 id="public-home-final-title">
          La tua Arena.
          <span>Le tue regole.</span>
        </h2>
        <p>Invita, sfida, vinci. La leggenda comincia da qui.</p>
      </div>
      <ButtonLink className="public-home-final-button" href="/register">
        Crea la tua Arena
        <ArrowRight aria-hidden="true" className="public-home-button-icon" />
      </ButtonLink>
    </section>
  );
}
