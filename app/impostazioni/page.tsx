import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Impostazioni | Survivor Arena",
  description: "Impostazioni utente di Survivor Arena.",
};

export default function ImpostazioniPage() {
  return <UserAreaPage page="impostazioni" />;
}
