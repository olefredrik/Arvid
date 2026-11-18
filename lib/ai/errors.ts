import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { AiOutputError } from "./client";

// Arvid er et gratis eksperiment med begrenset API-budsjett. Når budsjettet er brukt opp,
// skal brukeren få vite det, ikke tro at det er en kortvarig overbelastning.
export function isBudgetExhausted(error: InstanceType<typeof Anthropic.APIError>): boolean {
  if (error.status === 402 || error.type === "billing_error") return true;
  if (error.errorCode === "enforced_spend_limit_reached") return true;
  // Tom forhåndsbetalt kreditt har ingen stabil feilkode, bare meldingen
  // "Your credit balance is too low to access the Anthropic API". Meldingsteksten er derfor eneste signal.
  return /credit balance is too low/i.test(error.apiMessage ?? error.message);
}

type ErrorMessages = {
  // Vises når svaret ble kuttet fordi det ble for langt
  maxTokens: string;
  // Vises for alle andre feil
  generic: string;
};

// Gjør feil fra Claude-kall om til brukervennlige svar. Felles for alle API-rutene.
export function aiErrorResponse(error: unknown, messages: ErrorMessages, logLabel: string): NextResponse {
  if (error instanceof AiOutputError) {
    console.error(`${logLabel}:`, error.message);
    if (error.reason === "max_tokens") {
      return NextResponse.json({ error: messages.maxTokens, code: "too_long" }, { status: 422 });
    }
    if (error.reason === "refusal") {
      return NextResponse.json(
        { error: "Arvid klarte ikke å behandle dette innholdet. Prøv igjen, eller prøv med et annet dokument." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: messages.generic }, { status: 502 });
  }

  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    console.error(`${logLabel}: tidsavbrudd mot Claude`);
    return NextResponse.json(
      { error: "Arvid brukte for lang tid på å svare. Prøv igjen om litt." },
      { status: 504 }
    );
  }

  if (error instanceof Anthropic.APIError) {
    if (isBudgetExhausted(error)) {
      console.error(`${logLabel}: API-budsjettet er brukt opp`, error.status, error.errorCode ?? error.type);
      return NextResponse.json(
        {
          error: "Arvid har brukt opp budsjettet sitt for nå. Han er et gratis eksperiment uten inntekter, så det kan ta litt tid før han er tilbake. Prøv igjen senere.",
          code: "budget_exhausted",
        },
        { status: 503 }
      );
    }

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
    return NextResponse.json({ error: messages.generic }, { status: 502 });
  }

  console.error(`${logLabel}:`, error);
  return NextResponse.json({ error: messages.generic }, { status: 500 });
}
