// Kjører ekstraksjonsflyten på lokale testdokumenter og lagrer resultatet for sammenligning.
// Bruk: npm run eval -- --label <navn> [--model <modell-id>] [--effort low|medium|high|none] [--dir <mappe>]
// Se scripts/eval/README.md
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { AiOutputError, type AiUsage } from "@/lib/ai/client";
import type { Effort, ModelSettings } from "@/lib/ai/models";
import { extractPolicies } from "@/lib/insurance/extract";
import type { InsurancePolicy } from "@/lib/insurance/types";
import { extractTextFromPdf } from "@/lib/pdf/parser";

export type DocumentResult = {
  file: string;
  status: "ok" | "no_text" | "general_terms" | "no_types" | "error";
  error?: string;
  policies: InsurancePolicy[];
  durationMs: number;
  usage: AiUsage[];
};

export type EvalRun = {
  label: string;
  createdAt: string;
  settings: Partial<ModelSettings>;
  documents: DocumentResult[];
};

// Toppnivå-await er ikke tilgjengelig i CommonJS, derfor main()
async function main() {
  const { values } = parseArgs({
    options: {
      label: { type: "string" },
      model: { type: "string" },
      effort: { type: "string" },
      dir: { type: "string", default: "eval-data/documents" },
    },
  });

  if (!values.label) {
    console.error("Mangler --label, f.eks. --label haiku-5-5");
    process.exit(1);
  }

  // "none" betyr at effort ikke sendes, for modeller som ikke støtter det (Haiku 4.5)
  const settings: Partial<ModelSettings> = {};
  if (values.model) settings.model = values.model;
  if (values.effort) settings.effort = values.effort === "none" ? undefined : (values.effort as Effort);

  // Leser også undermapper, f.eks. Forsikringsbevis/ og Vilkår/. Filnavnet lagres med undermappe.
  const files = (await readdir(values.dir!, { recursive: true }))
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();
  if (files.length === 0) {
    console.error(`Fant ingen PDF-er i ${values.dir}`);
    process.exit(1);
  }

  console.log(`Kjører ${files.length} dokumenter som "${values.label}"`, settings);

  const documents: DocumentResult[] = [];
  for (const file of files) {
    const usage: AiUsage[] = [];
    const startedAt = Date.now();
    const result: DocumentResult = { file, status: "error", policies: [], durationMs: 0, usage };

    try {
      const rawText = await extractTextFromPdf(await readFile(path.join(values.dir!, file)));
      const outcome = await extractPolicies(rawText, { settings, onUsage: (u) => usage.push(u) });
      result.status = outcome.status;
      if (outcome.status === "ok") result.policies = outcome.policies;
    } catch (error) {
      result.error = error instanceof AiOutputError ? error.reason : String(error);
    }

    result.durationMs = Date.now() - startedAt;
    documents.push(result);
    const types = result.policies.map((p) => p.type).join(", ") || "-";
    console.log(`  ${result.status === "ok" ? "✓" : "✗"} ${file}  ${result.status}${result.error ? ` (${result.error})` : ""}  [${types}]  ${(result.durationMs / 1000).toFixed(1)}s`);
  }

  const run: EvalRun = { label: values.label, createdAt: new Date().toISOString(), settings, documents };
  await mkdir("eval-data/results", { recursive: true });
  const outFile = path.join("eval-data/results", `${values.label}.json`);
  await writeFile(outFile, JSON.stringify(run, null, 2));
  console.log(`\nLagret ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
