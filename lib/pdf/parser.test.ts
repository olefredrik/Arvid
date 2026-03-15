import { describe, it, expect } from "vitest";
import { normalizeText, prioritizeSections, EXTRACTION_TEXT_LENGTH } from "./parser";

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

describe("prioritizeSections", () => {
  it("legger seksjon med forsikringsbevis først", () => {
    const tekst = "Generelle vilkår\n\nDisse vilkårene gjelder for alle kunder.\n\nForsikringsbevis\n\nPolisenummer: 12345\nPremie: 5000 kr";
    const result = prioritizeSections(tekst);
    const forsikringsbevisPos = result.indexOf("Forsikringsbevis");
    const vilkårPos = result.indexOf("Generelle vilkår");
    expect(forsikringsbevisPos).toBeLessThan(vilkårPos);
  });

  it("legger seksjon med egenandel foran generell tekst", () => {
    const tekst = "Om selskapet\n\nVi er et stort selskap.\n\nEgenandel\n\nEgenandelen er 4000 kr.";
    const result = prioritizeSections(tekst);
    expect(result.indexOf("Egenandel")).toBeLessThan(result.indexOf("Om selskapet"));
  });

  it("bevarer rekkefølgen mellom seksjoner med likt score", () => {
    const tekst = "Seksjon A\n\nIngen nøkkelord her.\n\nSeksjon B\n\nHeller ikke her.";
    const result = prioritizeSections(tekst);
    expect(result.indexOf("Seksjon A")).toBeLessThan(result.indexOf("Seksjon B"));
  });

  it("klipper til maxLength og legger til avkortingsmelding", () => {
    const lang = "premie ".repeat(5000);
    const result = prioritizeSections(lang, 100);
    expect(result).toContain("[Dokumentet er forkortet for analyse]");
    expect(result.length).toBeLessThan(200);
  });

  it("håndterer tekst uten nøkkelord", () => {
    const tekst = "Ingen relevante ord her.\n\nBare generell tekst.";
    const result = prioritizeSections(tekst);
    expect(result).toContain("Ingen relevante ord her.");
    expect(result).toContain("Bare generell tekst.");
  });

  it("håndterer tom streng", () => {
    expect(prioritizeSections("")).toBe("");
  });
});
