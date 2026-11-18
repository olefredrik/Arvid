import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // sekunder – Claude-kall kan ta 20–30 sek for store dokumenter
import { extractTextFromPdf } from "@/lib/pdf/parser";
import { extractPolicies } from "@/lib/insurance/extract";
import { aiErrorResponse } from "@/lib/ai/errors";
import { checkRateLimit } from "@/lib/rate-limit";

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
    const outcome = await extractPolicies(rawText);

    if (outcome.status === "no_text") {
      return NextResponse.json(
        { error: "Kunne ikke lese tekst fra dokumentet. Er det en skannet PDF?", code: "no_text" },
        { status: 422 }
      );
    }

    if (outcome.status === "general_terms") {
      return NextResponse.json(
        { error: "Dette ser ut som generelle vilkår, som ikke sier noe om din avtale. Last opp forsikringsbeviset i stedet.", code: "general_terms" },
        { status: 422 }
      );
    }

    if (outcome.status === "no_types") {
      return NextResponse.json(
        { error: "Arvid fant ingen opplysninger om din forsikringsavtale i dokumentet. Er det generelle vilkår? Last opp forsikringsbeviset i stedet.", code: "no_types" },
        { status: 422 }
      );
    }

    return NextResponse.json({ policies: outcome.policies, fileName: file.name });
  } catch (error) {
    return aiErrorResponse(
      error,
      {
        maxTokens: "Dokumentet er for langt for Arvid å lese i sin helhet. Prøv å laste opp bare forsikringsbeviset, ikke hele vilkårsheftet.",
        generic: "Noe gikk galt under analysen. Prøv igjen.",
      },
      "Ekstraksjonsfeil"
    );
  }
}
