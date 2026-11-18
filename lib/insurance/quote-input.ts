// Fjerner prisinformasjon fra en polise før den sendes til modellen som skriver tilbudsforespørselen.
// Prisen er privat: selskapene skal ikke få vite hva brukeren betaler i dag, og modellen skal ikke se den.
import type { InsurancePolicy } from "./types";

// Felter som bare handler om pris, eller som er interne for Arvid
const PRICE_FIELDS = new Set(["annualPremium", "isBundledPremium", "premiumIncludesTrafficFee", "_id"]);

// Ord som betyr at teksten handler om hva kunden betaler. Pris-, premie-, rabatt- og avgiftsord treffer også
// i sammensatte ord (tilleggspremie, pakkerabatt). Betalingsord krever ordstart, så "utbetaling" ikke treffer.
const PRICE_WORDS = /pris|premie|rabatt|avgift|\b(?:betaler|betales|betalt|betaling)\b/i;

const digitsOnly = (value: string) => value.replace(/[\s. ]/g, "");

// Om teksten nevner pris – med prisord, eller ved å gjenta selve årspremien
function mentionsPrice(text: string, premium: number | null): boolean {
  if (PRICE_WORDS.test(text)) return true;
  if (premium == null) return false;
  const numbers = text.match(/\d[\d\s. ]*\d|\d/g) ?? [];
  return numbers.some((n) => digitsOnly(n) === String(premium));
}

// Fjerner parenteser og setninger som nevner pris, men beholder resten av teksten
function stripPriceFromText(text: string, premium: number | null): string | null {
  const withoutParentheses = text.replace(/\s*\([^)]*\)/g, (part) => (mentionsPrice(part, premium) ? "" : part));
  const sentences = withoutParentheses.split(/(?<=[.;!?])\s+/);
  const kept = sentences.filter((s) => !mentionsPrice(s, premium)).join(" ").trim();
  return kept.length > 0 ? kept : null;
}

export function stripPriceInformation(policy: InsurancePolicy): Record<string, unknown> {
  const premium = policy.annualPremium;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(policy)) {
    if (PRICE_FIELDS.has(key)) continue;
    if (Array.isArray(value)) {
      result[key] = value.filter((item) => typeof item !== "string" || !mentionsPrice(item, premium));
    } else if (typeof value === "string" && key !== "type") {
      result[key] = stripPriceFromText(value, premium);
    } else {
      result[key] = value;
    }
  }
  return result;
}
