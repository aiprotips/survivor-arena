import type { Metadata } from "next";
import { RegisterView } from "@/components/register/RegisterView";

export const metadata: Metadata = {
  title: "Registrati | Survivor Arena",
  description: "Crea il tuo account Survivor Arena.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
