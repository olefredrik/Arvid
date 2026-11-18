import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // sekunder – Claude-kall kan ta 20–30 sek for store dokumenter
import { buildComparisonPrompt } from "@/lib/insurance/prompts";
import { buildComparisonSchema } from "@/lib/insurance/ai-schemas";
import { generateStructured } from "@/lib/ai/client";
import { aiErrorResponse } from "@/lib/ai/errors";
import type { InsurancePolicy, ComparisonResult, PolicyComparison } from "@/lib/insurance/types";
import { planComparison } from "@/lib/insurance/compare";
import { checkRateLimit } from "@/lib/rate-limit";
import { compareBodySchema, parseJsonBody } from "@/lib/api/validation";


// Sammenligner nåværende forsikringer med mottatte tilbud
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Du har sendt for mange forespørsler på kort tid. Vent litt og prøv igjen." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  try {
    const parsed = await parseJsonBody(request, compareBodySchema, "Sammenligning");
    if (!parsed.ok) return parsed.response;
    const currentPolicies = parsed.data.currentPolicies as InsurancePolicy[];
    const offerPolicies = parsed.data.offerPolicies as InsurancePolicy[];

    if (!currentPolicies?.length || !offerPolicies?.length) {
      return NextResponse.json(
        { error: "Arvid har ingen forsikringer å sammenligne. Prøv å starte analysen på nytt." },
        { status: 400 }
      );
    }

    // Koble tilbud mot nåværende forsikringer – ett par per tilbudsselskap og forsikring
    const { pairs, unmatchedCurrent, unmatchedOffers, priceSummaries } = planComparison(currentPolicies, offerPolicies);

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: "Ingen av typene i tilbudet samsvarte med forsikringene dine. Sjekk at du har lastet opp riktig dokument." },
        { status: 400 }
      );
    }

    // AI-analyse av kvalitative forskjeller
    const pairIds = pairs.map((p) => p.id) as [string, ...string[]];
    const aiResult = await generateStructured({
      task: "comparison",
      prompt: buildComparisonPrompt(pairs, unmatchedCurrent, unmatchedOffers),
      schema: buildComparisonSchema(pairIds),
    });

    // Bygg fullstendig sammenligningsresultat i samme rekkefølge som parene
    const comparisons: PolicyComparison[] = pairs.flatMap((pair) => {
      const ai = aiResult.comparisons.find((c) => c.pairId === pair.id);
      if (!ai) return [];
      return [{
        id: pair.id,
        type: pair.current.type,
        current: pair.current,
        offer: pair.offer,
        offerDocumentCount: pair.offerDocumentCount,
        premiumDiff: pair.premiumDiff,
        assessment: ai.assessment,
        coverageDifferences: ai.coverageDifferences,
        verdict: ai.verdict,
      }];
    });

    const result: ComparisonResult = {
      comparisons,
      unmatchedCurrent,
      unmatchedOffers,
      priceSummaries,
      recommendation: aiResult.recommendation,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ comparison: result });
  } catch (error) {
    return aiErrorResponse(
      error,
      {
        maxTokens: "Arvid fikk litt for mye å jobbe med på en gang. Prøv med færre forsikringer, eller ta kontakt.",
        generic: "Noe gikk galt under sammenligningen. Prøv igjen.",
      },
      "Sammenligningsfeil"
    );
  }
}
