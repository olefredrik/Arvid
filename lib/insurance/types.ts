// Alle TypeScript-typer for forsikringsdata i Arvid

// Støttede forsikringstyper
export type InsuranceType =
  // Eiendom
  | "house"
  | "cabin"
  | "contents"
  // Kjøretøy
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
  // Fritid og verdier
  | "boat"
  | "drone"
  | "bunad"
  // Person og dyr
  | "animal"
  | "travel";

// Konfidensnivå for ekstrahert data
export type ExtractionConfidence = "high" | "medium" | "low";

// Én forsikringspolise ekstrahert fra et dokument
export type InsurancePolicy = {
  _id?: string; // Intern klient-ID, ikke fra Claude – brukes for å identifisere poliser i state
  type: InsuranceType;
  company: string;
  policyNumber: string | null;
  coverageLevel: string;
  deductible: number | null;
  maxCoverage: number | null;
  annualPremium: number | null;
  isBundledPremium: boolean; // true = annualPremium dekker flere forsikringstyper i samme dokument
  premiumIncludesTrafficFee?: boolean; // Kun kjøretøy: true = annualPremium inkluderer trafikkforsikringsavgift til staten
  inclusions: string[];
  exclusions: string[];
  notes: string[];
  extractionConfidence: ExtractionConfidence;
};

// Dokument med ekstraherte forsikringsdata
export type ExtractedDocument = {
  fileName: string;
  rawText: string;
  policies: InsurancePolicy[];
  extractedAt: Date;
};

// Sesjonsstate – aldri persistent lagret
export type Session = {
  id: string; // Tilfeldig UUID, ikke knyttet til bruker
  documents: ExtractedDocument[];
  createdAt: Date; // Brukes kun for sesjonsutløp (30 min inaktivitet)
};

// Sammenligning mellom én nåværende polise og ett mottatt tilbud
export type PolicyComparison = {
  id: string;                   // par-id, unik per sammenligning
  type: InsuranceType;
  current: InsurancePolicy;
  offer: InsurancePolicy;
  offerDocumentCount: number;   // antall dokumenter som ble slått sammen
  premiumDiff: number | null;   // negativ = tilbudet er billigere
  assessment: string;
  coverageDifferences: string[];
  verdict: "Bytt" | "Behold" | "Vurder";
};

// Prissammendrag for ett tilbudsselskap. Summene omfatter bare forsikringer som finnes på begge sider.
export type PriceSummary = {
  company: string;
  includedTypes: InsuranceType[];   // med i summene
  excludedTypes: InsuranceType[];   // nåværende forsikringer som ikke er med (mangler i tilbudet eller mangler pris)
  currentTotal: number | null;
  offerTotal: number | null;
  hasBundledPremium: boolean;       // minst én pris er en pakkepris som dekker mer enn det som sammenlignes
  hasTrafficFeeMismatch: boolean;   // minst ett par der bare den ene prisen inkluderer trafikkforsikringsavgift
};

// Samlet sammenligningsresultat
export type ComparisonResult = {
  comparisons: PolicyComparison[];
  unmatchedCurrent: InsurancePolicy[];  // nåværende forsikringer som ingen tilbud dekker
  unmatchedOffers: InsurancePolicy[];   // tilbud på typer brukeren ikke har i dag
  priceSummaries: PriceSummary[];       // ett per tilbudsselskap
  recommendation: string;
  generatedAt: string;
};

// Kategorier for norsk display
export const INSURANCE_CATEGORIES: Record<string, InsuranceType[]> = {
  Eiendom: ["house", "cabin", "contents"],
  Kjøretøy: [
    "car",
    "vintage-car",
    "deregistered-vehicle",
    "russ-car",
    "motorhome",
    "caravan",
    "moped",
    "atv",
    "motorcycle",
    "e-scooter",
    "snowmobile",
    "trailer",
    "bicycle",
  ],
  "Fritid og verdier": ["boat", "drone", "bunad"],
  "Person og dyr": ["animal", "travel"],
};

// Norske navn per forsikringstype
export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  house: "Husforsikring",
  cabin: "Hytteforsikring",
  contents: "Innboforsikring",
  car: "Bilforsikring",
  "vintage-car": "Veteranbil",
  "deregistered-vehicle": "Avregistrert kjøretøy",
  "russ-car": "Russebil",
  motorhome: "Bobil",
  caravan: "Campingvogn",
  moped: "Moped",
  atv: "ATV",
  motorcycle: "MC",
  "e-scooter": "Elsparkesykkel",
  snowmobile: "Snøscooter",
  trailer: "Tilhenger",
  bicycle: "Sykkel",
  boat: "Båtforsikring",
  drone: "Droneforsikring",
  bunad: "Bunadforsikring",
  animal: "Dyreforsikring",
  travel: "Reiseforsikring",
};

// Alle forsikringstyper som liste, brukes i svarskjemaene til Claude
export const INSURANCE_TYPES = Object.keys(INSURANCE_TYPE_LABELS) as [InsuranceType, ...InsuranceType[]];
