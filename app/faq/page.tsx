import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/PublicInfoPage";
import { publicPages } from "@/content/public-pages";

export const metadata: Metadata = {
  title: "FAQ | Survivor Arena",
  description: "Domande frequenti su Survivor Arena.",
};

export default function FaqPage() {
  return <PublicInfoPage content={publicPages.faq} />;
}
