import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/public/HowItWorksPage";

export const metadata: Metadata = {
  title: "Come Funziona | Survivor Arena",
  description: "Scopri in pochi passaggi come funziona Survivor Arena.",
};

export default function ComeFunzionaPage() {
  return <HowItWorksPage />;
}
