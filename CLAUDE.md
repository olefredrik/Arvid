# Rolf – AI-assistert forsikringsrådgiver

## Hva er Rolf?

Rolf er et open-source verktøy som hjelper norske forbrukere å forstå forsikringsavtalene sine, sammenstille dem i et nyttig format, og evaluere konkurrenretilbud. Rolf er nøytral, jobber alltid for brukeren, og har ingen kommersielle bindinger til forsikringsbransjen.

Navnet er bevisst: en pålitelig, litt gammeldags norsk forsikringsagent som faktisk er på din side.

---

## Kjerneprinsipper

**Ingen persistent lagring av dokumentinnhold.**
Forsikringsdokumenter inneholder personopplysninger. De prosesseres i sesjonen og kastes. Aldri lagret i database.

**Brukeren eier prosessen.**
Rolf analyserer og anbefaler. Brukeren bestemmer og handler. Rolf sender aldri noe på vegne av brukeren.

**Pris er privat.**
I steg 1–3 av flyten eksponeres aldri brukerens nåværende pris. Dette er en funksjon, ikke en begrensning.

**Norsk kontekst er førsteklasses.**
Alle tekster, analyser og anbefalinger er på norsk. Domenekunnskap om norsk forsikringsbransje skal bakes inn der det er mulig.

**Enkelt fremfor fullstendig.**
En analyse brukeren forstår og handler på er bedre enn en analyse som er teknisk korrekt men uleselig.

---

## Brukerflyt (MVP)

### Steg 1: Dokumentinnsamling
- Brukeren laster opp ett eller flere forsikringsdokumenter (PDF)
- Ingen innlogging, ingen konto
- Verktøyet identifiserer forsikringstype per dokument
- Brukeren bekrefter at listen er komplett

### Steg 2: Analyse og oversikt
- Strukturert ekstrahering av nøkkelparametere per forsikringstype
- Presenteres som oversiktlig tabell, ikke tekstvegg
- Nøkkelparametere: dekningstype, dekningsnivå, egenandel, viktige inklusjoner/eksklusjoner
- Pris vises ikke i denne oversikten
- Brukeren kan korrigere eller supplere

### Steg 3: Generer tilbudsforespørsel
- Verktøyet genererer et strukturert dokument formulert som kravspesifikasjon
- Dokumentet beskriver hva brukeren trenger, ikke hva de betaler
- Brukeren laster ned og sender til konkurrerende selskaper selv
- Verktøyet er ute av løkken etter dette steget

### Steg 4: Evaluering av tilbud (versjon 2)
- Brukeren laster opp mottatte tilbud
- Verktøyet ber om nåværende totalpris (kun for sammenligning, lagres ikke)
- Produserer sammenligningstabeller på pris og vilkår
- Identifiserer konkrete avvik mellom gammelt og nytt tilbud
- Gir samlet anbefaling med begrunnelse

---

## Støttede forsikringstyper (MVP)

**Eiendom**
- Hus
- Hytte
- Innbo

**Kjøretøy**
- Bil
- Veteranbil
- Avregistrert kjøretøy
- Russebil
- Bobil
- Campingvogn
- Moped
- ATV
- MC
- Elsparkesykkel
- Snøscooter
- Tilhenger
- Sykkel

**Fritid og verdier**
- Båt
- Drone
- Bunad

**Person og dyr**
- Dyr
- Reise

---

## Teknisk stack

| Komponent | Valg | Begrunnelse |
|---|---|---|
| Framework | Next.js (App Router) | Ett repo for frontend og API, enkel deploy |
| Hosting | Vercel | Naturlig match med Next.js |
| AI | Anthropic Claude API | Sterk på norsk, kjent modell |
| Database | Ingen i MVP | Sesjonsbasert state, ingen persistent lagring |
| Filparsing | pdf-parse eller pdfjs-dist | Robust tekstekstrahering fra PDF |
| Styling | Tailwind CSS | Rask utvikling, konsistent design |
| Språk | TypeScript | Type-sikkerhet viktig for strukturert dataekstrahering |

---

## Arkitektur

