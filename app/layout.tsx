import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";
import Analytics from "@/components/analytics";
import StructuredData from "@/components/structured-data";

// Overskriftsfont: DM Serif Display – klassisk, høy kontrast, redaksjonell
const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

// Brødtekstfont: DM Sans – varm, ryddig, designet for å matche DM Serif Display
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arvid – Forstå forsikringene dine og bytt på egne premisser",
  description: "Forsikringsvilkår er kjedelige å lese. Last opp avtalene dine som PDF, få en strukturert oversikt, og generer en ferdig tilbudsforespørsel til andre selskaper. Gratis.",
  metadataBase: new URL("https://arvid.cloud"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Arvid – Forstå forsikringene dine og bytt på egne premisser",
    description: "Forsikringsvilkår er kjedelige å lese. Last opp avtalene dine som PDF, få en strukturert oversikt, og generer en ferdig tilbudsforespørsel til andre selskaper. Gratis.",
    url: "https://arvid.cloud",
    siteName: "Arvid",
    images: [
      {
        url: "/arvid-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Arvid – Din nøytrale forsikringsassistent",
      },
    ],
    locale: "nb_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arvid – Forstå forsikringene dine og bytt på egne premisser",
    description: "Forsikringsvilkår er kjedelige å lese. Last opp avtalene dine som PDF, få en strukturert oversikt, og generer en ferdig tilbudsforespørsel til andre selskaper. Gratis.",
    images: ["/arvid-og-image.jpg"],
  },
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
        <StructuredData />
      </head>
      <body className={`${dmSerifDisplay.variable} ${dmSans.variable} bg-amber-50 dark:bg-stone-950 transition-colors`}>
        {children}
        <ThemeToggle />
        <Analytics />
      </body>
    </html>
  );
}
