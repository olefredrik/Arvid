import { describe, it, expect } from "vitest";
import { mergePolicies, mergePoliciesByType } from "./merge";
import type { InsurancePolicy } from "./types";

// Hjelpefunksjon for å lage en testpolise med standardverdier
function makePolicy(overrides: Partial<InsurancePolicy> = {}): InsurancePolicy {
  return {
    type: "car",
    company: "TestAS",
    policyNumber: null,
    coverageLevel: "Kasko",
    deductible: 4000,
    maxCoverage: null,
    annualPremium: 6000,
    isBundledPremium: false,
    inclusions: [],
    exclusions: [],
    notes: [],
    extractionConfidence: "high",
    ...overrides,
  };
}

describe("mergePolicies", () => {
  it("returnerer enkeltpolise uendret", () => {
    const policy = makePolicy();
    expect(mergePolicies([policy])).toBe(policy);
  });

  it("bruker første polisens company", () => {
    const a = makePolicy({ company: "Gjensidige" });
    const b = makePolicy({ company: "If" });
    expect(mergePolicies([a, b]).company).toBe("Gjensidige");
  });

  it("faller tilbake til andre polise for null-felt", () => {
    const a = makePolicy({ deductible: null, annualPremium: null });
    const b = makePolicy({ deductible: 3000, annualPremium: 5500 });
    const result = mergePolicies([a, b]);
    expect(result.deductible).toBe(3000);
    expect(result.annualPremium).toBe(5500);
  });

  it("slår sammen inclusions uten duplikater", () => {
    const a = makePolicy({ inclusions: ["Tyveri", "Brann"] });
    const b = makePolicy({ inclusions: ["Brann", "Vannskade"] });
    const result = mergePolicies([a, b]);
    expect(result.inclusions).toEqual(["Tyveri", "Brann", "Vannskade"]);
  });

  it("slår sammen exclusions uten duplikater", () => {
    const a = makePolicy({ exclusions: ["Krig"] });
    const b = makePolicy({ exclusions: ["Krig", "Kjernefysisk"] });
    const result = mergePolicies([a, b]);
    expect(result.exclusions).toEqual(["Krig", "Kjernefysisk"]);
  });

  it("slår sammen notes uten duplikater", () => {
    const a = makePolicy({ notes: ["Se vilkår §3"] });
    const b = makePolicy({ notes: ["Se vilkår §3", "Gjelder i Norden"] });
    const result = mergePolicies([a, b]);
    expect(result.notes).toEqual(["Se vilkår §3", "Gjelder i Norden"]);
  });

  it("setter isBundledPremium=true hvis én har det", () => {
    const a = makePolicy({ isBundledPremium: false });
    const b = makePolicy({ isBundledPremium: true });
    expect(mergePolicies([a, b]).isBundledPremium).toBe(true);
  });

  it("beholder isBundledPremium=false hvis ingen har det", () => {
    const a = makePolicy({ isBundledPremium: false });
    const b = makePolicy({ isBundledPremium: false });
    expect(mergePolicies([a, b]).isBundledPremium).toBe(false);
  });

  it("velger høyeste konfidensnivå: high trumfer alt", () => {
    const a = makePolicy({ extractionConfidence: "low" });
    const b = makePolicy({ extractionConfidence: "high" });
    expect(mergePolicies([a, b]).extractionConfidence).toBe("high");
  });

  it("velger medium over low", () => {
    const a = makePolicy({ extractionConfidence: "low" });
    const b = makePolicy({ extractionConfidence: "medium" });
    expect(mergePolicies([a, b]).extractionConfidence).toBe("medium");
  });

  it("beholder low hvis alle er low", () => {
    const a = makePolicy({ extractionConfidence: "low" });
    const b = makePolicy({ extractionConfidence: "low" });
    expect(mergePolicies([a, b]).extractionConfidence).toBe("low");
  });

  it("beholder type fra første polise", () => {
    const a = makePolicy({ type: "car" });
    const b = makePolicy({ type: "car" });
    expect(mergePolicies([a, b]).type).toBe("car");
  });
});

describe("mergePoliciesByType", () => {
  it("returnerer én polise per type", () => {
    const policies = [
      makePolicy({ type: "car", company: "A" }),
      makePolicy({ type: "car", company: "B" }),
      makePolicy({ type: "house", company: "C" }),
    ];
    const result = mergePoliciesByType(policies);
    expect(result).toHaveLength(2);
    const types = result.map((p) => p.type);
    expect(types).toContain("car");
    expect(types).toContain("house");
  });

  it("slår sammen poliser av samme type", () => {
    const policies = [
      makePolicy({ type: "contents", company: "If", annualPremium: null }),
      makePolicy({ type: "contents", company: "If", annualPremium: 2500 }),
    ];
    const result = mergePoliciesByType(policies);
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe("If");
    expect(result[0].annualPremium).toBe(2500);
  });

  it("håndterer tom liste", () => {
    expect(mergePoliciesByType([])).toEqual([]);
  });

  it("returnerer enkeltpolise uendret ved én per type", () => {
    const policy = makePolicy({ type: "travel" });
    const result = mergePoliciesByType([policy]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(policy);
  });
});
