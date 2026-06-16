import type { Metadata } from "next";
import { PublicAwareUserPage } from "@/components/public/PublicAwareUserPage";

export const metadata: Metadata = {
  title: "Classifiche | Survivor Arena",
  description: "Anteprima classifiche di Survivor Arena.",
};

export default function ClassifichePage() {
  return <PublicAwareUserPage page="classifiche" />;
}
