import { normalizeCompany } from "./insurance/company";
import type { InsurancePolicy } from "./insurance/types";

// Summerer årlig premie for en liste poliser.
// Bundlede priser telles kun én gang per unik selskap+pris-kombinasjon.
export function sumPolicies(policies: InsurancePolicy[]): number {
  const seenBundles = new Set<string>();
  return policies.reduce((sum, p) => {
    if (p.annualPremium == null) return sum;
    if (p.isBundledPremium) {
      const key = `${normalizeCompany(p.company)}:${p.annualPremium}`;
      if (seenBundles.has(key)) return sum;
      seenBundles.add(key);
    }
    return sum + p.annualPremium;
  }, 0);
}
