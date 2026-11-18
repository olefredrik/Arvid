import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // sekunder – Claude-kall kan ta 20–30 sek for store dokumenter
import { buildQuoteRequestPrompt } from "@/lib/insurance/prompts";
import { quoteRequestSchema } from "@/lib/insurance/ai-schemas";
import type { InsurancePolicy } from "@/lib/insurance/types";
import { generateStructured } from "@/lib/ai/client";
import { aiErrorResponse } from "@/lib/ai/errors";
import { checkRateLimit } from "@/lib/rate-limit";

// Genererer strukturert tilbudsforespørsel basert på ekstraherte forsikringsdata
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Du har sendt for mange forespørsler på kort tid. Vent litt og prøv igjen." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  try {
    const body = await request.json() as {
      policies: InsurancePolicy[];
      additionalRequirements?: string;
    };

    if (!body.policies || body.policies.length === 0) {
      return NextResponse.json(
        { error: "Arvid har ingen forsikringer å jobbe med. Prøv å starte analysen på nytt." },
        { status: 400 }
      );
    }

    const generated = await generateStructured({
      task: "quoteRequest",
      prompt: buildQuoteRequestPrompt(body.policies, body.additionalRequirements),
      schema: quoteRequestSchema,
    });

    // Sett generatedAt med faktisk servertid – Claude kjenner ikke dagens dato
    const quoteRequest = { ...generated, generatedAt: new Date().toISOString() };

    return NextResponse.json({ quoteRequest });
  } catch (error) {
    return aiErrorResponse(
      error,
      {
        maxTokens: "Arvid fikk litt for mye å jobbe med på en gang. Prøv med færre forsikringer, eller ta kontakt.",
        generic: "Noe gikk galt under genereringen. Prøv igjen.",
      },
      "Genereringsfeil"
    );
  }
}
