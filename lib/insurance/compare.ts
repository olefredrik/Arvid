// Kobler mottatte tilbud mot nåværende forsikringer og beregner prissammendrag per tilbudsselskap.
// Ren logikk uten Claude-kall, slik at den kan testes isolert.
import { normalizeCompany } from "./company";
import { mergePolicies } from "./merge";
import type { InsurancePolicy, InsuranceType, PriceSummary } from "./types";
import { sumPolicies } from "../utils";

export type ComparisonPair = {
  id: string;
  current: InsurancePolicy;
  offer: InsurancePolicy;
  offerDocumentCount: number;
  premiumDiff: number | null;
};

export type ComparisonPlan = {
  pairs: ComparisonPair[];
  unmatchedCurrent: InsurancePolicy[];
  unmatchedOffers: InsurancePolicy[];
  priceSummaries: PriceSummary[];
};

const normalizeRegistration = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s/g, "").toUpperCase() : "";

// Velger hvilken nåværende polise et tilbud skal sammenlignes med.
// Ved flere av samme type (f.eks. to biler) brukes registreringsnummer når det finnes.
function findCurrentFor(offer: InsurancePolicy, currentPolicies: InsurancePolicy[]): InsurancePolicy | undefined {
  const candidates = currentPolicies.filter((p) => p.type === offer.type);
  if (candidates.length <= 1) return candidates[0];

  const offerReg = normalizeRegistration((offer as Record<string, unknown>).registrationNumber);
  if (offerReg) {
    const match = candidates.find(
      (p) => normalizeRegistration((p as Record<string, unknown>).registrationNumber) === offerReg
    );
    if (match) return match;
  }
  return candidates[0];
}

export function planComparison(currentPolicies: InsurancePolicy[], offerPolicies: InsurancePolicy[]): ComparisonPlan {
  // Tilbud fra samme selskap og av samme type kan være fordelt på flere dokumenter – slå dem sammen.
  // Tilbud fra ulike selskaper holdes adskilt, slik at de kan sammenlignes mot hverandre.
  const offerGroups = new Map<string, InsurancePolicy[]>();
  for (const offer of offerPolicies) {
    // Registreringsnummer skiller tilbud på ulike kjøretøy fra samme selskap
    const registration = normalizeRegistration((offer as Record<string, unknown>).registrationNumber);
    const key = `${offer.type}|${normalizeCompany(offer.company)}|${registration}`;
    offerGroups.set(key, [...(offerGroups.get(key) ?? []), offer]);
  }

  const pairs: ComparisonPair[] = [];
  const unmatchedOffers: InsurancePolicy[] = [];

  for (const group of offerGroups.values()) {
    const offer = mergePolicies(group);
    const current = findCurrentFor(offer, currentPolicies);
    if (!current) {
      unmatchedOffers.push(offer);
      continue;
    }
    pairs.push({
      id: `p${pairs.length + 1}`,
      current,
      offer,
      offerDocumentCount: group.length,
      premiumDiff:
        current.annualPremium != null && offer.annualPremium != null
          ? offer.annualPremium - current.annualPremium
          : null,
    });
  }

  const pairedCurrent = new Set(pairs.map((p) => p.current));
  const unmatchedCurrent = currentPolicies.filter((p) => !pairedCurrent.has(p));

  return { pairs, unmatchedCurrent, unmatchedOffers, priceSummaries: summarizePrices(pairs, currentPolicies) };
}

// Ett prissammendrag per tilbudsselskap. Bare forsikringer som finnes i tilbudet og har pris
// på begge sider tas med, slik at summene faktisk er sammenlignbare.
function summarizePrices(pairs: ComparisonPair[], currentPolicies: InsurancePolicy[]): PriceSummary[] {
  const byCompany = new Map<string, ComparisonPair[]>();
  for (const pair of pairs) {
    const key = normalizeCompany(pair.offer.company);
    byCompany.set(key, [...(byCompany.get(key) ?? []), pair]);
  }

  return [...byCompany.values()].map((companyPairs) => {
    const priced = companyPairs.filter((p) => p.premiumDiff != null);
    const includedCurrent = [...new Set(priced.map((p) => p.current))];
    const includedTypes = [...new Set(priced.map((p) => p.current.type))];

    // Nåværende forsikringer som ikke er med i denne summen, enten fordi tilbudet mangler dem eller fordi pris mangler
    const excludedTypes: InsuranceType[] = [
      ...new Set(currentPolicies.filter((p) => !includedCurrent.includes(p)).map((p) => p.type)),
    ];

    const currentTotal = sumPolicies(includedCurrent);
    const offerTotal = sumPolicies(priced.map((p) => p.offer));

    return {
      company: companyPairs[0].offer.company,
      includedTypes,
      excludedTypes,
      currentTotal: priced.length > 0 ? currentTotal : null,
      offerTotal: priced.length > 0 ? offerTotal : null,
      // Pakkepriser dekker flere forsikringer, så summen kan inneholde mer enn det som sammenlignes
      hasBundledPremium: priced.some((p) => p.current.isBundledPremium || p.offer.isBundledPremium),
      hasTrafficFeeMismatch: priced.some(
        (p) => (p.current.premiumIncludesTrafficFee ?? false) !== (p.offer.premiumIncludesTrafficFee ?? false)
      ),
    };
  });
}
