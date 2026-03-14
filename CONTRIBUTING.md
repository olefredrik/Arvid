# Bidra til Arvid

Takk for at du vil bidra! Arvid er et open-source prosjekt og alle bidrag er velkomne.

## Kom i gang

### Krav

- Node.js 18 eller nyere
- En API-nøkkel fra [Anthropic Console](https://console.anthropic.com/)

### Oppsett

```bash
git clone https://github.com/olefredrik/Arvid.git
cd arvid
npm install
cp .env.local.example .env.local
# Legg inn din ANTHROPIC_API_KEY i .env.local
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Slik bidrar du

1. Fork repoet
2. Opprett en branch: `git checkout -b feat/det-du-jobber-med`
3. Gjør endringene dine
4. Kjør testene: `npm test`
5. Push branchen og opprett en Pull Request mot `main`

Beskriv hva endringen gjør og hvorfor i PR-beskrivelsen.

## Kodestil

- **Kode skrives på engelsk** – variabelnavn, funksjoner, typer, filnavn og konstanter
- **Kommentarer og UI-tekster er på norsk**
- TypeScript for all ny kode
- Følg eksisterende filstruktur og mønstre

Eksempel:
```typescript
// Henter ut dekningsnivå fra forsikringsdokumentet
const extractCoverageLevel = (document: InsuranceDocument): CoverageLevel => {
  ...
}
```

## Hva slags bidrag er velkomne

- Feilrettinger
- Støtte for nye forsikringstyper
- Forbedringer av eksisterende analyselogikk
- UI/UX-forbedringer
- Oversettelser av domenekunnskap til prompts
- Dokumentasjon

## Hva vi ikke bygger (ennå)

- Brukerkontoer og innlogging
- Direkte integrasjon mot forsikringsselskapers API-er
- Automatisk innsending av forespørsler
- Mobilapp

## Spørsmål?

Åpne et [issue på GitHub](https://github.com/olefredrik/Arvid/issues) så hjelper vi deg.
