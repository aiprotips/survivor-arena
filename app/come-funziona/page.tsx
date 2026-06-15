import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/PublicInfoPage";
import { publicPages } from "@/content/public-pages";

export const metadata: Metadata = {
  title: "Come Funziona | Survivor Arena",
  description: "Scopri le regole base di Survivor Arena.",
};

export default function ComeFunzionaPage() {
  return <PublicInfoPage content={publicPages.howItWorks} />;
}
