import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Premi | Survivor Arena",
  description: "Premi utente di Survivor Arena.",
};

export default function PremiUtentePage() {
  return <UserAreaPage page="premi" />;
}
