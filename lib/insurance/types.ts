// Alle TypeScript-typer for forsikringsdata i Rolf

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
  type: InsuranceType;
  company: string;
  coverageLevel: string;
  deductible: number | null;
  maxCoverage: number | null;
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
