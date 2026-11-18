import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { aiErrorResponse, isBudgetExhausted } from "./errors";
import { AiOutputError } from "./client";

// Lager en API-feil med samme form som svaret fra Anthropic API
const apiError = (status: number, type: string, message: string, errorCode?: string) =>
  Anthropic.APIError.generate(
    status,
    { type: "error", error: { type, message, ...(errorCode ? { details: { error_code: errorCode } } : {}) } },
    undefined,
    new Headers()
  );

const messages = { maxTokens: "For langt.", generic: "Noe gikk galt." };

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe("isBudgetExhausted", () => {
  it.each([
    ["402 billing_error", apiError(402, "billing_error", "Payment required")],
    ["429 med månedlig forbruksgrense", apiError(429, "rate_limit_error", "Spend limit reached", "enforced_spend_limit_reached")],
    ["400 med tom kreditt", apiError(400, "invalid_request_error", "Your credit balance is too low to access the Anthropic API.")],
  ])("gjenkjenner %s", (_, error) => {
    expect(isBudgetExhausted(error)).toBe(true);
  });

  it.each([
    ["vanlig 429", apiError(429, "rate_limit_error", "Rate limit exceeded")],
    ["529 overbelastet", apiError(529, "overloaded_error", "Overloaded")],
    ["400 ugyldig forespørsel", apiError(400, "invalid_request_error", "max_tokens: too large")],
  ])("tolker ikke %s som tomt budsjett", (_, error) => {
    expect(isBudgetExhausted(error)).toBe(false);
  });
});

describe("aiErrorResponse", () => {
  it("gir egen melding og kode når budsjettet er brukt opp", async () => {
    const response = aiErrorResponse(apiError(402, "billing_error", "Payment required"), messages, "test");
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("budget_exhausted");
    expect(body.error).toContain("brukt opp budsjettet");
  });

  it("beholder meldingen om stor pågang ved vanlig 429", async () => {
    const response = aiErrorResponse(apiError(429, "rate_limit_error", "Rate limit exceeded"), messages, "test");
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("litt for stor bunke");
  });

  it("gir 422 med koden too_long når svaret blir kuttet", async () => {
    const response = aiErrorResponse(new AiOutputError("max_tokens", "extraction"), messages, "test");
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "For langt.", code: "too_long" });
  });

  it("gir generell feilmelding for ukjente feil", async () => {
    const response = aiErrorResponse(new Error("noe uventet"), messages, "test");
    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("Noe gikk galt.");
  });
});
