import type { Metadata } from "next";
import { LoginView } from "@/components/login/LoginView";

export const metadata: Metadata = {
  title: "Accedi | Survivor Arena",
  description: "Accedi al tuo conto Survivor Arena.",
};

export default function LoginPage() {
  return <LoginView />;
}
