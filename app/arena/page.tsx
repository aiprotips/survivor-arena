import type { Metadata } from "next";
import { Suspense } from "react";
import { ArenaDetailView } from "@/components/arena/ArenaDetailView";

export const metadata: Metadata = {
  title: "Arena | Survivor Arena",
  description: "Pagina torneo utente Survivor Arena.",
};

export default function ArenaPage() {
  return (
    <Suspense fallback={null}>
      <ArenaDetailView />
    </Suspense>
  );
}
