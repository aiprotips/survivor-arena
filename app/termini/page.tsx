import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/PublicInfoPage";
import { publicPages } from "@/content/public-pages";

export const metadata: Metadata = {
  title: "Termini e Condizioni | Survivor Arena",
  description: "Termini e condizioni provvisori di Survivor Arena.",
};

export default function TerminiPage() {
  return <PublicInfoPage content={publicPages.terms} />;
}
