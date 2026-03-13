import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rolf – Forsikringsrådgiver",
  description: "Forstå forsikringsavtalene dine og finn bedre tilbud",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
