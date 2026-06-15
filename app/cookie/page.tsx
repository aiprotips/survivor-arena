import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/PublicInfoPage";
import { publicPages } from "@/content/public-pages";

export const metadata: Metadata = {
  title: "Cookie | Survivor Arena",
  description: "Informativa cookie provvisoria di Survivor Arena.",
};

export default function CookiePage() {
  return <PublicInfoPage content={publicPages.cookie} />;
}
