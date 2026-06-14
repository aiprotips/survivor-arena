import type { Metadata } from "next";
import { PersonalAreaView } from "@/components/account/PersonalAreaView";

export const metadata: Metadata = {
  title: "Area Personale | Survivor Arena",
  description: "Area personale placeholder di Survivor Arena.",
};

export default function AreaPersonalePage() {
  return <PersonalAreaView />;
}
