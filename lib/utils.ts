import type { InsurancePolicy } from "./insurance/types";

// Trekker ut JSON fra tekst som kan være pakket inn i markdown-kodeblokker,
// eller som inneholder tekst før/etter JSON-blokken
export function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return codeBlock[1];

  // Finn første { eller [ og siste } eller ] for å håndtere tekst rundt JSON-blokken
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const lastBrace = text.lastIndexOf("}");
  const lastBracket = text.lastIndexOf("]");

  if (firstBrace !== -1 && lastBrace > firstBrace) return text.slice(firstBrace, lastBrace + 1);
  if (firstBracket !== -1 && lastBracket > firstBracket) return text.slice(firstBracket, lastBracket + 1);

  return text.trim();
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
