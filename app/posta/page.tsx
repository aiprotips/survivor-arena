import type { Metadata } from "next";
import { UserAreaPage } from "@/components/account/UserAreaPage";

export const metadata: Metadata = {
  title: "Posta | Survivor Arena",
  description: "Messaggi e comunicazioni ufficiali Survivor Arena.",
};

export default function PostaPage() {
  return <UserAreaPage page="posta" />;
}
