// Tolker feilsvar fra /api/extract i nettleseren, slik at brukeren ser riktig forklaring

export type ExtractionErrorType = "unrecognized" | "invalid" | "transient";

export type ExtractionErrorResponse = { error?: string; code?: unknown };

// Dokumenter uten kundens avtale (f.eks. generelle vilkår) er normalt og vises nøytralt, ikke som feil
const UNRECOGNIZED_LABELS: Record<string, string> = {
  general_terms: "Generelle vilkår, ikke et forsikringsbevis",
  no_types: "Ingen forsikringsdata funnet",
};

export function classifyExtractionError(
  status: number,
  data: ExtractionErrorResponse
): { label: string; errorType: ExtractionErrorType } {
  const code = typeof data.code === "string" ? data.code : undefined;

  if (code && code in UNRECOGNIZED_LABELS) {
    return { label: UNRECOGNIZED_LABELS[code], errorType: "unrecognized" };
  }

  const label = data.error ?? "Ukjent feil";
  // Ugyldig fil, for langt eller uleselig dokument: å prøve samme fil på nytt hjelper ikke
  if (status === 400 || status === 413 || status === 422) {
    return { label, errorType: "invalid" };
  }
  return { label, errorType: "transient" };
}
