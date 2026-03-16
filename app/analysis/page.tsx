"use client";

// Hovedflyt: opplasting → analyse → oversikt → tilbudsforespørsel
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Sykler gjennom meldinger med jevne mellomrom mens Arvid jobber
function useRotatingMessage(messages: string[], intervalMs = 3500): string {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % messages.length;
      setIndex(indexRef.current);
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return messages[index];
}

const EXTRACTION_MESSAGES = [
  "Arvid blar gjennom dokumentene...",
  "Arvid justerer brillene og leser videre...",
  "Arvid har sett mer kompliserte poliser...",
  "Arvid sjekker det med liten skrift også...",
  "Arvid noterer egenandelen i margen...",
  "Arvid leter etter forsikringsbeviset i bunken...",
  "Arvid har full kontroll på situasjonen...",
  "Arvid krysssjekker med sin indre kunnskapsbase...",
  "Arvid er ikke overrasket over vilkårene...",
  "Arvid tar seg god tid – det lønner seg.",
];

const QUOTE_MESSAGES = [
  "Arvid formulerer seg med omhu...",
  "Arvid har gjort dette mange ganger...",
  "Arvid velger hvert ord nøye...",
  "Arvid skriver rent... digitalt, da.",
  "Arvid er fornøyd med formuleringen så langt...",
  "Arvid setter opp kravspesifikasjonen...",
  "Arvid tenker på deg mens han skriver...",
  "Arvid har formulert verre ting...",
  "Arvid dobbeltsjekker at ingenting er glemt...",
  "Arvid legger siste hånd på verket...",
];

const COMPARISON_MESSAGES = [
  "Arvid sammenligner pris og vilkår...",
  "Arvid er ikke lett å imponere...",
  "Arvid ser nøye på det som skiller tilbudene...",
  "Arvid har lagt merke til noen forskjeller...",
  "Arvid konkluderer straks...",
  "Arvid tar ikke stilling til favoritter...",
  "Arvid ser på mer enn bare prisen...",
  "Arvid har bladd gjennom mange tilbud i sin tid...",
  "Arvid veier fordeler og ulemper nøye...",
  "Arvid liker ikke overraskelser i vilkårene...",
];
import Upload from "@/components/upload";
import Overview from "@/components/overview";
import ConfirmDialog from "@/components/confirm-dialog";
import Report, { type QuoteRequest } from "@/components/report";
import Comparison from "@/components/comparison";
import type { InsurancePolicy, InsuranceType, ComparisonResult } from "@/lib/insurance/types";
import { mergePoliciesByType } from "@/lib/insurance/merge";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

// Parser API-respons trygt – håndterer 504-timeout og HTML-body fra Vercel
async function safeJson(response: Response): Promise<{ error?: string; [key: string]: unknown }> {
  if (response.status === 504) {
    return { error: "Arvid er populær i dag og håndterer litt for mange forespørsler på én gang. Hent deg en kopp kaffe, så er han klar for deg igjen om et par minutter." };
  }
  try {
    return await response.json();
  } catch {
    return { error: "Noe gikk galt. Prøv igjen." };
  }
}

type Step = "upload" | "processing" | "overview" | "generating" | "report" | "compare-upload" | "compare-processing" | "offer-review" | "comparing" | "comparison";

type ProcessingStatus = {
  fileName: string;
  done: boolean;
  error?: string;
};

