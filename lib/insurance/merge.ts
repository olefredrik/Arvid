// Slår sammen flere poliser av samme type til én – tar beste tilgjengelige verdi per felt
import type { InsurancePolicy } from "./types";

export function mergePoliciesByType(policies: InsurancePolicy[]): InsurancePolicy[] {
  const byType = new Map<string, InsurancePolicy[]>();
  for (const policy of policies) {
    const group = byType.get(policy.type) ?? [];
    group.push(policy);
    byType.set(policy.type, group);
  }
  return [...byType.values()].map(mergePolicies);
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
