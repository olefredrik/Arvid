// Bruker pdfjs-dist legacy-bygg som fungerer i Node.js uten nettleserspesifikke API-er
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Pek til worker-filen slik at pdfjs kan kjøre i Node.js-kontekst
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url
).href;

// Maks tegn for ekstraksjon (~3K tokens) og type-identifikasjon (~750 tokens)
// Holder begge kallene godt under 10K tokens/min-grensen på gratisplanen
export const EXTRACTION_TEXT_LENGTH = 12_000;
export const TYPE_ID_TEXT_LENGTH = 3_000;

// Ekstraher ren tekst fra en PDF-fil (Buffer)
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str)
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n");
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
