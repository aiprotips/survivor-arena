import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Dashboard | Survivor Arena",
  description: "Dashboard utente di Survivor Arena.",
};

export default function DashboardPage() {
  return <UserAreaPage page="dashboard" />;
}
