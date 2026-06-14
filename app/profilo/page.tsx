import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Profilo | Survivor Arena",
  description: "Profilo utente di Survivor Arena.",
};

export default function ProfiloPage() {
  return <UserAreaPage page="profilo" />;
}
