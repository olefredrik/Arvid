// Sammenligner to eval-kjøringer felt for felt, og mot fasit hvis den finnes.
// Bruk: npm run eval:compare -- <label-a> <label-b>
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { AiUsage } from "@/lib/ai/client";
import type { InsurancePolicy } from "@/lib/insurance/types";
import type { DocumentResult, EvalRun } from "./run";

// Pris i USD per million tokens (inn, ut). Haiku 5.5 har høyere pris over 100K tokens per forespørsel.
const PRICES: { prefix: string; price: (inputTokens: number) => [number, number] }[] = [
  { prefix: "claude-haiku-5-5", price: (n) => (n > 100_000 ? [0.5, 2.5] : [0.1, 0.5]) },
  { prefix: "claude-haiku-4-5", price: () => [1, 5] },
  { prefix: "claude-sonnet-5-5", price: () => [2, 10] },
  { prefix: "claude-sonnet-4-6", price: () => [3, 15] },
  { prefix: "claude-opus-5-5", price: () => [4, 20] },
];

const costOf = (u: AiUsage): number | null => {
  const entry = PRICES.find((p) => u.model.startsWith(p.prefix));
  if (!entry) return null;
  const [inPrice, outPrice] = entry.price(u.inputTokens);
  return (u.inputTokens * inPrice + u.outputTokens * outPrice) / 1_000_000;
};

// Fasit: eval-data/expected/<dokumentnavn uten .pdf>.json
// { "types": ["car"], "policies": { "car": { "annualPremium": 8400, "deductible": 6000 } } }
type Expected = { types?: string[]; policies?: Record<string, Record<string, unknown>> };

const loadRun = (label: string): EvalRun =>
  JSON.parse(readFileSync(path.join("eval-data/results", `${label}.json`), "utf-8"));

const loadExpected = (file: string): Expected | null => {
  const p = path.join("eval-data/expected", file.replace(/\.pdf$/i, ".json"));
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf-8")) : null;
};

const normalize = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const same = (a: unknown, b: unknown) => normalize(a) === normalize(b);
const show = (v: unknown) => (Array.isArray(v) ? `[${v.length} stk]` : JSON.stringify(v ?? null));

// Antall riktige felter mot fasit for ett dokument
const score = (doc: DocumentResult, expected: Expected) => {
  let correct = 0;
  let total = 0;
  if (expected.types) {
    total += 1;
    const found = doc.policies.map((p) => p.type).sort();
    if (JSON.stringify(found) === JSON.stringify([...expected.types].sort())) correct += 1;
  }
  for (const [type, fields] of Object.entries(expected.policies ?? {})) {
    const policy = doc.policies.find((p) => p.type === type) as Record<string, unknown> | undefined;
    for (const [key, value] of Object.entries(fields)) {
      total += 1;
      if (policy && same(policy[key], value)) correct += 1;
    }
  }
  return { correct, total };
};

const [labelA, labelB] = process.argv.slice(2);
if (!labelA || !labelB) {
  console.error("Bruk: npm run eval:compare -- <label-a> <label-b>");
  process.exit(1);
}
const runA = loadRun(labelA);
const runB = loadRun(labelB);

// Felt-for-felt per dokument
for (const docA of runA.documents) {
  const docB = runB.documents.find((d) => d.file === docA.file);
  if (!docB) continue;

  const lines: string[] = [];
  if (docA.status !== docB.status) lines.push(`  status: ${docA.status} → ${docB.status}`);

  const typesA = docA.policies.map((p) => p.type);
  const typesB = docB.policies.map((p) => p.type);
  for (const t of typesA.filter((t) => !typesB.includes(t))) lines.push(`  type ${t}: bare i ${labelA}`);
  for (const t of typesB.filter((t) => !typesA.includes(t))) lines.push(`  type ${t}: bare i ${labelB}`);

  for (const policyA of docA.policies) {
    const policyB = docB.policies.find((p) => p.type === policyA.type);
    if (!policyB) continue;
    const a = policyA as Record<string, unknown>;
    const b = policyB as Record<string, unknown>;
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const differs = Array.isArray(a[key]) || Array.isArray(b[key])
        ? (a[key] as unknown[] | undefined)?.length !== (b[key] as unknown[] | undefined)?.length
        : !same(a[key], b[key]);
      if (differs) lines.push(`  ${policyA.type}.${key}: ${show(a[key])} → ${show(b[key])}`);
    }
  }

  const expected = loadExpected(docA.file);
  if (expected) {
    const sA = score(docA, expected);
    const sB = score(docB, expected);
    lines.push(`  fasit: ${labelA} ${sA.correct}/${sA.total}, ${labelB} ${sB.correct}/${sB.total}`);
  }

  console.log(`\n${docA.file}${lines.length ? "" : "  (likt)"}`);
  for (const line of lines) console.log(line);
}

// Oppsummering per kjøring
const summarize = (run: EvalRun) => {
  const usage = run.documents.flatMap((d) => d.usage);
  const costs = usage.map(costOf);
  const durations = run.documents.map((d) => d.durationMs).sort((x, y) => x - y);
  const totals = run.documents.reduce(
    (acc, d) => {
      const expected = loadExpected(d.file);
      if (!expected) return acc;
      const s = score(d, expected);
      return { correct: acc.correct + s.correct, total: acc.total + s.total };
    },
    { correct: 0, total: 0 }
  );
  return {
    label: run.label,
    ok: `${run.documents.filter((d) => d.status === "ok").length}/${run.documents.length}`,
    inputTokens: usage.reduce((s, u) => s + u.inputTokens, 0),
    outputTokens: usage.reduce((s, u) => s + u.outputTokens, 0),
    costUsd: costs.includes(null) ? "ukjent modell" : costs.reduce((s, c) => s! + c!, 0)!.toFixed(4),
    medianSec: (durations[Math.floor(durations.length / 2)] / 1000).toFixed(1),
    maxSec: (durations[durations.length - 1] / 1000).toFixed(1),
    fasit: totals.total ? `${totals.correct}/${totals.total}` : "-",
  };
};

console.log("\nOppsummering");
console.table([summarize(runA), summarize(runB)]);
