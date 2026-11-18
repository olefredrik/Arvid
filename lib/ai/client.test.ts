import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { anthropic, generateStructured, AiOutputError } from "./client";
import { MODEL_SETTINGS } from "./models";

const schema = z.object({ answer: z.string() });

// Lager et minimalt svar slik messages.parse returnerer det
const fakeResponse = (stopReason: string, parsed: unknown, model = "claude-haiku-5-5") => ({
  model,
  stop_reason: stopReason,
  parsed_output: parsed,
  usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0 },
});

const mockParse = (...responses: ReturnType<typeof fakeResponse>[]) => {
  const spy = vi.spyOn(anthropic.messages, "parse");
  for (const r of responses) spy.mockResolvedValueOnce(r as never);
  return spy;
};

const run = () =>
  generateStructured({ task: "extraction", prompt: "test", schema, onUsage: () => {} });

afterEach(() => vi.restoreAllMocks());

describe("generateStructured", () => {
  it("returnerer parsed_output ved vellykket svar", async () => {
    mockParse(fakeResponse("end_turn", { answer: "ok" }));
    await expect(run()).resolves.toEqual({ answer: "ok" });
  });

  it("bruker modell og effort fra MODEL_SETTINGS", async () => {
    const spy = mockParse(fakeResponse("end_turn", { answer: "ok" }));
    await run();
    const params = spy.mock.calls[0][0];
    expect(params.model).toBe(MODEL_SETTINGS.extraction.model);
    expect(params.output_config?.effort).toBe(MODEL_SETTINGS.extraction.effort);
    expect(params.max_tokens).toBe(MODEL_SETTINGS.extraction.maxTokens);
  });

  it("utelater effort når settings ikke har det (eldre modeller)", async () => {
    const spy = mockParse(fakeResponse("end_turn", { answer: "ok" }));
    await generateStructured({
      task: "extraction",
      prompt: "test",
      schema,
      settings: { model: "claude-haiku-4-5", effort: undefined },
      onUsage: () => {},
    });
    expect(spy.mock.calls[0][0].output_config).not.toHaveProperty("effort");
  });

  it("prøver reservemodellen én gang ved avslag", async () => {
    const spy = mockParse(
      fakeResponse("refusal", null),
      fakeResponse("end_turn", { answer: "fra reserve" }, "claude-sonnet-5-5")
    );
    await expect(run()).resolves.toEqual({ answer: "fra reserve" });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0].model).toBe(MODEL_SETTINGS.extraction.refusalFallbackModel);
  });

  it("kaster refusal når også reservemodellen avviser", async () => {
    mockParse(fakeResponse("refusal", null), fakeResponse("refusal", null));
    await expect(run()).rejects.toMatchObject({ reason: "refusal" });
  });

  it("kaster max_tokens når svaret blir kuttet", async () => {
    mockParse(fakeResponse("max_tokens", null));
    const error = await run().catch((e) => e);
    expect(error).toBeInstanceOf(AiOutputError);
    expect(error.reason).toBe("max_tokens");
  });

  it("kaster invalid_output når svaret ikke kan tolkes", async () => {
    mockParse(fakeResponse("end_turn", null));
    await expect(run()).rejects.toMatchObject({ reason: "invalid_output" });
  });

  it("rapporterer tokenforbruk uten innhold", async () => {
    mockParse(fakeResponse("end_turn", { answer: "hemmelig" }));
    const onUsage = vi.fn();
    await generateStructured({ task: "extraction", prompt: "test", schema, onUsage });
    const usage = onUsage.mock.calls[0][0];
    expect(usage).toMatchObject({ task: "extraction", inputTokens: 10, outputTokens: 5 });
    expect(JSON.stringify(usage)).not.toContain("hemmelig");
  });
});