```
/app
  /page.tsx                          # Landingsside
  /analysis
    /page.tsx                        # Hovedflyt: opplasting og analyse
  /api
    /extract/route.ts                # Ekstraherer strukturert data fra PDF
    /generate-quote-request/route.ts # Genererer tilbudsforespørsel
    /compare/route.ts                # Sammenligner tilbud (steg 4)
/lib
  /insurance
    /types.ts                        # TypeScript-typer for forsikringsdata
    /schema.ts                       # Ekstraksjonssskjema per forsikringstype
    /prompts.ts                      # Alle Claude-prompts samlet
  /pdf
    /parser.ts                       # PDF-tekstekstrahering
/components
  /upload/                           # Filupplastingskomponent
  /overview/                         # Forsikringsoversikt-tabeller
  /report/                           # Generert tilbudsforespørsel
```

---

## Datamodell

```typescript
type InsuranceType =
  // Property
  | "house"
  | "cabin"
  | "contents"
  // Vehicles
  | "car"
  | "vintage-car"
  | "deregistered-vehicle"
  | "russ-car"
  | "motorhome"
  | "caravan"
  | "moped"
  | "atv"
  | "motorcycle"
  | "e-scooter"
  | "snowmobile"
  | "trailer"
  | "bicycle"
  // Leisure and valuables
  | "boat"
  | "drone"
  | "bunad"
  // Person and animals
  | "animal"
  | "travel";

type InsurancePolicy = {
  type: InsuranceType;
  company: string;
  coverageLevel: string;
  deductible: number | null;
  maxCoverage: number | null;
  inclusions: string[];
  exclusions: string[];
  notes: string[];
  extractionConfidence: "high" | "medium" | "low";
};

type Session = {
  id: string;                 // Tilfeldig UUID, ikke knyttet til bruker
  documents: ExtractedDocument[];
  createdAt: Date;            // Brukes kun for sesjonsutløp
};
```

---

## Prompt-prinsipper

- Alle prompts skal be modellen returnere strukturert JSON
- Konfidensnivå skal alltid inkluderes i ekstrahert data
- Modellen skal flagge tydelig når noe er uklart eller mangler i dokumentet
- Norsk fagterminologi skal brukes konsekvent
- Anbefalinger skal alltid inkludere begrunnelse, ikke bare konklusjon

---

## GDPR og personvern

- Ingen dokumentinnhold lagres etter sesjonen er avsluttet
- Sesjoner utløper etter [30 minutter] inaktivitet
- Ingen analytics som samler personopplysninger
- Ingen tredjeparts sporingsscripts
- Databehandleravtale med Anthropic må være på plass før lansering
- Personvernerklæring skal beskrive behandlingsgrunnlag eksplisitt

---

## Det vi ikke bygger i MVP

- Brukerkontoer og innlogging
- Historikk og varsler ved fornyelse
- Direkte integrasjon mot forsikringsselskapers API-er
- Automatisk innsending av forespørsler
- Prissammenligning mot markedsdata
- Mobilapp

---

## Open-source

Rolf er open-source. Lisens: MIT.
Mål: Tillit gjennom transparens. Brukere skal kunne verifisere at dokumentene deres ikke lagres.
Hostet versjon på rolf.no (eller tilsvarende) er gratis å bruke.

---

## Navn og tone

Tjenesten heter **Rolf**. Ikke "Rolf AI" eller "Rolf Forsikring". Bare Rolf.

Tone i alle tekster:
- Direkte og vennlig, ikke formell
- Aldri nedlatende eller overforklarende
- Bruker "du", ikke "man" eller "brukeren"
- Fagtermer forklares første gang de brukes, deretter brukes de fritt
- Humor er tillatt, men sparsomt

## Språkkonvensjoner

All kode skrives på engelsk: variabelnavn, funksjoner, typer, filnavn, og konstanter.
Kommentarer i koden og all tekst i grensesnittet er på norsk.

Eksempel:
```typescript
// Henter ut dekningsnivå fra forsikringsdokumentet
const extractCoverageLevel = (document: InsuranceDocument): CoverageLevel => {
  ...
}
```
