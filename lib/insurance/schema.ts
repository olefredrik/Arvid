import type { InsuranceType } from "./types";

// Beskriver hvilke felter som skal ekstraheres per forsikringstype
export type FieldDefinition = {
  key: string;
  label: string;         // Norsk visningsnavn i grensesnittet
  description: string;   // Forklaring til Claude om hva som skal finnes
  required: boolean;
};

export type ExtractionSchema = {
  type: InsuranceType;
  fields: FieldDefinition[];
};

// Felter som er felles for alle forsikringstyper
const commonFields: FieldDefinition[] = [
  {
    key: "company",
    label: "Forsikringsselskap",
    description: "Navn på forsikringsselskapet som har utstedt polisen",
    required: true,
  },
  {
    key: "policyNumber",
    label: "Polisenummer",
    description: "Polisenummer eller avtalenummer. Lei etter: 'polisenummer', 'avtalenummer', 'forsikringsnummer'. Ikke forveksle med kundenummer.",
    required: false,
  },
  {
    key: "renewalDate",
    label: "Fornyelsesdato",
    description: "Dato polisen fornyes eller utløper. Lei etter: 'fornyelsesdato', 'utløpsdato', 'gyldig til', 'forsikringstiden utløper', 'neste forfall'. Format: DD.MM.ÅÅÅÅ",
    required: false,
  },
  {
    key: "coverageLevel",
    label: "Dekningsnivå",
    description: "Navn på dekningspakken, f.eks. 'Kasko', 'Super', 'Basis', 'Ansvar'",
    required: true,
  },
  {
    key: "deductible",
    label: "Egenandel",
    description: "Egenandel i norske kroner (kun tallet, uten valutasymbol). Hvis dokumentet oppgir flere egenandeler for ulike skadetyper, bruk den generelle/standard egenandelen.",
    required: false,
  },
  {
    key: "maxCoverage",
    label: "Maksimumsdekning",
    description: "Maksimal utbetaling i norske kroner (kun tallet)",
    required: false,
  },
  {
    key: "annualPremium",
    label: "Årspremie",
    description: `Hva kunden betaler for forsikringen per år, i norske kroner (kun tallet, uten symbol).
Lei etter: "årspremie", "totalpremie", "årsbeløp", "total per år", "sum per år", "pris etter rabatter", "din pris", "totalt", "samlet pris", "din totalpremie".
IKKE forsikringssum, dekningsbeløp, erstatningsbeløp eller maksimumsbeløp – disse beskriver hva som dekkes, ikke hva kunden betaler.
Hvis kun terminpremie (månedlig/kvartalsvis) oppgis: bruk terminbeløp × antall terminer per år KUN hvis antall terminer er eksplisitt oppgitt. Ellers bruk null.
Bruk null hvis du ikke med rimelig sikkerhet kan fastslå hva kunden betaler per år.`,
    required: false,
  },
  {
    key: "isBundledPremium",
    label: "Pakketilbud",
    description: "Sett til true hvis annualPremium er en samlet pris som dekker flere forsikringstyper i samme dokument. Ellers false.",
    required: false,
  },
];

// Eiendom: hus og hytte
const propertyFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "buildingType",
    label: "Bygningstype",
    description: "Type bygning, f.eks. enebolig, rekkehus, leilighet, hytte",
    required: false,
  },
  {
    key: "buildingValue",
    label: "Bygningsverdi",
    description: "Forsikringssum for bygningen i norske kroner",
    required: false,
  },
  {
    key: "naturalDamage",
    label: "Naturskadedekning",
    description: "Om naturskade (flom, skred, storm) er inkludert",
    required: false,
  },
  {
    key: "waterDamage",
    label: "Vannskadedekning",
    description: "Om vannskade og rørskade er dekket, og eventuelle begrensninger",
    required: false,
  },
  {
    key: "fireInsurance",
    label: "Brannsikring",
    description: "Krav til brannsikring (røykvarslere, brannslokkingsapparat o.l.)",
    required: false,
  },
];

// Innboforsikring
const contentsFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "contentsValue",
    label: "Innbosum",
    description: "Forsikringssum for innbo i norske kroner",
    required: false,
  },
  {
    key: "valuables",
    label: "Verdisaker",
    description: "Dekning og eventuelle begrensninger for smykker, elektronikk og andre verdisaker",
    required: false,
  },
  {
    key: "identityTheft",
    label: "ID-tyveri",
    description: "Om ID-tyveriforsikring er inkludert",
    required: false,
  },
];

// Kjøretøy: bil, MC osv.
const vehicleFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "vehicleUsage",
    label: "Kjørelengde/bruk",
    description: "Estimert kjørelengde per år eller bruksbegrensning",
    required: false,
  },
  {
    key: "driverAge",
    label: "Aldersgrense fører",
    description: "Eventuelle aldersrestriksjoner på hvem som kan kjøre",
    required: false,
  },
  {
    key: "roadside",
    label: "Veihjelp",
    description: "Om veihjelp/berging er inkludert",
    required: false,
  },
  {
    key: "rentalCar",
    label: "Leiebil",
    description: "Om leiebil under reparasjon er dekket, og eventuelle begrensninger",
    required: false,
  },
  {
    key: "glassCoverage",
    label: "Steinsprut/glass",
    description: "Om steinsprutskader og glasskader er dekket uten egenandel",
    required: false,
  },
  {
    key: "parkingDamage",
    label: "Parkeringsskade",
    description: "Om skader ved parkering (uten kjent skadevolder) er dekket",
    required: false,
  },
];

