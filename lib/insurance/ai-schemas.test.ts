import { describe, it, expect } from "vitest";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { buildExtractionSchema, buildComparisonSchema, quoteRequestSchema, typeIdentificationSchema } from "./ai-schemas";
import { EXTRACTION_SCHEMAS } from "./schema";
import { INSURANCE_TYPES, INSURANCE_TYPE_LABELS } from "./types";

describe("INSURANCE_TYPES", () => {
  it("inneholder alle typer med norsk navn", () => {
    expect([...INSURANCE_TYPES].sort()).toEqual(Object.keys(INSURANCE_TYPE_LABELS).sort());
  });
});

describe("buildExtractionSchema", () => {
  it.each(INSURANCE_TYPES)("lager et gyldig output-format for %s", (type) => {
    const format = zodOutputFormat(buildExtractionSchema(type));
    const properties = Object.keys((format.schema as { properties: object }).properties);

    // Alle felter fra schema.ts skal være med, i tillegg til kjernefeltene
    for (const field of EXTRACTION_SCHEMAS[type].fields) {
      expect(properties).toContain(field.key);
    }
    expect(properties).toEqual(expect.arrayContaining(["inclusions", "exclusions", "notes", "extractionConfidence"]));
  });

  it("har flagg for trafikkforsikringsavgift bare for kjøretøy", () => {
    const keys = (type: Parameters<typeof buildExtractionSchema>[0]) => Object.keys(buildExtractionSchema(type).shape);
    expect(keys("car")).toContain("premiumIncludesTrafficFee");
    expect(keys("motorcycle")).toContain("premiumIncludesTrafficFee");
    expect(keys("house")).not.toContain("premiumIncludesTrafficFee");
    expect(keys("travel")).not.toContain("premiumIncludesTrafficFee");
  });

  it("godtar et typisk svar og avviser feil konfidens", () => {
    const schema = buildExtractionSchema("car");
    const base = {
      company: "If", policyNumber: null, renewalDate: null, coverageLevel: "Kasko",
      deductible: 6000, maxCoverage: null, annualPremium: 8400, isBundledPremium: false, premiumIncludesTrafficFee: true,
      registrationNumber: "AB 12345", vehicleModel: "Toyota RAV4", vehicleYear: "2022",
      vehicleUsage: null, driverAge: null, roadside: "Ja", rentalCar: null, glassCoverage: null, parkingDamage: null,
      inclusions: [], exclusions: [], notes: [], extractionConfidence: "high",
    };
    expect(schema.safeParse(base).success).toBe(true);
    expect(schema.safeParse({ ...base, extractionConfidence: "sikker" }).success).toBe(false);
  });
});

describe("øvrige skjemaer", () => {
  it("typeidentifisering godtar bare kjente typer", () => {
    const valid = { documentKind: "certificate", types: ["car"], confidence: "high", reason: "" };
    expect(typeIdentificationSchema.safeParse(valid).success).toBe(true);
    expect(typeIdentificationSchema.safeParse({ ...valid, types: ["romskip"] }).success).toBe(false);
    expect(typeIdentificationSchema.safeParse({ ...valid, documentKind: "brosjyre" }).success).toBe(false);
  });

  it("sammenligning godtar bare parene som sammenlignes", () => {
    const schema = buildComparisonSchema(["p1", "p2"]);
    const result = (pairId: string) =>
      schema.safeParse({
        comparisons: [{ pairId, assessment: "", coverageDifferences: [], verdict: "Behold" }],
        recommendation: "",
      }).success;
    expect(result("p2")).toBe(true);
    expect(result("p3")).toBe(false);
  });

  it("alle skjemaer kan gjøres om til output-format", () => {
    expect(() => zodOutputFormat(typeIdentificationSchema)).not.toThrow();
    expect(() => zodOutputFormat(quoteRequestSchema)).not.toThrow();
    expect(() => zodOutputFormat(buildComparisonSchema(["p1"]))).not.toThrow();
  });
});
