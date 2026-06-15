import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/PublicInfoPage";
import { publicPages } from "@/content/public-pages";

export const metadata: Metadata = {
  title: "Privacy | Survivor Arena",
  description: "Informativa privacy provvisoria di Survivor Arena.",
};

export default function PrivacyPage() {
  return <PublicInfoPage content={publicPages.privacy} />;
}
