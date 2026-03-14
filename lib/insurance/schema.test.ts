import { describe, it, expect } from "vitest";
import { EXTRACTION_SCHEMAS } from "./schema";
import type { InsuranceType } from "./types";

// Alle støttede forsikringstyper
const ALL_TYPES: InsuranceType[] = [
  "house", "cabin", "contents",
  "car", "vintage-car", "deregistered-vehicle", "russ-car",
  "motorhome", "caravan", "moped", "atv", "motorcycle",
  "e-scooter", "snowmobile", "trailer", "bicycle",
  "boat", "drone", "bunad", "animal", "travel",
];

describe("EXTRACTION_SCHEMAS", () => {
  it("har skjema for alle støttede forsikringstyper", () => {
    for (const type of ALL_TYPES) {
      expect(EXTRACTION_SCHEMAS[type], `Mangler skjema for ${type}`).toBeDefined();
    }
  });

  it("hvert skjema har minst ett felt", () => {
    for (const type of ALL_TYPES) {
      expect(EXTRACTION_SCHEMAS[type].fields.length).toBeGreaterThan(0);
    }
  });

  it("hvert skjema inneholder de obligatoriske felles-feltene", () => {
    const requiredKeys = ["company", "coverageLevel"];
    for (const type of ALL_TYPES) {
      const keys = EXTRACTION_SCHEMAS[type].fields.map((f) => f.key);
      for (const key of requiredKeys) {
        expect(keys, `${type} mangler påkrevd felt: ${key}`).toContain(key);
      }
    }
  });

  it("alle felt-definisjoner har key, label og description", () => {
    for (const type of ALL_TYPES) {
      for (const field of EXTRACTION_SCHEMAS[type].fields) {
        expect(field.key, `${type}: felt mangler key`).toBeTruthy();
        expect(field.label, `${type}: felt mangler label`).toBeTruthy();
        expect(field.description, `${type}: felt mangler description`).toBeTruthy();
      }
    }
  });

  it("ingen duplikate felt-keys per skjema", () => {
    for (const type of ALL_TYPES) {
      const keys = EXTRACTION_SCHEMAS[type].fields.map((f) => f.key);
      const unique = new Set(keys);
      expect(unique.size, `${type} har duplikate felt-keys`).toBe(keys.length);
    }
  });

  it("type-feltet i skjemaet matcher nøkkelen", () => {
    for (const type of ALL_TYPES) {
      expect(EXTRACTION_SCHEMAS[type].type).toBe(type);
    }
  });
});
