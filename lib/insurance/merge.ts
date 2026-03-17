// Slår sammen poliser som tilhører samme fysiske forsikringsavtale.
// Nøkkel: type + selskap + polisenummer. To biler fra samme selskap med ulike
// polisenumre forblir separate rader. Faller tilbake til type + selskap hvis
// polisenummer mangler, og til type alene hvis selskap også mangler.
import type { InsurancePolicy } from "./types";

// Tvetydig sammenslåing: 2+ poliser med samme type+selskap men uten polisenummer.
// Arvid kan ikke avgjøre om dette er samme avtale eller to separate – brukeren må bekrefte.
export type AmbiguousMerge = {
  merged: InsurancePolicy;
  originals: InsurancePolicy[];
};

export type MergeResult = {
  policies: InsurancePolicy[];
  ambiguous: AmbiguousMerge[];
};

function mergeKey(policy: InsurancePolicy): string {
  const parts: string[] = [policy.type];
  if (policy.company) parts.push(policy.company);
  if (policy.policyNumber) parts.push(policy.policyNumber);
  return parts.join("|");
}

export function mergePoliciesByType(policies: InsurancePolicy[]): MergeResult {
  const byKey = new Map<string, InsurancePolicy[]>();
  for (const policy of policies) {
    const key = mergeKey(policy);
    const group = byKey.get(key) ?? [];
    group.push(policy);
    byKey.set(key, group);
  }

  const resultPolicies: InsurancePolicy[] = [];
  const ambiguous: AmbiguousMerge[] = [];

  for (const group of byKey.values()) {
    const merged = mergePolicies(group);
    resultPolicies.push(merged);
    // Tvetydig: 2+ poliser uten polisenummer å skille dem på
    if (group.length >= 2 && group.every((p) => !p.policyNumber)) {
      ambiguous.push({ merged, originals: group });
    }
  }

  return { policies: resultPolicies, ambiguous };
}

export function mergePolicies(policies: InsurancePolicy[]): InsurancePolicy {
  if (policies.length === 1) return policies[0];
  // Slåtte poliser får ny _id siden de representerer en ny sammenslått enhet

  const first = <K extends keyof InsurancePolicy>(key: K) =>
    policies.find((p) => p[key] != null)?.[key];

  const bestConfidence = policies.some((p) => p.extractionConfidence === "high")
    ? "high"
    : policies.some((p) => p.extractionConfidence === "medium")
    ? "medium"
    : "low";

  return {
    _id: crypto.randomUUID(),
    type: policies[0].type,
    company: (first("company") as string) ?? "",
    policyNumber: (first("policyNumber") as string | null) ?? null,
    coverageLevel: (first("coverageLevel") as string) ?? "",
    deductible: (first("deductible") as number | null) ?? null,
    maxCoverage: (first("maxCoverage") as number | null) ?? null,
    annualPremium: (first("annualPremium") as number | null) ?? null,
    isBundledPremium: policies.some((p) => p.isBundledPremium),
    inclusions: [...new Set(policies.flatMap((p) => p.inclusions))],
    exclusions: [...new Set(policies.flatMap((p) => p.exclusions))],
    notes: [...new Set(policies.flatMap((p) => p.notes))],
    extractionConfidence: bestConfidence,
  };
}
