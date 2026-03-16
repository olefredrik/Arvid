// Enkel in-memory rate limiting per IP-adresse.
// NB: Fungerer per serverless-instans – gir best-effort beskyttelse, ikke global koordinering.

const RATE_LIMIT = 50;              // maks antall forespørsler
const RATE_WINDOW = 10 * 60 * 1000; // per 10 minutter

type RateLimitEntry = { count: number; resetAt: number };
const store = new Map<string, RateLimitEntry>();

// Rydder opp utgåtte oppføringer for å unngå minnelekkasje
function cleanup() {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now > entry.resetAt) store.delete(ip);
  }
}

export function checkRateLimit(request: Request): { allowed: boolean; retryAfter?: number } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const now = Date.now();
  if (store.size > 1000) cleanup();

  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}
