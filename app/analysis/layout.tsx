import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyser forsikringene dine – Arvid",
  description: "Last opp forsikringsdokumentene dine og få en strukturert oversikt over dekning, egenandel og nøkkelinformasjon.",
  alternates: {
    canonical: "/analysis",
  },
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
