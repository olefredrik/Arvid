import { describe, it, expect } from "vitest";
import { normalizePolicy, parseAmount } from "./extract";
import type { InsurancePolicy } from "./types";

const policy = (overrides: Partial<InsurancePolicy> & Record<string, unknown>): InsurancePolicy => ({
  type: "house",
  company: "Testforsikring",
  policyNumber: null,
  coverageLevel: "Standard",
  deductible: null,
  maxCoverage: null,
  annualPremium: 5000,
  isBundledPremium: false,
  inclusions: [],
  exclusions: [],
  notes: [],
  extractionConfidence: "high",
  ...overrides,
});

describe("parseAmount", () => {
  it.each([
    ["8 604 000 kr", 8604000],
    ["2627280", 2627280],
    ["1.500.000 kroner", 1500000],
    ["3 000 000 NOK", 3000000],
    [450000, 450000],
  ])("tolker %s", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each([["Fullverdi"], ["8 604 000 kr, naturskade 708 kr"], [null], [""]])("gir null for %s", (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe("normalizePolicy", () => {
  it("fjerner pakkepris når dokumentet bare har én forsikringstype", () => {
    expect(normalizePolicy(policy({ isBundledPremium: true }), 1).isBundledPremium).toBe(false);
  });

  it("beholder pakkepris når dokumentet har flere typer", () => {
    expect(normalizePolicy(policy({ isBundledPremium: true }), 2).isBundledPremium).toBe(true);
  });

  it("bruker forsikringssummen for bygningen som maks dekning for hus og hytte", () => {
    expect(normalizePolicy(policy({ buildingValue: "8 604 000 kr" }), 1).maxCoverage).toBe(8604000);
    expect(normalizePolicy(policy({ type: "cabin", buildingValue: "2627280" }), 1).maxCoverage).toBe(2627280);
  });

  it("overskriver ikke maks dekning som allerede er satt", () => {
    expect(normalizePolicy(policy({ maxCoverage: 5000000, buildingValue: "8 604 000 kr" }), 1).maxCoverage).toBe(5000000);
  });

  it("rører ikke maks dekning for andre typer", () => {
    expect(normalizePolicy(policy({ type: "contents", contentsValue: "1 000 000 kr" }), 1).maxCoverage).toBeNull();
  });
});
