import type { Metadata } from "next";
import { AreaRedirect } from "@/components/account/AreaRedirect";

export const metadata: Metadata = {
  title: "Area Personale | Survivor Arena",
  description: "Area personale placeholder di Survivor Arena.",
};

export default function AreaPersonalePage() {
  return <AreaRedirect />;
}
