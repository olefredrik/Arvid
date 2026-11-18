import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // sekunder – Claude-kall kan ta 20–30 sek for store dokumenter
import { buildComparisonPrompt } from "@/lib/insurance/prompts";
import { buildComparisonSchema } from "@/lib/insurance/ai-schemas";
import { generateStructured } from "@/lib/ai/client";
import { aiErrorResponse } from "@/lib/ai/errors";
import type { InsurancePolicy, ComparisonResult, PolicyComparison } from "@/lib/insurance/types";
import { mergePolicies } from "@/lib/insurance/merge";
import { sumPolicies } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";


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
    const body = await request.json() as {
      currentPolicies: InsurancePolicy[];
      offerPolicies: InsurancePolicy[];
    };

    const { currentPolicies, offerPolicies } = body;

    if (!currentPolicies?.length || !offerPolicies?.length) {
      return NextResponse.json(
        { error: "Arvid har ingen forsikringer å sammenligne. Prøv å starte analysen på nytt." },
        { status: 400 }
      );
    }

    // Grupper tilbudsdokumenter per forsikringstype og slå dem sammen
    const offersByType = new Map<string, InsurancePolicy[]>();
    for (const offer of offerPolicies) {
      const group = offersByType.get(offer.type) ?? [];
      group.push(offer);
      offersByType.set(offer.type, group);
    }
    const mergedOffers = new Map<string, { policy: InsurancePolicy; documentCount: number }>();
    for (const [type, group] of offersByType) {
      mergedOffers.set(type, { policy: mergePolicies(group), documentCount: group.length });
    }

    // Match sammenslåtte tilbud mot nåværende poliser
    type MatchedPair = {
      current: InsurancePolicy;
      offer: InsurancePolicy;
      offerDocumentCount: number;
      premiumDiff: number | null;
    };
    const matchedPairs: MatchedPair[] = [];
    const unmatchedCurrent: InsurancePolicy[] = [];
    const matchedTypes = new Set<string>();

    for (const current of currentPolicies) {
      const merged = mergedOffers.get(current.type);
      if (merged) {
        const premiumDiff =
          current.annualPremium != null && merged.policy.annualPremium != null
            ? merged.policy.annualPremium - current.annualPremium
            : null;
        matchedPairs.push({
          current,
          offer: merged.policy,
          offerDocumentCount: merged.documentCount,
          premiumDiff,
        });
        matchedTypes.add(current.type);
      } else {
        unmatchedCurrent.push(current);
      }
    }

    if (matchedPairs.length === 0) {
      return NextResponse.json(
        { error: "Ingen av typene i tilbudet samsvarte med forsikringene dine. Sjekk at du har lastet opp riktig dokument." },
        { status: 400 }
      );
    }

    // Tilbud som ikke matchet noen nåværende polise
    const unmatchedOffers: InsurancePolicy[] = [];
    for (const [type, merged] of mergedOffers) {
      if (!matchedTypes.has(type)) {
        unmatchedOffers.push(merged.policy);
      }
    }

    const currentTotal = sumPolicies(currentPolicies);
    const offerTotal = sumPolicies(matchedPairs.map((p) => p.offer));

    // AI-analyse av kvalitative forskjeller
    const pairTypes = matchedPairs.map((p) => p.current.type) as [InsurancePolicy["type"], ...InsurancePolicy["type"][]];
    const aiResult = await generateStructured({
      task: "comparison",
      prompt: buildComparisonPrompt(matchedPairs, unmatchedCurrent, unmatchedOffers),
      schema: buildComparisonSchema(pairTypes),
    });

    // Bygg fullstendig sammenligningsresultat – hopp over svar som ikke kan kobles til et par
    const comparisons: PolicyComparison[] = aiResult.comparisons.flatMap((c) => {
      const pair = matchedPairs.find((p) => p.current.type === c.insuranceType);
      if (!pair) return [];
      return [{
        type: c.insuranceType,
        current: pair.current,
        offer: pair.offer,
        offerDocumentCount: pair.offerDocumentCount,
        premiumDiff: pair.premiumDiff,
        assessment: c.assessment,
        coverageDifferences: c.coverageDifferences,
        verdict: c.verdict,
      }];
    });

    const result: ComparisonResult = {
      comparisons,
      unmatchedCurrent,
      unmatchedOffers,
      currentTotal: currentTotal > 0 ? currentTotal : null,
      offerTotal: offerTotal > 0 ? offerTotal : null,
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
