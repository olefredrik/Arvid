import { describe, it, expect } from "vitest";
import { normalizeCompany } from "./company";

describe("normalizeCompany", () => {
  it.each([
    ["Frende", "frende"],
    ["Frende Skadeforsikring AS", "frende"],
    ["Gjensidige Forsikring ASA", "gjensidige"],
    ["If Skadeforsikring NUF", "if"],
    ["Fremtind Forsikring AS", "fremtind"],
    ["SpareBank 1 Forsikring", "sparebank 1"],
    ["Storebrand Forsikring AS", "storebrand"],
    ["  TRYG  forsikring ", "tryg"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeCompany(input)).toBe(expected);
  });

  it("beholder navnet når det bare består av generiske ord", () => {
    expect(normalizeCompany("Forsikring AS")).toBe("forsikring as");
  });

  it("håndterer tomme verdier", () => {
    expect(normalizeCompany("")).toBe("");
    expect(normalizeCompany(null)).toBe("");
  });
});
