import { describe, it, expect } from "vitest";
import { classifyExtractionError } from "./extraction-errors";

describe("classifyExtractionError", () => {
  it("viser generelle vilkår nøytralt", () => {
    expect(classifyExtractionError(422, { error: "lang tekst", code: "general_terms" })).toEqual({
      label: "Generelle vilkår, ikke et forsikringsbevis",
      errorType: "unrecognized",
    });
  });

  it("viser dokumenter uten forsikringsdata nøytralt", () => {
    expect(classifyExtractionError(422, { code: "no_types" }).errorType).toBe("unrecognized");
  });

  it("viser API-ets melding for for lange og uleselige dokumenter", () => {
    expect(classifyExtractionError(422, { error: "Dokumentet er for langt", code: "too_long" })).toEqual({
      label: "Dokumentet er for langt",
      errorType: "invalid",
    });
    expect(classifyExtractionError(422, { error: "Skannet PDF?", code: "no_text" }).errorType).toBe("invalid");
  });

  it("behandler ugyldige filer som invalid", () => {
    expect(classifyExtractionError(400, { error: "Bare PDF" }).errorType).toBe("invalid");
    expect(classifyExtractionError(413, { error: "For stor" }).errorType).toBe("invalid");
  });

  it("behandler serverfeil og tidsavbrudd som forbigående", () => {
    expect(classifyExtractionError(502, { error: "Noe gikk galt" })).toEqual({ label: "Noe gikk galt", errorType: "transient" });
    expect(classifyExtractionError(504, {}).label).toBe("Ukjent feil");
  });
});
