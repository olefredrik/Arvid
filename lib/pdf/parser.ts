// Importerer direkte fra lib for å unngå at pdf-parse laster testfiler ved oppstart
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buffer: Buffer) => Promise<{ text: string }>;

// Maks tegn for ekstraksjon (~15K tokens) og type-identifikasjon (~2K tokens)
// claude-sonnet-4-6 har 200K kontekstvindu – økt grense gir vesentlig bedre dekning av lange forsikringsdokumenter
export const EXTRACTION_TEXT_LENGTH = 60_000;
export const TYPE_ID_TEXT_LENGTH = 8_000;

// Ekstraher ren tekst fra en PDF-fil (Buffer)
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

// Rens og normaliser tekst fra PDF, og klipp til ønsket lengde
export function normalizeText(rawText: string, maxLength = EXTRACTION_TEXT_LENGTH): string {
  const cleaned = rawText
    .replace(/\r\n/g, "\n")      // Normaliser linjeskift
    .replace(/\n{3,}/g, "\n\n")  // Maks to linjeskift på rad
    .replace(/[ \t]+/g, " ")     // Normaliser mellomrom
    .trim();

  return cleaned.length > maxLength
    ? cleaned.slice(0, maxLength) + "\n\n[Dokumentet er forkortet for analyse]"
    : cleaned;
}

// Nøkkelord som indikerer seksjoner med kundespesifikke data (høy verdi for ekstraksjon)
const HIGH_VALUE_PATTERNS = [
  /forsikringsbevis/i,
  /bevis om forsikring/i,
  /avtaledokument/i,
  /polisenummer/i,
  /avtalenummer/i,
  /forsikringstaker/i,
  /\bpremie\b/i,
  /terminpremie/i,
  /forfallsbeløp/i,
  /\begenandel\b/i,
  /gjelder fra/i,
  /gjelder til/i,
  /\bdekningsnivå\b/i,
];

// Prioriterer seksjoner med kundespesifikk informasjon foran generelle vilkår,
// slik at viktige felter ikke havner utenfor tegngrensen ved lange dokumenter
export function prioritizeSections(rawText: string, maxLength = EXTRACTION_TEXT_LENGTH): string {
  const cleaned = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  const sections = cleaned.split(/\n{2,}/);

  const scored = sections.map((section) => ({
    section,
    score: HIGH_VALUE_PATTERNS.reduce((sum, pattern) => sum + (pattern.test(section) ? 1 : 0), 0),
  }));

  // Stabil sortering: høy score først, bevar original rekkefølge ved likt score
  const sorted = scored
    .map((s, i) => ({ ...s, index: i }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((s) => s.section);

  const result = sorted.join("\n\n");

  return result.length > maxLength
    ? result.slice(0, maxLength) + "\n\n[Dokumentet er forkortet for analyse]"
    : result;
}
