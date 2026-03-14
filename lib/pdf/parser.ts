import pdfParse from "pdf-parse";

// Maks tegn for ekstraksjon (~3K tokens) og type-identifikasjon (~750 tokens)
// Holder begge kallene godt under 10K tokens/min-grensen på gratisplanen
export const EXTRACTION_TEXT_LENGTH = 12_000;
export const TYPE_ID_TEXT_LENGTH = 3_000;

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
