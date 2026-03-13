import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractTextFromPdf, normalizeText, TYPE_ID_TEXT_LENGTH } from "@/lib/pdf/parser";
import { buildTypeIdentificationPrompt, buildExtractionPrompt } from "@/lib/insurance/prompts";
import type { InsuranceType, InsurancePolicy } from "@/lib/insurance/types";

const client = new Anthropic();

// Fjern eventuelle markdown-kodeblokker fra Claude-respons før JSON.parse
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// Ekstraherer strukturert forsikringsdata fra en PDF-fil
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ingen fil mottatt" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Kun PDF-filer støttes" }, { status: 400 });
    }

    // Trekk ut og normaliser tekst fra PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromPdf(buffer);
    const documentText = normalizeText(rawText);          // brukes til ekstraksjon
    const shortText = normalizeText(rawText, TYPE_ID_TEXT_LENGTH); // brukes til typeidentifikasjon

    if (!documentText) {
      return NextResponse.json(
        { error: "Kunne ikke lese tekst fra dokumentet. Er det en skannet PDF?" },
        { status: 422 }
      );
    }

    // Steg 1: Identifiser forsikringstype (trenger bare begynnelsen av dokumentet)
    const typeResponse = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: buildTypeIdentificationPrompt(shortText) }],
    });

    const typeText =
      typeResponse.content.find((b) => b.type === "text")?.text ?? "";
    const typeResult = JSON.parse(extractJson(typeText)) as {
      type: InsuranceType;
      confidence: InsurancePolicy["extractionConfidence"];
      reason: string;
    };

    // Steg 2: Ekstraher strukturert data med type-spesifikt skjema
    const extractResponse = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [
        { role: "user", content: buildExtractionPrompt(documentText, typeResult.type) },
      ],
    });

    const extractText =
      extractResponse.content.find((b) => b.type === "text")?.text ?? "";
    const extracted = JSON.parse(extractJson(extractText)) as Record<string, unknown>;

    const policy: InsurancePolicy = {
      type: typeResult.type,
      company: (extracted.company as string) ?? "Ukjent selskap",
      coverageLevel: (extracted.coverageLevel as string) ?? "Ukjent",
      deductible: (extracted.deductible as number | null) ?? null,
      maxCoverage: (extracted.maxCoverage as number | null) ?? null,
      annualPremium: (extracted.annualPremium as number | null) ?? null,
      inclusions: (extracted.inclusions as string[]) ?? [],
      exclusions: (extracted.exclusions as string[]) ?? [],
      notes: (extracted.notes as string[]) ?? [],
      extractionConfidence: typeResult.confidence ?? "low",
    };

    return NextResponse.json({ policy, fileName: file.name });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API-feil:", error.status, error.message);
      return NextResponse.json(
        { error: "Feil under AI-analyse. Prøv igjen." },
        { status: 502 }
      );
    }

    console.error("Ekstraksjonsfeil:", error);
    return NextResponse.json(
      { error: "Feil under analyse av dokument" },
      { status: 500 }
    );
  }
}
