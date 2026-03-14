import { describe, it, expect } from "vitest";
import { normalizeText, EXTRACTION_TEXT_LENGTH } from "./parser";

describe("normalizeText", () => {
  it("trimmer whitespace i starten og slutten", () => {
    expect(normalizeText("  hei  ")).toBe("hei");
  });

  it("normaliserer Windows-linjeskift til Unix", () => {
    expect(normalizeText("linje1\r\nlinje2")).toBe("linje1\nlinje2");
  });

  it("reduserer tre eller flere linjeskift til to", () => {
    expect(normalizeText("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("normaliserer flere mellomrom til ett", () => {
    expect(normalizeText("for  mye   mellomrom")).toBe("for mye mellomrom");
  });

  it("normaliserer tabs til mellomrom", () => {
    expect(normalizeText("tekst\tmed\ttab")).toBe("tekst med tab");
  });

  it("returnerer tekst uendret hvis den er kortere enn maxLength", () => {
    const tekst = "kort tekst";
    expect(normalizeText(tekst)).toBe(tekst);
  });

  it("klipper tekst til maxLength og legger til avkortingsmelding", () => {
    const lang = "a".repeat(EXTRACTION_TEXT_LENGTH + 100);
    const result = normalizeText(lang);
    expect(result).toContain("[Dokumentet er forkortet for analyse]");
    expect(result.startsWith("a".repeat(EXTRACTION_TEXT_LENGTH))).toBe(true);
  });

  it("respekterer egendefinert maxLength", () => {
    const tekst = "a".repeat(20);
    const result = normalizeText(tekst, 10);
    expect(result).toContain("[Dokumentet er forkortet for analyse]");
  });

  it("håndterer tom streng", () => {
    expect(normalizeText("")).toBe("");
  });
});
