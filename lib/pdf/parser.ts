import pdfParse from "pdf-parse";

// Maks tegn som sendes til Claude – tilsvarer ~25K tokens
const MAX_TEXT_LENGTH = 100_000;

// Ekstraher ren tekst fra en PDF-fil (Buffer)
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

// Rens og normaliser tekst fra PDF, og klipp til maks lengde
export function normalizeText(rawText: string): string {
  const cleaned = rawText
    .replace(/\r\n/g, "\n")      // Normaliser linjeskift
    .replace(/\n{3,}/g, "\n\n")  // Maks to linjeskift på rad
    .replace(/[ \t]+/g, " ")     // Normaliser mellomrom
    .trim();

  return cleaned.length > MAX_TEXT_LENGTH
    ? cleaned.slice(0, MAX_TEXT_LENGTH) + "\n\n[Dokumentet er forkortet for analyse]"
    : cleaned;
}
