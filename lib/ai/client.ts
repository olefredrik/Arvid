import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { MODEL_SETTINGS, type AiTask, type ModelSettings } from "./models";

// SDK-en prøver selv på nytt ved 429, 5xx, 529 og nettverksfeil (med backoff)
export const anthropic = new Anthropic({ maxRetries: 2 });

export type AiFailureReason = "max_tokens" | "refusal" | "invalid_output";

// Kastes når Claude svarer, men svaret ikke kan brukes
export class AiOutputError extends Error {
  constructor(
    public readonly reason: AiFailureReason,
    public readonly task: AiTask
  ) {
    super(`${task}: ${reason}`);
    this.name = "AiOutputError";
  }
}

// Tokenforbruk per kall – inneholder aldri dokumentinnhold
export type AiUsage = {
  task: AiTask;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  durationMs: number;
  stopReason: string | null;
};

type GenerateOptions<S extends z.ZodType> = {
  task: AiTask;
  prompt: string;
  schema: S;
  // Overstyrer MODEL_SETTINGS, brukes av eval-skriptene
  settings?: Partial<ModelSettings>;
  onUsage?: (usage: AiUsage) => void;
};

// Logger tokenforbruk som én linje JSON, slik at kostnad kan følges opp uten å logge innhold
const logUsage = (usage: AiUsage) => {
  console.info(JSON.stringify({ event: "claude_usage", ...usage }));
};

const callModel = async <S extends z.ZodType>(
  model: Anthropic.Model,
  settings: ModelSettings,
  { task, prompt, schema, onUsage }: GenerateOptions<S>
) => {
  const startedAt = Date.now();
  const response = await anthropic.messages.parse(
    {
      model,
      max_tokens: settings.maxTokens,
      messages: [{ role: "user", content: prompt }],
      output_config: {
        format: zodOutputFormat(schema),
        ...(settings.effort ? { effort: settings.effort } : {}),
      },
    },
    { timeout: settings.timeoutMs }
  );

  const usage: AiUsage = {
    task,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    durationMs: Date.now() - startedAt,
    stopReason: response.stop_reason,
  };
  (onUsage ?? logUsage)(usage);

  return response;
};

// Kaller Claude med structured outputs: svaret følger alltid schema, eller så kastes AiOutputError.
// Ved avslag (refusal) prøves én gang til med reservemodellen for steget.
export async function generateStructured<S extends z.ZodType>(
  options: GenerateOptions<S>
): Promise<z.infer<S>> {
  const settings: ModelSettings = { ...MODEL_SETTINGS[options.task], ...options.settings };

  let response = await callModel(settings.model, settings, options);

  if (response.stop_reason === "refusal" && settings.refusalFallbackModel) {
    response = await callModel(settings.refusalFallbackModel, settings, options);
  }

  if (response.stop_reason === "refusal") {
    throw new AiOutputError("refusal", options.task);
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiOutputError("max_tokens", options.task);
  }
  if (response.parsed_output == null) {
    throw new AiOutputError("invalid_output", options.task);
  }

  return response.parsed_output as z.infer<S>;
}
