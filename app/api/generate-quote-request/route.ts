import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildQuoteRequestPrompt } from "@/lib/insurance/prompts";
import type { InsurancePolicy } from "@/lib/insurance/types";

const client = new Anthropic();

// Fjern eventuelle markdown-kodeblokker fra Claude-respons før JSON.parse
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// Genererer strukturert tilbudsforespørsel basert på ekstraherte forsikringsdata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      policies: InsurancePolicy[];
      additionalRequirements?: string;
    };

    if (!body.policies || body.policies.length === 0) {
      return NextResponse.json(
        { error: "Ingen forsikringsdata mottatt" },
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

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const quoteRequest = JSON.parse(extractJson(text));

    return NextResponse.json({ quoteRequest });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API-feil:", error.status, error.message);
      if (error.status === 402 || error.status === 529) {
        return NextResponse.json(
          { error: "Rolf er for øyeblikket utilgjengelig på grunn av høy trafikk. Prøv igjen om litt." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Feil under AI-generering. Prøv igjen." },
        { status: 502 }
      );
    }

    console.error("Genereringsfeil:", error);
    return NextResponse.json(
      { error: "Feil under generering av tilbudsforespørsel" },
      { status: 500 }
    );
  }
}
