import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // sekunder – Claude-kall kan ta 20–30 sek for store dokumenter
import Anthropic from "@anthropic-ai/sdk";
import { buildQuoteRequestPrompt } from "@/lib/insurance/prompts";
import type { InsurancePolicy } from "@/lib/insurance/types";
import { extractJson } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

const client = new Anthropic();

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

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildQuoteRequestPrompt(body.policies, body.additionalRequirements),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Arvid fikk litt for mye å jobbe med på en gang. Prøv med færre forsikringer, eller ta kontakt." },
        { status: 422 }
      );
    }

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    let quoteRequest: unknown;
    try {
      quoteRequest = JSON.parse(extractJson(text));
    } catch {
      return NextResponse.json(
        { error: "Noe gikk galt under genereringen. Prøv igjen." },
        { status: 502 }
      );
    }

    return NextResponse.json({ quoteRequest });
  } catch (error) {
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
        { error: "Noe gikk galt under genereringen. Prøv igjen." },
        { status: 502 }
      );
    }

    console.error("Genereringsfeil:", error);
    return NextResponse.json(
      { error: "Noe gikk galt under genereringen. Prøv igjen." },
      { status: 500 }
    );
  }
}
