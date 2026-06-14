import type { Metadata } from "next";
import { AdminArenaPanel } from "@/components/admin/AdminArenaPanel";

export const metadata: Metadata = {
  title: "Admin Arena | Survivor Arena",
  description: "Pannello admin per gestire tornei Survivor Arena.",
};

export default function AdminPage() {
  return <AdminArenaPanel />;
}
