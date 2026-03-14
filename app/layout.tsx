import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";

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
      <head>
        {/* Forhindrer glimt av feil tema ved sideinnlasting */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      <body className="bg-white dark:bg-gray-950 transition-colors">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
