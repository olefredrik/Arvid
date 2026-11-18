// Normaliserer selskapsnavn slik at "Frende" og "Frende Skadeforsikring AS" regnes som samme selskap.
// Brukes bare som nøkkel ved sammenligning – navnet som vises til brukeren endres ikke.

// Selskapsform og generiske ord som ofte står etter merkenavnet
const GENERIC_WORDS = new Set(["as", "asa", "nuf", "skadeforsikring", "forsikring", "forsikringsselskap", "forsikringsselskapet"]);

export function normalizeCompany(name: string | null | undefined): string {
  if (!name) return "";
  const words = name
    .toLowerCase()
    .replace(/[.,()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !GENERIC_WORDS.has(w));
  // Hvis hele navnet var generiske ord, bruk det slik det er
  return (meaningful.length > 0 ? meaningful : words).join(" ");
}
