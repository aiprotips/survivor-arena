import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Lista Movimenti | Survivor Arena",
  description: "Lista movimenti utente di Survivor Arena.",
};

export default function MovimentiPage() {
  return <UserAreaPage page="movimenti" />;
}
