import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Arene | Survivor Arena",
  description: "Arene utente di Survivor Arena.",
};

export default function ArenePage() {
  return <UserAreaPage page="arene" />;
}