// Sykkel – egne felt siden kjøretøyfelter som veihjelp og leiebil ikke er relevante
const bicycleFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "bicycleValue",
    label: "Forsikringssum",
    description: "Forsikringssum for sykkelen i norske kroner",
    required: false,
  },
  {
    key: "isElectric",
    label: "Elsykkel",
    description: "Om forsikringen gjelder en elsykkel (true/false)",
    required: false,
  },
  {
    key: "theftCoverage",
    label: "Tyveridekning",
    description: "Om tyveri er dekket, og eventuelle krav til låsing eller sikring",
    required: false,
  },
  {
    key: "ageLimit",
    label: "Aldersgrense (sykkel)",
    description: "Eventuell øvre aldersgrense på sykkelen (i år) for at den er forsikret",
    required: false,
  },
];

// Båt
const boatFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "boatType",
    label: "Båttype",
    description: "Type båt, f.eks. motorbåt, seilbåt, RIB",
    required: false,
  },
  {
    key: "maxSpeed",
    label: "Maks hastighet",
    description: "Eventuell hastighetsbegrensning i knop",
    required: false,
  },
  {
    key: "geographicArea",
    label: "Fartsområde",
    description: "Geografisk område båten er dekket i (f.eks. norsk kyst, Europa, verden)",
    required: false,
  },
  {
    key: "motorCoverage",
    label: "Motordekning",
    description: "Om motoren er dekket og eventuelle begrensninger",
    required: false,
  },
  {
    key: "winterStorage",
    label: "Vinteropplag",
    description: "Om skader under vinteropplag er dekket",
    required: false,
  },
];

// Reiseforsikring
const travelFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "coverageArea",
    label: "Dekningsområde",
    description: "Geografisk dekningsområde, f.eks. Norden, Europa, verden",
    required: false,
  },
  {
    key: "maxTripDuration",
    label: "Maks reisevarighet",
    description: "Maksimal varighet per reise som er dekket",
    required: false,
  },
  {
    key: "medicalCoverage",
    label: "Legehjelp/sykehus",
    description: "Dekning for legehjelp og sykehusinnleggelse i utlandet",
    required: false,
  },
  {
    key: "cancellationCoverage",
    label: "Avbestillingsforsikring",
    description: "Om avbestilling er dekket og eventuelle begrensninger",
    required: false,
  },
  {
    key: "luggageCoverage",
    label: "Bagasjedekning",
    description: "Dekning for tapt eller skadet bagasje",
    required: false,
  },
  {
    key: "familyCoverage",
    label: "Familiedekning",
    description: "Om forsikringen gjelder for hele familien eller kun polisehaver",
    required: false,
  },
];

// Dyreforsikring
const animalFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "animalType",
    label: "Dyretype",
    description: "Type dyr, f.eks. hund, katt, hest",
    required: false,
  },
  {
    key: "vetCoverage",
    label: "Veterinærdekning",
    description: "Maksimal dekning for veterinærbehandling per år",
    required: false,
  },
  {
    key: "liabilityCoverage",
    label: "Ansvarsforsikring",
    description: "Om ansvarsforsikring for skader dyret påfører andre er inkludert",
    required: false,
  },
  {
    key: "ageLimit",
    label: "Aldersgrense",
    description: "Eventuell øvre aldersgrense for dyret",
    required: false,
  },
];

// Droner
const droneFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "maxWeight",
    label: "Maks vekt",
    description: "Maksimal vekt på drone som er forsikret",
    required: false,
  },
  {
    key: "commercialUse",
    label: "Kommersiell bruk",
    description: "Om kommersiell bruk er dekket",
    required: false,
  },
  {
    key: "liabilityCoverage",
    label: "Ansvarsforsikring",
    description: "Ansvarsforsikring for skader dronen påfører tredjepart",
    required: false,
  },
];

// Bunad
const bunadFields: FieldDefinition[] = [
  ...commonFields,
  {
    key: "bunadValue",
    label: "Forsikringssum",
    description: "Forsikringssum for bunaden i norske kroner",
    required: false,
  },
  {
    key: "accessories",
    label: "Tilbehør",
    description: "Om tilbehør (sølv, belte, sko) er inkludert i dekningssummen",
    required: false,
  },
];

// Samlede skjemaer per forsikringstype
export const EXTRACTION_SCHEMAS: Record<InsuranceType, ExtractionSchema> = {
  house: { type: "house", fields: propertyFields },
  cabin: { type: "cabin", fields: propertyFields },
  contents: { type: "contents", fields: contentsFields },
  car: { type: "car", fields: vehicleFields },
  "vintage-car": { type: "vintage-car", fields: vehicleFields },
  "deregistered-vehicle": { type: "deregistered-vehicle", fields: vehicleFields },
  "russ-car": { type: "russ-car", fields: vehicleFields },
  motorhome: { type: "motorhome", fields: vehicleFields },
  caravan: { type: "caravan", fields: vehicleFields },
  moped: { type: "moped", fields: vehicleFields },
  atv: { type: "atv", fields: vehicleFields },
  motorcycle: { type: "motorcycle", fields: vehicleFields },
  "e-scooter": { type: "e-scooter", fields: vehicleFields },
  snowmobile: { type: "snowmobile", fields: vehicleFields },
  trailer: { type: "trailer", fields: vehicleFields },
  bicycle: { type: "bicycle", fields: bicycleFields },
  boat: { type: "boat", fields: boatFields },
  drone: { type: "drone", fields: droneFields },
  bunad: { type: "bunad", fields: bunadFields },
  animal: { type: "animal", fields: animalFields },
  travel: { type: "travel", fields: travelFields },
};
