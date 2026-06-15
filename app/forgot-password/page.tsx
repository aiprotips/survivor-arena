import type { Metadata } from "next";
import { ForgotPasswordView } from "@/components/login/ForgotPasswordView";

export const metadata: Metadata = {
  title: "Recupero Password | Survivor Arena",
  description: "Recupera la password Survivor Arena tramite Telegram.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
