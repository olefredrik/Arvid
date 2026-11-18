# Modellevaluering

Disse skriptene viser om et modellbytte gjør ekstraksjonen bedre eller dårligere. De kjører nøyaktig samme kode som `/api/extract` på dine egne testdokumenter.

Modellvalget for alle steg ligger i [lib/ai/models.ts](../../lib/ai/models.ts).

## Personvern

Testdokumentene og resultatene inneholder personopplysninger. Derfor ligger alt i `eval-data/`, som er i `.gitignore`. Bruk egne dokumenter eller dokumenter du har lov til å bruke, og slett mappen når du er ferdig.

Dokumentene sendes til Anthropic API på samme måte som når Arvid brukes.

## Oppsett

1. Legg 10–15 PDF-er i `eval-data/documents/`. Ta gjerne med forskjellige selskaper og typer, og noen vanskelige: kombinerte poliser, lange vilkårshefter, dokumenter med bare terminpremie.
2. Sjekk at `ANTHROPIC_API_KEY` står i `.env.local`.
3. Valgfritt, men anbefalt: legg inn fasit i `eval-data/expected/<dokumentnavn>.json`:

```json
{
  "types": ["house", "contents"],
  "policies": {
    "house": { "company": "Gjensidige", "annualPremium": 8400, "deductible": 8000 },
    "contents": { "coverageLevel": "Innbo Pluss" }
  }
}
```

Uten fasit ser du bare hvor to kjøringer svarer ulikt. Med fasit ser du også hvilken som har rett.

## Kjøring

```bash
# Gammel modell som sammenligningsgrunnlag (Haiku 4.5 støtter ikke effort)
npm run eval -- --label haiku-4-5 --model claude-haiku-4-5 --effort none

# Modellen som står i lib/ai/models.ts
npm run eval -- --label haiku-5-5

# Andre varianter, f.eks. lavere effort eller Sonnet
npm run eval -- --label haiku-5-5-low --effort low
npm run eval -- --label sonnet-5-5-low --model claude-sonnet-5-5 --effort low

# Sammenlign to kjøringer
npm run eval:compare -- haiku-4-5 haiku-5-5
```

`--model` og `--effort` gjelder både typeidentifisering og ekstraksjon.

Sammenligningen viser felt som er ulike per dokument, og deretter en oppsummering med antall vellykkede dokumenter, tokenforbruk, beregnet kostnad i USD, svartid og treff mot fasit.

Grovt anslag: én kjøring med 15 dokumenter koster rundt én krone med Haiku 5.5 og rundt ti kroner med Haiku 4.5. Sammenligningen viser faktisk kostnad.
