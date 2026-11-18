import type Anthropic from "@anthropic-ai/sdk";

// Alle stegene i Arvid som kaller Claude
export type AiTask = "typeIdentification" | "extraction" | "quoteRequest" | "comparison";

export type Effort = NonNullable<Anthropic.OutputConfig["effort"]>;

export type ModelSettings = {
  model: Anthropic.Model;
  // Hvor grundig modellen tenker. Utelates for eldre modeller som ikke støtter effort (f.eks. Haiku 4.5)
  effort?: Effort;
  // Tenkingen teller mot max_tokens, så grensen må gi rom for både tenking og svar
  maxTokens: number;
  // Per forsøk. Holdes under maxDuration (60 sek) i API-rutene
  timeoutMs: number;
  // Modellen som prøves én gang til hvis den første avviser forespørselen (stop_reason "refusal")
  refusalFallbackModel?: Anthropic.Model;
};

// Modellvalg per steg – endres her og ingen andre steder.
// Begrunnelse:
// - Typeidentifisering og ekstraksjon er strukturert uthenting med høyt volum: Haiku holder,
//   og er ti ganger billigere enn Haiku 4.5. Kvaliteten verifiseres med scripts/eval.
// - Tilbudsforespørsel og sammenligning er tekst brukeren handler på: Sonnet, men bare ett kall per økt.
export const MODEL_SETTINGS: Record<AiTask, ModelSettings> = {
  typeIdentification: {
    model: "claude-haiku-5-5",
    effort: "low",
    maxTokens: 2048,
    timeoutMs: 20_000,
    refusalFallbackModel: "claude-sonnet-5-5",
  },
  extraction: {
    model: "claude-haiku-5-5",
    effort: "medium",
    maxTokens: 16_000,
    timeoutMs: 40_000,
    refusalFallbackModel: "claude-sonnet-5-5",
  },
  quoteRequest: {
    model: "claude-sonnet-5-5",
    effort: "low",
    maxTokens: 16_000,
    timeoutMs: 50_000,
    refusalFallbackModel: "claude-opus-5-5",
  },
  comparison: {
    model: "claude-sonnet-5-5",
    effort: "medium",
    maxTokens: 16_000,
    timeoutMs: 50_000,
    refusalFallbackModel: "claude-opus-5-5",
  },
};
