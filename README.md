# Arvid

[![Test](https://github.com/olefredrik/Arvid/actions/workflows/test.yml/badge.svg)](https://github.com/olefredrik/Arvid/actions/workflows/test.yml)
[![Latest release](https://img.shields.io/github/v/release/olefredrik/Arvid)](https://github.com/olefredrik/Arvid/releases)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-orange.svg)](https://github.com/olefredrik/Arvid/blob/main/LICENSE)

Arvid er et open-source verktøy som hjelper norske forbrukere å forstå forsikringsavtalene sine, sammenstille dem i et nyttig format, og evaluere konkurransetilbud.

Arvid er nøytral, jobber alltid for brukeren, og har ingen kommersielle bindinger til forsikringsbransjen.

## Funksjonalitet

1. **Last opp forsikringsdokumenter** – én eller flere PDF-filer, ingen innlogging nødvendig
2. **Få strukturert oversikt** – dekningsnivå, egenandel og nøkkelinformasjon per forsikring
3. **Generer tilbudsforespørsel** – last ned et ferdig dokument og send til konkurrerende selskaper selv
4. **Sammenlign mottatte tilbud** – last opp tilbudene du har mottatt og få en samlet anbefaling

## Demo

[arvid.cloud](https://arvid.cloud)

## Teknisk stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Anthropic Claude API](https://www.anthropic.com/)
- [pdfjs-dist](https://github.com/mozilla/pdf.js/) for PDF-parsing

## Kom i gang

### Krav

- Node.js 18 eller nyere
- En API-nøkkel fra [Anthropic Console](https://console.anthropic.com/)

### Installasjon

```bash
git clone https://github.com/olefredrik/Arvid.git
cd arvid
npm install
```

### Miljøvariabler

Opprett en `.env.local`-fil i rotet av prosjektet:

```bash
cp .env.local.example .env.local
```

Legg inn din Anthropic API-nøkkel:

```
ANTHROPIC_API_KEY=din-nøkkel-her
```

Analytics er valgfritt og ikke aktivert som standard. Hvis du vil aktivere anonymisert bruksstatistikk, legg inn en nøkkel fra din foretrukne provider (se `.env.local.example` for detaljer):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

### Kjør lokalt

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Personvern

Forsikringsdokumenter inneholder personopplysninger. Arvid er designet med personvern som førsteklasses prioritet:

- Ingen dokumentinnhold lagres i database
- Dokumenter prosesseres kun i sesjonen og kastes etterpå
- Ingen innlogging eller brukerkontoer
- Ingen cookies eller cookie-banner

Den hostede versjonen på [arvid.cloud](https://arvid.cloud) bruker anonymisert, cookiefri bruksstatistikk (PostHog EU). Ingen personopplysninger samles inn. Se [personvernerklæringen](https://arvid.cloud/personvern) for detaljer.

## Bidra

Bidrag er velkomne! Se [CONTRIBUTING.md](CONTRIBUTING.md) for hvordan du kommer i gang.

## Lisens

Arvid er tilgjengelig under to lisensbetingelser:

**Åpen kildekode (AGPL v3)**
For privat bruk, forskning og ikke-kommersiell bruk er Arvid lisensiert under [GNU Affero General Public License v3.0](LICENSE). Det betyr at du fritt kan lese, bruke og modifisere koden – men eventuelle endringer som distribueres eller kjøres som en nettjeneste må også gjøres tilgjengelig under AGPL v3.

**Kommersiell lisens**
Hvis du ønsker å bruke Arvid i en kommersiell sammenheng uten å oppfylle AGPL v3-kravene, ta kontakt for en separat avtale: hello@olefredrik.com

Se [CLA.md](CLA.md) for informasjon om bidragsrettigheter.

## Organisasjoner

Organisasjoner som ønsker å tilby Arvid gratis til sine medlemmer eller brukere, er velkomne til å ta kontakt. Arvid er åpen kildekode under AGPL v3 – det finnes derfor ingen lisenskostnad, men dersom din organisasjon ønsker å utforske et samarbeid om drift, tilpasning eller finansiering av API-kostnader, hører jeg gjerne fra deg.

Ta kontakt på hello@olefredrik.com.
