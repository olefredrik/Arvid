import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // sekunder – Claude-kall kan ta 20–30 sek for store dokumenter
import Anthropic from "@anthropic-ai/sdk";
import { extractTextFromPdf, normalizeText, prioritizeSections, TYPE_ID_TEXT_LENGTH } from "@/lib/pdf/parser";
import { buildTypeIdentificationPrompt, buildExtractionPrompt } from "@/lib/insurance/prompts";
import type { InsuranceType, InsurancePolicy } from "@/lib/insurance/types";
import { extractJson } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

const client = new Anthropic();

// Ekstraherer strukturert forsikringsdata fra en PDF-fil
// Ett dokument kan inneholde flere forsikringstyper (f.eks. hus + innbo)
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Du har sendt for mange forespørsler på kort tid. Vent litt og prøv igjen." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Det ser ut til at filen ikke fulgte med. Prøv igjen." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Arvid leser bare PDF-filer. Sjekk at du laster opp riktig filtype." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Filen er for stor. Arvid leser PDF-er opp til 4 MB – prøv å laste opp bare forsikringsbeviset, ikke hele vilkårsheftet." },
        { status: 413 }
      );
    }

    // Trekk ut og normaliser tekst fra PDF
    const buffer = Buffer.from(await file.arrayBuffer());

    // Sjekk magic bytes – alle gyldige PDF-filer starter med %PDF
    if (buffer.length < 4 || buffer.slice(0, 4).toString("ascii") !== "%PDF") {
      return NextResponse.json(
        { error: "Filen ser ikke ut til å være en gyldig PDF. Sjekk at du laster opp riktig fil." },
        { status: 400 }
      );
    }
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

    let typeResult: { types: InsuranceType[]; confidence: InsurancePolicy["extractionConfidence"]; reason: string };
    try {
      typeResult = JSON.parse(extractJson(typeText)) as typeof typeResult;
    } catch {
      return NextResponse.json(
        { error: "Arvid fant ingen gjenkjennelige forsikringstyper i dokumentet. Er det et forsikringsbevis eller en forsikringsavtale?" },
        { status: 422 }
      );
    }

    const detectedTypes = typeResult.types?.length ? typeResult.types : [];

    if (detectedTypes.length === 0) {
      return NextResponse.json(
        { error: "Arvid fant ingen gjenkjennelige forsikringstyper i dokumentet. Er det et forsikringsbevis eller en forsikringsavtale?" },
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
          max_tokens: 4096,
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

        let extracted: Record<string, unknown>;
        try {
          extracted = JSON.parse(extractJson(extractText));
        } catch {
          // Returner en tom polise med lav konfidens – spøkelsesfilteret fjerner den
          extracted = {};
        }

        const policy: InsurancePolicy = {
          type: insuranceType,
          company: (extracted.company as string) ?? "Ukjent selskap",
          policyNumber: (extracted.policyNumber as string | null) ?? null,
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

    // Filtrer ut spøkelsespoliser: lav konfidens og ingen nøkkeldata betyr at typen sannsynligvis ikke finnes i dokumentet
    const validPolicies = extractionResults.filter(
      (p) => !(p.extractionConfidence === "low" && p.annualPremium === null && p.deductible === null && (p.coverageLevel === "Ukjent" || p.coverageLevel === ""))
    );

    if (validPolicies.length === 0) {
      return NextResponse.json(
        { error: "Arvid fant ingen gjenkjennelige forsikringstyper i dokumentet. Er det et forsikringsbevis eller en forsikringsavtale?" },
        { status: 422 }
      );
    }

    return NextResponse.json({ policies: validPolicies, fileName: file.name });
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
        { error: "Noe gikk galt under analysen. Prøv igjen." },
        { status: 502 }
      );
    }

    console.error("Ekstraksjonsfeil:", error);
    return NextResponse.json(
      { error: "Noe gikk galt under analysen. Prøv igjen." },
      { status: 500 }
    );
  }
}
