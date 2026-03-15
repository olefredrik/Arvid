import type { InsurancePolicy } from "./insurance/types";

// Trekker ut JSON fra tekst som kan være pakket inn i markdown-kodeblokker
export function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// Summerer årlig premie for en liste poliser.
// Bundlede priser telles kun én gang per unik selskap+pris-kombinasjon.
export function sumPolicies(policies: InsurancePolicy[]): number {
  const seenBundles = new Set<string>();
  return policies.reduce((sum, p) => {
    if (p.annualPremium == null) return sum;
    if (p.isBundledPremium) {
      const key = `${p.company}:${p.annualPremium}`;
      if (seenBundles.has(key)) return sum;
      seenBundles.add(key);
    }
    return sum + p.annualPremium;
  }, 0);
}
