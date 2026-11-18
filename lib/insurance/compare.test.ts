import { describe, it, expect } from "vitest";
import { planComparison } from "./compare";
import type { InsurancePolicy } from "./types";

function policy(overrides: Partial<InsurancePolicy> & Record<string, unknown> = {}): InsurancePolicy {
  return {
    type: "car",
    company: "Frende",
    policyNumber: null,
    coverageLevel: "Kasko",
    deductible: 6000,
    maxCoverage: null,
    annualPremium: 10000,
    isBundledPremium: false,
    inclusions: [],
    exclusions: [],
    notes: [],
    extractionConfidence: "high",
    ...overrides,
  };
}

describe("planComparison", () => {
  it("summerer bare forsikringer som finnes i tilbudet", () => {
    // Fant i nettlesertest: nåværende bil+hus+hund mot tilbud på bare bil ga «−24 152 kr»
    const current = [
      policy({ type: "car", annualPremium: 14832 }),
      policy({ type: "house", annualPremium: 14616 }),
      policy({ type: "animal", annualPremium: 5604 }),
    ];
    const offers = [policy({ type: "car", company: "Testforsikring AS", annualPremium: 10900 })];

    const { priceSummaries, unmatchedCurrent } = planComparison(current, offers);

    expect(priceSummaries).toHaveLength(1);
    expect(priceSummaries[0]).toMatchObject({
      company: "Testforsikring AS",
      currentTotal: 14832,
      offerTotal: 10900,
      includedTypes: ["car"],
      excludedTypes: ["house", "animal"],
    });
    expect(unmatchedCurrent.map((p) => p.type)).toEqual(["house", "animal"]);
  });

  it("holder tilbud fra ulike selskaper adskilt", () => {
    const current = [policy({ type: "car", annualPremium: 12000 })];
    const offers = [
      policy({ type: "car", company: "If", annualPremium: 9000, deductible: 4000 }),
      policy({ type: "car", company: "Gjensidige", annualPremium: 11000, deductible: 8000 }),
    ];

    const { pairs, priceSummaries } = planComparison(current, offers);

    expect(pairs).toHaveLength(2);
    expect(pairs.map((p) => [p.offer.company, p.offer.annualPremium, p.premiumDiff])).toEqual([
      ["If", 9000, -3000],
      ["Gjensidige", 11000, -1000],
    ]);
    expect(new Set(pairs.map((p) => p.id)).size).toBe(2);
    expect(priceSummaries.map((s) => [s.company, s.currentTotal, s.offerTotal])).toEqual([
      ["If", 12000, 9000],
      ["Gjensidige", 12000, 11000],
    ]);
  });

  it("slår sammen tilbudsdokumenter fra samme selskap, også med ulik skrivemåte", () => {
    const current = [policy({ type: "house", annualPremium: 8000 })];
    const offers = [
      policy({ type: "house", company: "Frende", annualPremium: null }),
      policy({ type: "house", company: "Frende Skadeforsikring AS", annualPremium: 7000 }),
    ];

    const { pairs } = planComparison(current, offers);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].offerDocumentCount).toBe(2);
    expect(pairs[0].offer.annualPremium).toBe(7000);
  });

  it("kobler tilbud til riktig kjøretøy via registreringsnummer", () => {
    const current = [
      policy({ type: "car", registrationNumber: "AB 11111", annualPremium: 9000 }),
      policy({ type: "car", registrationNumber: "CD 22222", annualPremium: 7000 }),
    ];
    const offers = [
      policy({ type: "car", company: "If", registrationNumber: "CD22222", annualPremium: 6000 }),
      policy({ type: "car", company: "If", registrationNumber: "ab 11111", annualPremium: 8500 }),
    ];

    const { pairs, unmatchedCurrent, priceSummaries } = planComparison(current, offers);

    expect(pairs).toHaveLength(2);
    expect(pairs.map((p) => [p.current.annualPremium, p.offer.annualPremium])).toEqual([
      [7000, 6000],
      [9000, 8500],
    ]);
    expect(unmatchedCurrent).toHaveLength(0);
    expect(priceSummaries[0]).toMatchObject({ currentTotal: 16000, offerTotal: 14500 });
  });

  it("utelater par uten pris fra summen og sier fra om det", () => {
    const current = [
      policy({ type: "car", annualPremium: 10000 }),
      policy({ type: "travel", annualPremium: 2000 }),
    ];
    const offers = [
      policy({ type: "car", company: "If", annualPremium: 9000 }),
      policy({ type: "travel", company: "If", annualPremium: null }),
    ];

    const { priceSummaries } = planComparison(current, offers);

    expect(priceSummaries[0]).toMatchObject({
      currentTotal: 10000,
      offerTotal: 9000,
      includedTypes: ["car"],
      excludedTypes: ["travel"],
    });
  });

  it("gir ingen summer når ingen par har pris på begge sider", () => {
    const { priceSummaries } = planComparison(
      [policy({ annualPremium: null })],
      [policy({ company: "If", annualPremium: 9000 })]
    );
    expect(priceSummaries[0]).toMatchObject({ currentTotal: null, offerTotal: null });
  });

  it("flagger pakkepris i sammendraget", () => {
    const { priceSummaries } = planComparison(
      [policy({ type: "house", isBundledPremium: true }), policy({ type: "contents", isBundledPremium: true })],
      [policy({ type: "house", company: "If" })]
    );
    expect(priceSummaries[0].hasBundledPremium).toBe(true);
  });

  it("flagger når bare den ene prisen inkluderer trafikkforsikringsavgift", () => {
    const { priceSummaries } = planComparison(
      [policy({ premiumIncludesTrafficFee: true })],
      [policy({ company: "If", premiumIncludesTrafficFee: false }), policy({ company: "Tryg", premiumIncludesTrafficFee: true })]
    );
    expect(priceSummaries.map((s) => [s.company, s.hasTrafficFeeMismatch])).toEqual([
      ["If", true],
      ["Tryg", false],
    ]);
  });

  it("legger tilbud på typer brukeren ikke har i unmatchedOffers", () => {
    const { pairs, unmatchedOffers } = planComparison(
      [policy({ type: "car" })],
      [policy({ type: "car", company: "If" }), policy({ type: "boat", company: "If" })]
    );
    expect(pairs).toHaveLength(1);
    expect(unmatchedOffers.map((p) => p.type)).toEqual(["boat"]);
  });
});
