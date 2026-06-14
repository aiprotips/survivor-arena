import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Classifiche | Survivor Arena",
  description: "Classifiche utente di Survivor Arena.",
};

export default function ClassifichePage() {
  return <UserAreaPage page="classifiche" />;
}