export default function AnalysisPage() {
  const { capture } = useAnalytics();
  const [step, setStep] = useState<Step>("upload");
  const extractionMessage = useRotatingMessage(EXTRACTION_MESSAGES);
  const quoteMessage = useRotatingMessage(QUOTE_MESSAGES);
  const comparisonMessage = useRotatingMessage(COMPARISON_MESSAGES);
  const [compareMode, setCompareMode] = useState(false);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [offerPolicies, setOfferPolicies] = useState<InsurancePolicy[]>([]);
  const [offerStatuses, setOfferStatuses] = useState<ProcessingStatus[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [failedOfferFiles, setFailedOfferFiles] = useState<File[]>([]);
  const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
  const [invalidOfferFiles, setInvalidOfferFiles] = useState<string[]>([]);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const replaceOfferFileRef = useRef<HTMLInputElement>(null);
  const [allPoliciesRemoved, setAllPoliciesRemoved] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "compare") setCompareMode(true);
  }, []);

  const handleFiles = async (files: File[]) => {
    setStep("processing");
    setStatuses(files.map((f) => ({ fileName: f.name, done: false })));
    setFailedFiles([]);
    setInvalidFiles([]);
    capture("analysis_started", { file_count: files.length });

    const results: InsurancePolicy[] = [];
    const newFailedFiles: File[] = [];
    const newInvalidFiles: string[] = [];

    // Analyser filer sekvensielt for å unngå å overbelaste API-et
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        let response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });
        let data = await safeJson(response);

        // Auto-retry én gang ved rate limiting
        if (response.status === 429) {
          await new Promise<void>((resolve) => setTimeout(resolve, 5000));
          const retryFormData = new FormData();
          retryFormData.append("file", file);
          response = await fetch("/api/extract", { method: "POST", body: retryFormData });
          data = await safeJson(response);
        }

        if (!response.ok) {
          setStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, done: true, error: data.error ?? "Ukjent feil" } : s
            )
          );
          // 400/413 betyr at selve filen er feil – retry hjelper ikke
          if (response.status === 400 || response.status === 413) {
            newInvalidFiles.push(file.name);
          } else {
            newFailedFiles.push(file);
          }
          capture("pdf_extraction_failed", { file_name: file.name });
          continue;
        }

        results.push(...(data.policies as InsurancePolicy[]));
        capture("pdf_extracted", { file_name: file.name, policy_count: (data.policies as InsurancePolicy[]).length });
      } catch {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, done: true, error: "Nettverksfeil" } : s
          )
        );
        newFailedFiles.push(file);
        capture("pdf_extraction_failed", { file_name: file.name, reason: "network_error" });
        continue;
      }

      setStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, done: true } : s))
      );
    }

    setFailedFiles(newFailedFiles);
    setInvalidFiles(newInvalidFiles);
    setPolicies((prev) => {
      const merged = mergePoliciesByType([...prev, ...results]);
      capture("analysis_completed", { policy_count: merged.length, insurance_types: merged.map((p) => p.type) });
      return merged;
    });
    setStep("overview");
  };

  const handlePolicyUpdate = (type: InsuranceType, field: "annualPremium" | "deductible", value: number | null) => {
    setPolicies((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [field]: value } : p))
    );
  };

  const handlePolicyRemove = (type: InsuranceType) => {
    setPolicies((prev) => {
      const next = prev.filter((p) => p.type !== type);
      if (next.length === 0) setAllPoliciesRemoved(true);
      return next;
    });
  };

  const handleGenerateQuoteRequest = async () => {
    setStep("generating");
    setQuoteError(null);
    capture("quote_request_started");

    try {
      const response = await fetch("/api/generate-quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        setQuoteError(data.error ?? "Ukjent feil");
        setStep("overview");
        capture("quote_request_failed");
        return;
      }

      setQuoteRequest(data.quoteRequest as QuoteRequest);
      capture("quote_request_generated");
      setStep("report");
    } catch {
      setQuoteError("Nettverksfeil – prøv igjen");
      setStep("overview");
      capture("quote_request_failed", { reason: "network_error" });
    }
  };

  const handleOfferFiles = async (files: File[]) => {
    setStep("compare-processing");
    setOfferStatuses(files.map((f) => ({ fileName: f.name, done: false })));
    setFailedOfferFiles([]);
    setInvalidOfferFiles([]);
    capture("comparison_started", { file_count: files.length });

    const results: InsurancePolicy[] = [];
    const newFailedOfferFiles: File[] = [];
    const newInvalidOfferFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        let response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });
        let data = await safeJson(response);

        // Auto-retry én gang ved rate limiting
        if (response.status === 429) {
          await new Promise<void>((resolve) => setTimeout(resolve, 5000));
          const retryFormData = new FormData();
          retryFormData.append("file", file);
          response = await fetch("/api/extract", { method: "POST", body: retryFormData });
          data = await safeJson(response);
        }

        if (!response.ok) {
          setOfferStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, done: true, error: data.error ?? "Ukjent feil" } : s
            )
          );
          if (response.status === 400 || response.status === 413) {
            newInvalidOfferFiles.push(file.name);
          } else {
            newFailedOfferFiles.push(file);
          }
          capture("pdf_extraction_failed", { file_name: file.name, context: "offer" });
          continue;
        }

        results.push(...(data.policies as InsurancePolicy[]));
        capture("pdf_extracted", { file_name: file.name, context: "offer", policy_count: (data.policies as InsurancePolicy[]).length });
      } catch {
        setOfferStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, done: true, error: "Nettverksfeil" } : s
          )
        );
        newFailedOfferFiles.push(file);
        capture("pdf_extraction_failed", { file_name: file.name, context: "offer", reason: "network_error" });
        continue;
      }

      setOfferStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, done: true } : s))
      );
    }

    setFailedOfferFiles(newFailedOfferFiles);
    setInvalidOfferFiles(newInvalidOfferFiles);
    if (results.length > 0) {
      setOfferPolicies((prev) => mergePoliciesByType([...prev, ...results]));
      setStep("offer-review");
    } else {
      setStep("compare-upload");
    }
  };

  const handleOfferPolicyUpdate = (type: InsuranceType, field: "annualPremium" | "deductible", value: number | null) => {
    setOfferPolicies((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [field]: value } : p))
    );
  };

  const handleRunComparison = async () => {
    setStep("comparing");
    setCompareError(null);
    capture("comparison_run");
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPolicies: policies, offerPolicies }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        setCompareError(data.error ?? "Ukjent feil");
        setStep("offer-review");
        capture("comparison_failed");
        return;
      }

      setComparison(data.comparison as ComparisonResult);
      capture("comparison_completed");
      setStep("comparison");
    } catch {
      setCompareError("Nettverksfeil – prøv igjen");
      setStep("offer-review");
      capture("comparison_failed", { reason: "network_error" });
    }
  };

  const errors = statuses.filter((s) => s.error);
  const offerErrors = offerStatuses.filter((s) => s.error);

  return (
    <main className="min-h-screen bg-white dark:bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:p-8">
      <Link href="/" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-8 inline-block">
        ← Tilbake
      </Link>

      {/* Steg 1: Opplasting */}
      {step === "upload" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">
            {compareMode ? "Last opp dine nåværende forsikringer" : "Last opp forsikringsdokumenter"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {compareMode
              ? "Arvid bruker disse som utgangspunkt når tilbudet skal vurderes."
              : "Arvid liker best forsikringsbevis, ikke bare generelle vilkår."}
          </p>
          <Upload onFiles={handleFiles} />
        </>
      )}

      {/* Steg 1 → 2: Analyserer */}
      {step === "processing" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Analyserer dokumenter</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {extractionMessage}
          </p>
          <div className="space-y-3" aria-live="polite" aria-label="Prosessering av dokumenter">
            {statuses.map((s) => (
              <div
                key={s.fileName}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                {s.done ? (
                  s.error ? (
                    <span className="text-red-500 dark:text-red-400 text-sm" aria-label="Feil">✕</span>
                  ) : (
                    <span className="text-green-500 dark:text-green-400 text-sm" aria-label="Fullført">✓</span>
                  )
                ) : (
                  <span className="inline-block w-4 h-4 border-2 border-amber-700 dark:border-amber-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Behandler" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{s.fileName}</span>
                {s.error && (
                  <span className="text-xs text-red-500 dark:text-red-400 ml-auto">{s.error}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Steg 2: Oversikt */}
      {step === "overview" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Forsikringsoversikt</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Arvid kan ta feil. Stemmer premie og egenandel? Klikk på tallene hvis du ønsker å korrigere.
          </p>

          {errors.length > 0 && (
            <div role="alert" className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">
                {errors.length === 1 ? "Ett dokument" : `${errors.length} dokumenter`} kunne ikke analyseres:
              </p>
              {errors.map((s) => (
                <p key={s.fileName}>
                  {s.fileName}: {s.error}
                </p>
              ))}
              {failedFiles.length > 0 && (
                <button
                  onClick={() => handleFiles(failedFiles)}
                  className="mt-3 underline underline-offset-2 hover:no-underline cursor-pointer"
                >
                  Prøv igjen for {failedFiles.length === 1 ? "denne filen" : `disse ${failedFiles.length} filene`}
                </button>
              )}
              {invalidFiles.length > 0 && (
                <>
                  <input
                    ref={replaceFileRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length > 0) handleFiles(files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => replaceFileRef.current?.click()}
                    className="mt-3 underline underline-offset-2 hover:no-underline cursor-pointer block"
                  >
                    Last opp en annen fil
                  </button>
                </>
              )}
            </div>
          )}

          {quoteError && (
            <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              <p className="mb-2">Kunne ikke generere tilbudsforespørsel: {quoteError}</p>
              <button
                onClick={handleGenerateQuoteRequest}
                className="underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                Prøv igjen
              </button>
            </div>
          )}

          {policies.length > 0 ? (
            <>
              <Overview policies={policies} onUpdate={handlePolicyUpdate} onRemove={handlePolicyRemove} />
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setStatuses([]); setAllPoliciesRemoved(false); setStep("upload"); }}
                  className="px-4 py-2 text-sm text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Last opp flere dokumenter
                </button>
                {compareMode ? (
                  <button
                    onClick={() => { setOfferPolicies([]); setOfferStatuses([]); setCompareError(null); setStep("compare-upload"); }}
                    className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors cursor-pointer"
                  >
                    Last opp mottatt tilbud →
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateQuoteRequest}
                    className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors cursor-pointer"
                  >
                    Generer tilbudsforespørsel →
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              {allPoliciesRemoved ? (
                <>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Du har fjernet alle forsikringene.</p>
                  <button
                    onClick={() => { setStatuses([]); setAllPoliciesRemoved(false); setStep("upload"); }}
                    className="text-amber-700 dark:text-amber-500 hover:underline text-sm cursor-pointer"
                  >
                    Last opp nye dokumenter
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Ingen forsikringer ble ekstrahert.</p>
                  <button
                    onClick={() => { setStatuses([]); setStep("upload"); }}
                    className="text-amber-700 dark:text-amber-500 hover:underline text-sm cursor-pointer"
                  >
                    Prøv igjen
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Steg 2 → 3: Genererer */}
      {step === "generating" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Genererer tilbudsforespørsel</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Arvid formulerer en kravspesifikasjon du kan sende til forsikringsselskaper
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700" role="status">
            <span className="inline-block w-4 h-4 border-2 border-amber-700 dark:border-amber-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span className="text-sm text-gray-700 dark:text-gray-200">{quoteMessage}</span>
          </div>
        </>
      )}

      {/* Steg 3: Rapport */}
      {step === "report" && quoteRequest && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Tilbudsforespørsel</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Last ned og send til selskaper du vurderer. Har du allerede mottatt tilbud? Bla ned.
          </p>
          <Report
            quoteRequest={quoteRequest}
            policies={policies}
            onBack={() => setStep("overview")}
          />
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">Har du mottatt tilbud?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Last opp tilbudene du har fått, så sammenligner Arvid dem med avtalene du har i dag.
            </p>
            <button
              onClick={() => { setOfferPolicies([]); setOfferStatuses([]); setCompareError(null); setStep("compare-upload"); }}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors cursor-pointer"
            >
              Sammenlign mottatte tilbud →
            </button>
          </div>
        </>
      )}

      {/* Steg 4: Last opp tilbud */}
      {step === "compare-upload" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Last opp mottatte tilbud</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Arvid trenger tilbudsdokumentet for å sammenligne pris og vilkår mot det du har i dag.
          </p>
          {compareError && (
            <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {compareError}
            </div>
          )}
          <Upload onFiles={handleOfferFiles} />

        </>
      )}

      {/* Steg 4: Gjennomgang av mottatte tilbud */}
      {step === "offer-review" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Se gjennom mottatte tilbud</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Arvid kan feiltolke tall fra tilbudsdokumenter. Rett opp eventuelle feil før du går videre.
          </p>

          {offerErrors.length > 0 && (
            <div role="alert" className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">
                {offerErrors.length === 1 ? "Ett tilbudsdokument" : `${offerErrors.length} tilbudsdokumenter`} kunne ikke analyseres:
              </p>
              {offerErrors.map((s) => (
                <p key={s.fileName}>
                  {s.fileName}: {s.error}
                </p>
              ))}
              {failedOfferFiles.length > 0 && (
                <button
                  onClick={() => handleOfferFiles(failedOfferFiles)}
                  className="mt-3 underline underline-offset-2 hover:no-underline cursor-pointer"
                >
                  Prøv igjen for {failedOfferFiles.length === 1 ? "denne filen" : `disse ${failedOfferFiles.length} filene`}
                </button>
              )}
              {invalidOfferFiles.length > 0 && (
                <>
                  <input
                    ref={replaceOfferFileRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length > 0) handleOfferFiles(files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => replaceOfferFileRef.current?.click()}
                    className="mt-3 underline underline-offset-2 hover:no-underline cursor-pointer block"
                  >
                    Last opp en annen fil
                  </button>
                </>
              )}
            </div>
          )}

          {compareError && (
            <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              <p className="mb-2">{compareError}</p>
              <button
                onClick={handleRunComparison}
                className="underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                Prøv igjen
              </button>
            </div>
          )}

          {offerPolicies.some((p) => p.isBundledPremium) && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              Ett eller flere tilbud er pakketilbud der én pris dekker flere forsikringstyper. Prisen vises på alle poliser i pakken, men telles kun én gang i totalen.
            </div>
          )}

          <Overview policies={offerPolicies} onUpdate={handleOfferPolicyUpdate} />

          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
            >
              Nullstill tilbud
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => { setOfferStatuses([]); setCompareError(null); setStep("compare-upload"); }}
                className="px-4 py-2 text-sm text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Legg til dokument
              </button>
              <button
                onClick={handleRunComparison}
                className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors cursor-pointer"
              >
                Bekreft og sammenlign →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Steg 4: Kjører sammenligning */}
      {step === "comparing" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Sammenligner tilbud</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Arvid analyserer forskjeller i pris og vilkår
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700" role="status">
            <span className="inline-block w-4 h-4 border-2 border-amber-700 dark:border-amber-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span className="text-sm text-gray-700 dark:text-gray-200">{comparisonMessage}</span>
          </div>
        </>
      )}

      {/* Steg 4: Analyserer tilbud */}
      {step === "compare-processing" && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Analyserer og sammenligner tilbud</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {extractionMessage}
          </p>
          <div className="space-y-3" aria-live="polite" aria-label="Prosessering av tilbud">
            {offerStatuses.map((s) => (
              <div
                key={s.fileName}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                {s.done ? (
                  s.error ? (
                    <span className="text-red-500 dark:text-red-400 text-sm" aria-label="Feil">✕</span>
                  ) : (
                    <span className="text-green-500 dark:text-green-400 text-sm" aria-label="Fullført">✓</span>
                  )
                ) : (
                  <span className="inline-block w-4 h-4 border-2 border-amber-700 dark:border-amber-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Behandler" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{s.fileName}</span>
                {s.error && (
                  <span className="text-xs text-red-500 dark:text-red-400 ml-auto">{s.error}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Steg 4: Sammenligningsresultat */}
      {step === "comparison" && comparison && (
        <>
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Sammenligning av tilbud</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Her er Arvids vurdering. Les den kritisk, og ta beslutningen selv.
          </p>
          <Comparison
            comparison={comparison}
            onBack={() => setStep("offer-review")}
            onRestart={() => {
              capture("analysis_reset");
              setPolicies([]);
              setStatuses([]);
              setQuoteRequest(null);
              setQuoteError(null);
              setOfferPolicies([]);
              setOfferStatuses([]);
              setComparison(null);
              setCompareError(null);
              setStep("upload");
            }}
          />
        </>
      )}
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          title="Nullstille tilbudet?"
          message="Arvid makulerer alle tilbudspoliser og sender deg tilbake til opplasting. Dette kan ikke angres."
          confirmLabel="Nullstill"
          onConfirm={() => {
            setOfferPolicies([]);
            setOfferStatuses([]);
            setCompareError(null);
            setShowResetConfirm(false);
            setStep("compare-upload");
          }}
          onCancel={() => setShowResetConfirm(false)}
          isDestructive
        />
      )}
    </main>
  );
}
