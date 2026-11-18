import { describe, it, expect } from "vitest";
import { stripPriceInformation } from "./quote-input";
import { buildQuoteRequestPrompt } from "./prompts";
import type { InsurancePolicy } from "./types";

const policy = (overrides: Partial<InsurancePolicy> & Record<string, unknown> = {}): InsurancePolicy => ({
  _id: "intern-id",
  type: "house",
  company: "Testforsikring AS",
  policyNumber: "123",
  coverageLevel: "Standard",
  deductible: 6000,
  maxCoverage: 8604000,
  annualPremium: 14616,
  isBundledPremium: false,
  inclusions: [],
  exclusions: [],
  notes: [],
  extractionConfidence: "high",
  ...overrides,
});

describe("stripPriceInformation", () => {
  it("fjerner prisfelter og intern id", () => {
    const result = stripPriceInformation(policy({ premiumIncludesTrafficFee: true }));
    for (const key of ["annualPremium", "isBundledPremium", "premiumIncludesTrafficFee", "_id"]) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it("beholder dekning, egenandel og andre beløp som ikke er pris", () => {
    const result = stripPriceInformation(policy({ type: "animal", vetCoverage: "20 000 kr per år", maxCoverage: 20000 }));
    expect(result).toMatchObject({ deductible: 6000, maxCoverage: 20000, vetCoverage: "20 000 kr per år" });
  });

  it.each([
    ["Inkludert (naturskade med premie 708 kr per år)", "Inkludert"],
    ["Inkludert. Naturskade er dekket med egen premie på 216 kr per år.", "Inkludert."],
    ["Dekket med egenandel 8000 kroner. Pris for tillegget er 612 kr.", "Dekket med egenandel 8000 kroner."],
    ["Utbetaling inntil 100 000 kr ved totalskade", "Utbetaling inntil 100 000 kr ved totalskade"],
    ["Premie 708 kr per år", null],
  ])("tekstfelt: %s", (input, expected) => {
    expect(stripPriceInformation(policy({ naturalDamage: input })).naturalDamage).toBe(expected);
  });

  it("fjerner notater og listepunkter som nevner pris eller årspremien", () => {
    const result = stripPriceInformation(
      policy({
        notes: ["Pris per år 11 556 kr", "Totalt 14 616 kr", "Bygget i 1910", "Pakkerabatt 10 %", "Trafikkforsikringsavgift inkludert"],
        inclusions: ["Naturskade", "Råte og skadedyr (612 kr per år i tilleggspremie)"],
      })
    );
    expect(result.notes).toEqual(["Bygget i 1910"]);
    expect(result.inclusions).toEqual(["Naturskade"]);
  });

  it("endrer ikke forsikringstypen", () => {
    expect(stripPriceInformation(policy({ type: "car" })).type).toBe("car");
  });
});

describe("buildQuoteRequestPrompt", () => {
  it("sender ikke prisinformasjon til modellen", () => {
    const prompt = buildQuoteRequestPrompt([
      policy({ annualPremium: 98765, notes: ["Årspremie 98 765 kr", "Enebolig"], naturalDamage: "Inkludert (premie 708 kr)" }),
    ]);
    expect(prompt).not.toContain("98765");
    expect(prompt).not.toContain("98 765");
    expect(prompt).not.toContain("708");
    expect(prompt).not.toContain("annualPremium");
    expect(prompt).toContain("Enebolig");
  });
});
