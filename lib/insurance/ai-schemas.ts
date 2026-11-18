// Svarskjemaer for structured outputs – Claude må svare i nøyaktig dette formatet
import { z } from "zod";
import { EXTRACTION_SCHEMAS } from "./schema";
import { INSURANCE_CATEGORIES, INSURANCE_TYPES, type InsuranceType } from "./types";

const confidenceSchema = z.enum(["high", "medium", "low"]);

// Hva slags dokument det er. Generelle vilkår avvises i koden, fordi de ikke sier noe om kundens avtale.
export const DOCUMENT_KINDS = ["certificate", "general_terms", "offer", "other"] as const;

export const typeIdentificationSchema = z.object({
  documentKind: z.enum(DOCUMENT_KINDS),
  types: z.array(z.enum(INSURANCE_TYPES)),
  confidence: confidenceSchema,
  reason: z.string().describe("Kort forklaring på norsk"),
});

// Felter med fast datatype i InsurancePolicy. Øvrige felter fra EXTRACTION_SCHEMAS blir tekst eller null.
const numberFields = new Set(["deductible", "maxCoverage", "annualPremium"]);
const coreFields = new Set(["company", "policyNumber", "coverageLevel", "isBundledPremium", ...numberFields]);

// Bygger skjema for ekstraksjon av én forsikringstype, med feltbeskrivelsene fra schema.ts
export const buildExtractionSchema = (insuranceType: InsuranceType) => {
  const fields = EXTRACTION_SCHEMAS[insuranceType].fields;
  const describe = (key: string) => fields.find((f) => f.key === key)?.description ?? key;

  const typeSpecific: Record<string, z.ZodType> = {};
  for (const field of fields) {
    if (!coreFields.has(field.key)) {
      typeSpecific[field.key] = z.string().nullable().describe(field.description);
    }
  }

  return z.object({
    company: z.string().describe(describe("company")),
    policyNumber: z.string().nullable().describe(describe("policyNumber")),
    coverageLevel: z.string().describe(describe("coverageLevel")),
    deductible: z.number().nullable().describe(describe("deductible")),
    maxCoverage: z.number().nullable().describe(describe("maxCoverage")),
    annualPremium: z.number().nullable().describe(describe("annualPremium")),
    isBundledPremium: z.boolean().describe(describe("isBundledPremium")),
    ...(INSURANCE_CATEGORIES["Kjøretøy"].includes(insuranceType)
      ? {
          premiumIncludesTrafficFee: z
            .boolean()
            .describe("true hvis annualPremium inkluderer trafikkforsikringsavgift til staten, ellers false"),
        }
      : {}),
    ...typeSpecific,
    inclusions: z.array(z.string()),
    exclusions: z.array(z.string()),
    notes: z.array(z.string()),
    extractionConfidence: confidenceSchema,
  });
};

export const quoteRequestSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string().describe("Innhold som ren tekst"),
    })
  ),
});

// pairId begrenses til parene som faktisk sammenlignes, så hvert svar kan kobles til riktig par
export const buildComparisonSchema = (pairIds: [string, ...string[]]) =>
  z.object({
    comparisons: z.array(
      z.object({
        pairId: z.enum(pairIds),
        assessment: z.string(),
        coverageDifferences: z.array(z.string()),
        verdict: z.enum(["Bytt", "Behold", "Vurder"]),
      })
    ),
    recommendation: z.string(),
  });
