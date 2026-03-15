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
