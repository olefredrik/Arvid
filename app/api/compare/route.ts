import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildComparisonPrompt } from "@/lib/insurance/prompts";
import type { InsurancePolicy, ComparisonResult, PolicyComparison } from "@/lib/insurance/types";
import { mergePolicies } from "@/lib/insurance/merge";

const client = new Anthropic();

// Fjern eventuelle markdown-kodeblokker fra Claude-respons før JSON.parse
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// Sammenligner nåværende forsikringer med mottatte tilbud
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      currentPolicies: InsurancePolicy[];
      offerPolicies: InsurancePolicy[];
    };

    const { currentPolicies, offerPolicies } = body;

    if (!currentPolicies?.length || !offerPolicies?.length) {
      return NextResponse.json(
        { error: "Mangler forsikringsdata" },
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
        { error: "Ingen forsikringstyper samsvarte mellom nåværende avtaler og tilbudet" },
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

    // Totalberegning – bundlede priser telles kun én gang per unik selskap+pris-kombinasjon
    function sumPolicies(policies: InsurancePolicy[]): number {
      const seenBundles = new Set<string>();
      return policies.reduce((sum, p) => {
        if (p.annualPremium == null) return sum;
        if (p.isBundledPremium) {
          const key = `${p.company}:${p.annualPremium}`;
          if (seenBundles.has(key)) return sum;
          seenBundles.add(key);
        }
        return sum + p.annualPremium;
      }, 0);
    }

    const currentTotal = sumPolicies(currentPolicies);
    const offerTotal = sumPolicies(matchedPairs.map((p) => p.offer));

    // AI-analyse av kvalitative forskjeller
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildComparisonPrompt(matchedPairs),
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const aiResult = JSON.parse(extractJson(text)) as {
      comparisons: {
        insuranceType: string;
        assessment: string;
        coverageDifferences: string[];
        verdict: "Bytt" | "Behold" | "Vurder";
      }[];
      recommendation: string;
    };

    // Bygg fullstendig sammenligningsresultat
    const comparisons: PolicyComparison[] = aiResult.comparisons.map((c) => {
      const pair = matchedPairs.find((p) => p.current.type === c.insuranceType);
      return {
        type: c.insuranceType as InsurancePolicy["type"],
        current: pair!.current,
        offer: pair!.offer,
        offerDocumentCount: pair?.offerDocumentCount ?? 1,
        premiumDiff: pair?.premiumDiff ?? null,
        assessment: c.assessment,
        coverageDifferences: c.coverageDifferences,
        verdict: c.verdict,
      };
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
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API-feil:", error.status, error.message);
      if (error.status === 402 || error.status === 529) {
        return NextResponse.json(
          { error: "Arvid er for øyeblikket utilgjengelig på grunn av høy trafikk. Prøv igjen om litt." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Feil under AI-analyse. Prøv igjen." },
        { status: 502 }
      );
    }

    console.error("Sammenligningsfeil:", error);
    return NextResponse.json(
      { error: "Feil under sammenligning av tilbud" },
      { status: 500 }
    );
  }
}
