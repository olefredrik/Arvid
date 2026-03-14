# Rolf

[![Test](https://github.com/olefredrik/Rolf/actions/workflows/test.yml/badge.svg)](https://github.com/olefredrik/Rolf/actions/workflows/test.yml)
[![Latest release](https://img.shields.io/github/v/release/olefredrik/Rolf)](https://github.com/olefredrik/Rolf/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-orange.svg)](https://github.com/olefredrik/Rolf/blob/main/LICENSE)

Rolf er et open-source verktøy som hjelper norske forbrukere å forstå forsikringsavtalene sine, sammenstille dem i et nyttig format, og generere tilbudsforespørsler til konkurrerende selskaper.

Rolf er nøytral, jobber alltid for brukeren, og har ingen kommersielle bindinger til forsikringsbransjen.

## Funksjonalitet

1. **Last opp forsikringsdokumenter** – én eller flere PDF-filer
2. **Få strukturert oversikt** – dekningsnivå, egenandel og årspremie per forsikring
3. **Generer tilbudsforespørsel** – klar til å sende til konkurrerende selskaper

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
git clone https://github.com/olefredrik/rolf.git
cd rolf
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

### Kjør lokalt

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Personvern

Forsikringsdokumenter inneholder personopplysninger. Rolf er designet med personvern som førsteklasses prioritet:

- Ingen dokumentinnhold lagres i database
- Dokumenter prosesseres kun i sesjonen og kastes etterpå
- Ingen innlogging eller brukerkontoer
- Ingen tredjeparts sporingsscripts

## Lisens

MIT
