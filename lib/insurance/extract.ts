// Ekstraksjonsflyten: tekst fra PDF → forsikringstyper → strukturerte poliser.
// Brukes av /api/extract og av eval-skriptene, slik at begge kjører nøyaktig samme kode.
import { generateStructured, type AiUsage } from "../ai/client";
import type { ModelSettings } from "../ai/models";
import { normalizeText, prioritizeSections, TYPE_ID_TEXT_LENGTH } from "../pdf/parser";
import { buildExtractionSchema, typeIdentificationSchema } from "./ai-schemas";
import { buildExtractionPrompt, buildTypeIdentificationPrompt } from "./prompts";
import type { InsurancePolicy } from "./types";

export type ExtractionOptions = {
  // Overstyrer modellvalg for typeidentifisering og ekstraksjon (brukes av eval)
  settings?: Partial<ModelSettings>;
  onUsage?: (usage: AiUsage) => void;
};

export type ExtractionOutcome =
  | { status: "ok"; policies: InsurancePolicy[] }
  | { status: "no_text" }
  | { status: "general_terms" }
  | { status: "no_types" };

// Tolker et rent beløp som "8 604 000 kr" eller "2627280". Tekst med mer enn et beløp gir null.
export const parseAmount = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const match = value.match(/^\s*(\d[\d \u00a0.]*)\s*(kr|kroner|NOK)?\.?\s*$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/[ \u00a0.]/g, ""));
  return Number.isFinite(amount) ? amount : null;
};

// Faste regler som ikke skal overlates til modellen
export const normalizePolicy = (policy: InsurancePolicy, typesInDocument: number): InsurancePolicy => {
  const result = { ...policy };

  // Pakkepris forutsetter flere forsikringstyper i samme dokument
  if (typesInDocument === 1) result.isBundledPremium = false;

  // For hus og hytte er forsikringssummen for bygningen det samme som maksimumsdekning
  if ((result.type === "house" || result.type === "cabin") && result.maxCoverage == null) {
    result.maxCoverage = parseAmount((policy as Record<string, unknown>).buildingValue);
  }

  return result;
};

export async function extractPolicies(rawText: string, options: ExtractionOptions = {}): Promise<ExtractionOutcome> {
  const documentText = prioritizeSections(rawText);              // ekstraksjon: høyverdi-seksjoner først
  const shortText = normalizeText(rawText, TYPE_ID_TEXT_LENGTH); // typeidentifikasjon: første N tegn

  if (!documentText) {
    return { status: "no_text" };
  }

  // Steg 1: Identifiser alle forsikringstyper i dokumentet
  const typeResult = await generateStructured({
    task: "typeIdentification",
    prompt: buildTypeIdentificationPrompt(shortText),
    schema: typeIdentificationSchema,
    ...options,
  });

  // Generelle vilkår sier ikke noe om kundens avtale, og støttes ikke
  if (typeResult.documentKind === "general_terms") {
    return { status: "general_terms" };
  }

  // Fjern duplikater i tilfelle modellen lister samme type to ganger
  const detectedTypes = [...new Set(typeResult.types)];
  if (detectedTypes.length === 0) {
    return { status: "no_types" };
  }

  // Steg 2: Ekstraher strukturert data for hver type som ble identifisert
  // Kjøres parallelt for å spare tid
  const policies = await Promise.all(
    detectedTypes.map(async (insuranceType) => {
      const otherTypes = detectedTypes.filter((t) => t !== insuranceType);
      const extracted = await generateStructured({
        task: "extraction",
        prompt: buildExtractionPrompt(documentText, insuranceType, otherTypes),
        schema: buildExtractionSchema(insuranceType),
        ...options,
      });

      // Typesspesifikke felter (f.eks. registrationNumber, vehicleModel) følger med,
      // slik at de sendes videre til tilbudsforespørselen
      return normalizePolicy({ ...extracted, type: insuranceType } as InsurancePolicy, detectedTypes.length);
    })
  );

  // Filtrer ut spøkelsespoliser: lav konfidens og ingen nøkkeldata betyr at typen sannsynligvis ikke finnes i dokumentet
  const validPolicies = policies.filter(
    (p) => !(p.extractionConfidence === "low" && p.annualPremium === null && p.deductible === null && (p.coverageLevel === "Ukjent" || p.coverageLevel === ""))
  );

  if (validPolicies.length === 0) {
    return { status: "no_types" };
  }

  return { status: "ok", policies: validPolicies };
}
