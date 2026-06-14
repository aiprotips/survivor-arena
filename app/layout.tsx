import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Survivor Arena",
  description: "Sopravvivi turno dopo turno nella Survivor Arena.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
