import type { Metadata } from "next";
import { TelegramVerificationPage } from "@/components/account/TelegramVerificationPage";

export const metadata: Metadata = {
  description: "Verifica il tuo account Survivor Arena tramite Telegram.",
  title: "Verifica Telegram | Survivor Arena",
};

export default function VerificaTelegramPage() {
  return <TelegramVerificationPage />;
}
