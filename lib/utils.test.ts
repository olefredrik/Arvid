import { describe, it, expect } from "vitest";
import { extractJson } from "./utils";

describe("extractJson", () => {
  it("trekker ut JSON fra markdown-kodeblokk med json-tag", () => {
    const input = '```json\n{"types": ["car"]}\n```';
    expect(extractJson(input)).toBe('{"types": ["car"]}');
  });

  it("trekker ut JSON fra markdown-kodeblokk uten json-tag", () => {
    const input = '```\n{"types": ["car"]}\n```';
    expect(extractJson(input)).toBe('{"types": ["car"]}');
  });

  it("returnerer ren JSON direkte", () => {
    const input = '{"types": ["car"]}';
    expect(extractJson(input)).toBe('{"types": ["car"]}');
  });

  it("trekker ut JSON når det er tekst før og etter (buggen vi fikset)", () => {
    const input = 'Her er resultatet: {"types": ["car"]} Det var alt jeg fant.';
    const result = extractJson(input);
    expect(JSON.parse(result)).toEqual({ types: ["car"] });
  });

  it("trekker ut JSON-array", () => {
    const input = 'Resultatet er ["car", "contents"] som forventet.';
    const result = extractJson(input);
    expect(JSON.parse(result)).toEqual(["car", "contents"]);
  });

  it("håndterer nøstet JSON", () => {
    const input = '{"policy": {"type": "car", "premium": 6000}}';
    const result = extractJson(input);
    expect(JSON.parse(result)).toEqual({ policy: { type: "car", premium: 6000 } });
  });

  it("returnerer trimmet tekst som fallback når ingen JSON finnes", () => {
    const input = "  ingen json her  ";
    expect(extractJson(input)).toBe("ingen json her");
  });
});
