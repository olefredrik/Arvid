// Slår sammen poliser som tilhører samme fysiske forsikringsavtale.
// Nøkkel: type + selskap + polisenummer. To biler fra samme selskap med ulike
// polisenumre forblir separate rader. Faller tilbake til type + selskap hvis
// polisenummer mangler, og til type alene hvis selskap også mangler.
import type { InsurancePolicy } from "./types";

function mergeKey(policy: InsurancePolicy): string {
  const parts: string[] = [policy.type];
  if (policy.company) parts.push(policy.company);
  if (policy.policyNumber) parts.push(policy.policyNumber);
  return parts.join("|");
}

export function mergePoliciesByType(policies: InsurancePolicy[]): InsurancePolicy[] {
  const byKey = new Map<string, InsurancePolicy[]>();
  for (const policy of policies) {
    const key = mergeKey(policy);
    const group = byKey.get(key) ?? [];
    group.push(policy);
    byKey.set(key, group);
  }
  return [...byKey.values()].map(mergePolicies);
}

export function mergePolicies(policies: InsurancePolicy[]): InsurancePolicy {
  if (policies.length === 1) return policies[0];

  const first = <K extends keyof InsurancePolicy>(key: K) =>
    policies.find((p) => p[key] != null)?.[key];

  const bestConfidence = policies.some((p) => p.extractionConfidence === "high")
    ? "high"
    : policies.some((p) => p.extractionConfidence === "medium")
    ? "medium"
    : "low";

  return {
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
