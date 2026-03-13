// Alle Claude-prompts samlet på ett sted for enkel vedlikehold

import type { InsuranceType } from "./types";
import { EXTRACTION_SCHEMAS } from "./schema";

// Prompt for identifisering av forsikringstype fra PDF-tekst
export const buildTypeIdentificationPrompt = (documentText: string): string => `
Du er en norsk forsikringsekspert. Analyser følgende forsikringsdokument og identifiser hvilken forsikringstype det gjelder.

Mulige typer:
- house (husforsikring)
- cabin (hytteforsikring)
- contents (innboforsikring)
- car (bilforsikring)
- vintage-car (veteranbil)
- deregistered-vehicle (avregistrert kjøretøy)
- russ-car (russebil)
- motorhome (bobil)
- caravan (campingvogn)
- moped (moped)
- atv (ATV)
- motorcycle (MC)
- e-scooter (elsparkesykkel)
- snowmobile (snøscooter)
- trailer (tilhenger)
- bicycle (sykkel)
- boat (båtforsikring)
- drone (droneforsikring)
- bunad (bunadforsikring)
- animal (dyreforsikring)
- travel (reiseforsikring)

Returner KUN et rent JSON-objekt – ingen forklaring, ingen markdown, ingen kodeblokker:
{
  "type": "<forsikringstype>",
  "confidence": "high" | "medium" | "low",
  "reason": "<kort forklaring på norsk>"
}

Dokumenttekst:
${documentText}
`.trim();

// Prompt for strukturert ekstraksjon av forsikringsdata
export const buildExtractionPrompt = (
  documentText: string,
  insuranceType: InsuranceType
): string => {
  const schema = EXTRACTION_SCHEMAS[insuranceType];
  const fieldsDescription = schema.fields
    .map((f) => `- ${f.key} (${f.label}): ${f.description}`)
    .join("\n");

  return `
Du er en norsk forsikringsekspert. Ekstraher strukturert informasjon fra følgende forsikringsdokument.

Forsikringstype: ${insuranceType}

Felter som skal ekstraheres:
${fieldsDescription}

Instruksjoner:
- Returner KUN et rent JSON-objekt – ingen forklaring, ingen markdown, ingen kodeblokker
- Bruk nøyaktig de feltene som er listet opp
- Bruk null for felter du ikke finner informasjon om
- Inkluder et "extractionConfidence"-felt: "high" hvis du er sikker, "medium" hvis noe er uklart, "low" hvis dokumentet mangler viktig informasjon
- Inkluder et "inclusions"-felt (array) med spesifikke dekninger som er nevnt eksplisitt
- Inkluder et "exclusions"-felt (array) med spesifikke unntak eller begrensninger
- Inkluder et "notes"-felt (array) med andre relevante merknader
- Alle tekstverdier skal være på norsk

Dokumenttekst:
${documentText}
`.trim();
};

// Prompt for sammenligning av nåværende forsikringer med mottatte tilbud
export const buildComparisonPrompt = (
  matchedPairs: { current: object; offer: object; premiumDiff: number | null }[]
): string => `
Du er en nøytral norsk forsikringsekspert som sammenligner eksisterende forsikringer med mottatte tilbud.

Hvert par inneholder nåværende polise ("current") og nytt tilbud ("offer"), pluss eventuell prisforskjell per år i kroner ("premiumDiff" – negativt tall betyr at tilbudet er billigere).

Instruksjoner:
- Sammenlign hvert par og beskriv konkrete avvik i dekningsnivå, egenandel, inklusjoner og eksklusjoner
- Vær nøytral – ikke fremhev noen av partene
- Ta hensyn til pris i den samlede anbefalingen, men presenter ikke prisen på nytt i "assessment"
- verdict: "Bytt" hvis tilbudet er klart bedre totalt sett, "Behold" hvis nåværende er bedre eller likeverdig, "Vurder" hvis situasjonen er tvetydig
- Ikke oppfinn avvik som ikke fremgår av dataene – si heller "ingen vesentlige avvik funnet" hvis så er tilfelle

Forsikringspar:
${JSON.stringify(matchedPairs, null, 2)}

Returner KUN et rent JSON-objekt – ingen forklaring, ingen markdown, ingen kodeblokker:
{
  "comparisons": [
    {
      "insuranceType": "<type fra dataene, f.eks. house>",
      "assessment": "<2-3 setninger om hva som skiller tilbudene>",
      "coverageDifferences": ["<konkret avvik 1>", "<konkret avvik 2>"],
      "verdict": "Bytt" | "Behold" | "Vurder"
    }
  ],
  "recommendation": "<samlet anbefaling på 2-3 setninger basert på pris og vilkår>"
}
`.trim();

// Prompt for generering av tilbudsforespørsel
export const buildQuoteRequestPrompt = (
  policies: object[],
  additionalRequirements?: string
): string => `
Du er en norsk forsikringsekspert som hjelper en forbruker med å innhente konkurrensetilbud.

Basert på følgende forsikringsdata skal du skrive en kort, praktisk forespørsel som kunden kan sende til forsikringsselskaper.

Regler:
- Maks 200–300 ord per forsikringstype
- Fokuser på det som differensierer – dekningsnivå, egenandel, spesielle krav. Ikke list opp standard bransjekrav som alle selskaper oppfyller uansett
- Skriv som om kunden henvender seg direkte til selskapet, i første person ("Jeg ønsker tilbud på...")
- Beskriv hva kunden trenger, IKKE hva de betaler i dag
- Én seksjon per forsikringstype (heading = forsikringstype, f.eks. "Reiseforsikring")
- Legg til en innledende seksjon ("Om meg") med relevante personlige detaljer som påvirker prisen (f.eks. antall reiser, kjørelengde, boligtype), dersom slike finnes i dataene
- KRITISK: Feltene "inclusions" og "exclusions" i dataene beskriver hva den eksisterende forsikringsavtalen dekker eller ekskluderer – de beskriver IKKE hva kunden eier eller har. Ikke nevn enkeltgjenstander fra "inclusions" som om kunden eier dem (f.eks. solcelleanlegg, smykker, spesifikt utstyr), med mindre det fremgår eksplisitt av andre felt at kunden faktisk eier dem
- Trekk kun slutninger om kundens situasjon fra eksplisitte felt som boligtype, kjøretøytype, reisedestinasjon osv.
- Ikke oppfinn eller estimer verdier som ikke finnes i dataene. Hvis et felt er null eller mangler, utelat det helt – ikke gjett
- "Om meg"-seksjonen skal kun inneholde opplysninger som er eksplisitt til stede i dataene. Ikke inferer alder, familiesituasjon, yrke eller andre personlige detaljer
- Feltene med lav datakvalitet (extractionConfidence: "low") skal ikke presenteres som sikre fakta i forespørselen
- Ikke nevn nåværende forsikringsselskap med navn – forespørselen sendes til konkurrenter

Eksisterende forsikringsdata:
${JSON.stringify(policies, null, 2)}

${additionalRequirements ? `Tilleggskrav fra kunden:\n${additionalRequirements}` : ""}

Returner KUN et rent JSON-objekt – ingen forklaring, ingen markdown, ingen kodeblokker:
{
  "title": "Forespørsel om forsikringstilbud",
  "generatedAt": "<ISO-dato>",
  "sections": [
    {
      "heading": "<overskrift>",
      "content": "<innhold som ren tekst>"
    }
  ]
}
`.trim();
