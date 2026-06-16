import type { Metadata } from "next";
import { PublicAwareUserPage } from "@/components/public/PublicAwareUserPage";

export const metadata: Metadata = {
  title: "Arene | Survivor Arena",
  description: "Anteprima delle Arene di Survivor Arena.",
};

export default function ArenePage() {
  return <PublicAwareUserPage page="arene" />;
}
