// Validering av JSON-forespørsler til API-rutene.
// Rutene sender data videre til Claude, så uvalidert input kan misbrukes til dyre eller vilkårlige kall.
import { NextResponse } from "next/server";
import { z } from "zod";
import { EXTRACTION_SCHEMAS } from "../insurance/schema";
import { INSURANCE_TYPES } from "../insurance/types";

// Grensene ligger godt over ekte bruk: 8 forsikringer er ~14 KB, lengste tekst ~250 tegn, lengste liste ~15 punkter
export const LIMITS = {
  bodyBytes: 200_000,
  policies: 30,
  text: 2_000,
  listItems: 60,
  amount: 1_000_000_000,
} as const;

const text = z.string().max(LIMITS.text);
const amount = z.number().min(0).max(LIMITS.amount).nullable();
const textList = z.array(text).max(LIMITS.listItems);

const CORE_KEYS = new Set([
  "company", "policyNumber", "coverageLevel", "deductible", "maxCoverage", "annualPremium", "isBundledPremium",
]);

// Typespesifikke felter fra schema.ts (f.eks. registrationNumber). Andre ukjente felter fjernes.
const typeSpecificFields = Object.fromEntries(
  [...new Set(Object.values(EXTRACTION_SCHEMAS).flatMap((s) => s.fields.map((f) => f.key)))]
    .filter((key) => !CORE_KEYS.has(key))
    .map((key) => [key, z.union([text, z.number(), z.boolean(), z.null()]).optional()])
);

export const policyInputSchema = z.object({
  _id: z.string().max(100).optional(),
  type: z.enum(INSURANCE_TYPES),
  company: text,
  policyNumber: text.nullable(),
  coverageLevel: text,
  deductible: amount,
  maxCoverage: amount,
  annualPremium: amount,
  isBundledPremium: z.boolean(),
  premiumIncludesTrafficFee: z.boolean().optional(),
  inclusions: textList,
  exclusions: textList,
  notes: textList,
  extractionConfidence: z.enum(["high", "medium", "low"]),
  ...typeSpecificFields,
});

const policyList = z.array(policyInputSchema).max(LIMITS.policies);

export const quoteRequestBodySchema = z.object({ policies: policyList });

export const compareBodySchema = z.object({ currentPolicies: policyList, offerPolicies: policyList });

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

// Leser og validerer JSON-body. Gir ferdig feilsvar ved for stor, ugyldig eller ukjent data.
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
  logLabel: string
): Promise<ParseResult<z.infer<S>>> {
  const tooLarge = () => ({
    ok: false as const,
    response: NextResponse.json(
      { error: "Det ble for mye data på én gang. Prøv med færre forsikringer." },
      { status: 413 }
    ),
  });
  const invalid = () => ({
    ok: false as const,
    response: NextResponse.json(
      { error: "Arvid kjente ikke igjen dataene. Prøv å starte analysen på nytt." },
      { status: 400 }
    ),
  });

  if (Number(request.headers.get("content-length") ?? 0) > LIMITS.bodyBytes) return tooLarge();

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > LIMITS.bodyBytes) return tooLarge();

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return invalid();
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    // Logg bare hvor og hvorfor valideringen feilet, aldri verdiene
    console.warn(`${logLabel}: ugyldig forespørsel`, result.error.issues.map((i) => `${i.path.join(".")}: ${i.code}`));
    return invalid();
  }
  return { ok: true, data: result.data };
}
