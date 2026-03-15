import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractTextFromPdf, normalizeText, prioritizeSections, TYPE_ID_TEXT_LENGTH } from "@/lib/pdf/parser";
import { buildTypeIdentificationPrompt, buildExtractionPrompt } from "@/lib/insurance/prompts";
import type { InsuranceType, InsurancePolicy } from "@/lib/insurance/types";

const client = new Anthropic();

// Fjern eventuelle markdown-kodeblokker fra Claude-respons før JSON.parse
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// Ekstraherer strukturert forsikringsdata fra en PDF-fil
// Ett dokument kan inneholde flere forsikringstyper (f.eks. hus + innbo)
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
    const documentText = prioritizeSections(rawText);              // ekstraksjon: høyverdi-seksjoner først
    const shortText = normalizeText(rawText, TYPE_ID_TEXT_LENGTH); // typeidentifikasjon: første N tegn

    if (!documentText) {
      return NextResponse.json(
        { error: "Kunne ikke lese tekst fra dokumentet. Er det en skannet PDF?" },
        { status: 422 }
      );
    }

    // Steg 1: Identifiser alle forsikringstyper i dokumentet
    const typeResponse = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: buildTypeIdentificationPrompt(shortText) }],
    });

    if (typeResponse.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Dokumentet er for langt for Arvid å lese i sin helhet. Prøv å laste opp bare forsikringsbeviset, ikke hele vilkårsheftet." },
        { status: 422 }
      );
    }

    const typeText =
      typeResponse.content.find((b) => b.type === "text")?.text ?? "";
    const typeResult = JSON.parse(extractJson(typeText)) as {
      types: InsuranceType[];
      confidence: InsurancePolicy["extractionConfidence"];
      reason: string;
    };

    const detectedTypes = typeResult.types?.length ? typeResult.types : [];

    if (detectedTypes.length === 0) {
      return NextResponse.json(
        { error: "Kunne ikke identifisere forsikringstype i dokumentet" },
        { status: 422 }
      );
    }

    // Steg 2: Ekstraher strukturert data for hver type som ble identifisert
    // Kjøres parallelt for å spare tid
    const extractionResults = await Promise.all(
      detectedTypes.map(async (insuranceType) => {
        const otherTypes = detectedTypes.filter((t) => t !== insuranceType);
        const extractResponse = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: buildExtractionPrompt(documentText, insuranceType, otherTypes),
            },
          ],
        });

        if (extractResponse.stop_reason === "max_tokens") {
          throw new Error("max_tokens");
        }

        const extractText =
          extractResponse.content.find((b) => b.type === "text")?.text ?? "";
        const extracted = JSON.parse(extractJson(extractText)) as Record<string, unknown>;

        const policy: InsurancePolicy = {
          type: insuranceType,
          company: (extracted.company as string) ?? "Ukjent selskap",
          coverageLevel: (extracted.coverageLevel as string) ?? "Ukjent",
          deductible: (extracted.deductible as number | null) ?? null,
          maxCoverage: (extracted.maxCoverage as number | null) ?? null,
          annualPremium: (extracted.annualPremium as number | null) ?? null,
          isBundledPremium: (extracted.isBundledPremium as boolean) ?? false,
          inclusions: (extracted.inclusions as string[]) ?? [],
          exclusions: (extracted.exclusions as string[]) ?? [],
          notes: (extracted.notes as string[]) ?? [],
          extractionConfidence: (extracted.extractionConfidence as InsurancePolicy["extractionConfidence"]) ?? typeResult.confidence ?? "low",
        };

        return policy;
      })
    );

    return NextResponse.json({ policies: extractionResults, fileName: file.name });
  } catch (error) {
    if (error instanceof Error && error.message === "max_tokens") {
      return NextResponse.json(
        { error: "Dokumentet er for langt for Arvid å lese i sin helhet. Prøv å laste opp bare forsikringsbeviset, ikke hele vilkårsheftet." },
        { status: 422 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API-feil:", error.status, error.message);
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Arvid håndterer en litt for stor bunke akkurat nå. Vent et øyeblikk og prøv igjen." },
          { status: 503 }
        );
      }
      if (error.status === 529) {
        return NextResponse.json(
          { error: "Arvid er midlertidig utilgjengelig. Prøv igjen om litt." },
          { status: 503 }
        );
      }
      if (error.status === 402) {
        return NextResponse.json(
          { error: "Arvid er midlertidig utilgjengelig. Prøv igjen senere." },
          { status: 503 }
        );
      }
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
