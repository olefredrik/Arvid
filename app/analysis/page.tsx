"use client";

// Hovedflyt: opplasting → analyse → oversikt → tilbudsforespørsel
import { useState, useEffect } from "react";
import Upload from "@/components/upload";
import Overview from "@/components/overview";
import Report, { type QuoteRequest } from "@/components/report";
import Comparison from "@/components/comparison";
import type { InsurancePolicy, InsuranceType, ComparisonResult } from "@/lib/insurance/types";
import { mergePoliciesByType } from "@/lib/insurance/merge";

type Step = "upload" | "processing" | "overview" | "generating" | "report" | "compare-upload" | "compare-processing" | "offer-review" | "comparing" | "comparison";

type ProcessingStatus = {
  fileName: string;
  done: boolean;
  error?: string;
};

export default function AnalysisPage() {
  const [step, setStep] = useState<Step>("upload");
  const [compareMode, setCompareMode] = useState(false);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [offerPolicies, setOfferPolicies] = useState<InsurancePolicy[]>([]);
  const [offerStatuses, setOfferStatuses] = useState<ProcessingStatus[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "compare") setCompareMode(true);
  }, []);

  const handleFiles = async (files: File[]) => {
    setStep("processing");
    setStatuses(files.map((f) => ({ fileName: f.name, done: false })));

    const results: InsurancePolicy[] = [];

    // Analyser filer sekvensielt for å unngå å overbelaste API-et
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, done: true, error: data.error ?? "Ukjent feil" } : s
            )
          );
          continue;
        }

        results.push(...(data.policies as InsurancePolicy[]));
      } catch {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, done: true, error: "Nettverksfeil" } : s
          )
        );
        continue;
      }

      setStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, done: true } : s))
      );
    }

    setPolicies(mergePoliciesByType(results));
    setStep("overview");
  };

  const handlePolicyUpdate = (type: InsuranceType, field: "annualPremium" | "deductible", value: number | null) => {
    setPolicies((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [field]: value } : p))
    );
  };

  const handleGenerateQuoteRequest = async () => {
    setStep("generating");
    setQuoteError(null);

    try {
      const response = await fetch("/api/generate-quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies }),
      });

      const data = await response.json();

      if (!response.ok) {
        setQuoteError(data.error ?? "Ukjent feil");
        setStep("overview");
        return;
      }

      setQuoteRequest(data.quoteRequest as QuoteRequest);
      setStep("report");
    } catch {
      setQuoteError("Nettverksfeil – prøv igjen");
      setStep("overview");
    }
  };

  const handleOfferFiles = async (files: File[]) => {
    setStep("compare-processing");
    setOfferStatuses(files.map((f) => ({ fileName: f.name, done: false })));

    const results: InsurancePolicy[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setOfferStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, done: true, error: data.error ?? "Ukjent feil" } : s
            )
          );
          continue;
        }

        results.push(...(data.policies as InsurancePolicy[]));
      } catch {
        setOfferStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, done: true, error: "Nettverksfeil" } : s
          )
        );
        continue;
      }

      setOfferStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, done: true } : s))
      );
    }

    if (results.length > 0) {
      setOfferPolicies(mergePoliciesByType(results));
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
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPolicies: policies, offerPolicies }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCompareError(data.error ?? "Ukjent feil");
        setStep("offer-review");
        return;
      }

      setComparison(data.comparison as ComparisonResult);
      setStep("comparison");
    } catch {
      setCompareError("Nettverksfeil – prøv igjen");
      setStep("offer-review");
    }
  };

  const errors = statuses.filter((s) => s.error);

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <a href="/" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-8 inline-block">
        ← Tilbake
      </a>

      {/* Steg 1: Opplasting */}
      {step === "upload" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">
            {compareMode ? "Last opp dine nåværende forsikringer" : "Last opp forsikringsdokumenter"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {compareMode
              ? "Last opp dine nåværende forsikringer – vi bruker dem som grunnlag for sammenligningen"
              : "Steg 1 av 3 – Last opp PDF-filene du har mottatt fra forsikringsselskapet"}
          </p>
          <Upload onFiles={handleFiles} />
        </>
      )}

      {/* Steg 1 → 2: Analyserer */}
      {step === "processing" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Analyserer dokumenter</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Rolf leser og strukturerer innholdet i forsikringsavtalene dine
          </p>
          <div className="space-y-3">
            {statuses.map((s) => (
              <div
                key={s.fileName}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {s.done ? (
                  s.error ? (
                    <span className="text-red-500 dark:text-red-400 text-sm">✕</span>
                  ) : (
                    <span className="text-green-500 dark:text-green-400 text-sm">✓</span>
                  )
                ) : (
                  <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
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
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Forsikringsoversikt</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {compareMode ? "Se gjennom og bekreft at oversikten er riktig" : "Steg 2 av 3 – Se gjennom og bekreft at oversikten er riktig"}
          </p>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">
                {errors.length === 1 ? "Ett dokument" : `${errors.length} dokumenter`} kunne ikke analyseres:
              </p>
              {errors.map((s) => (
                <p key={s.fileName}>
                  {s.fileName}: {s.error}
                </p>
              ))}
            </div>
          )}

          {quoteError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              Kunne ikke generere tilbudsforespørsel: {quoteError}
            </div>
          )}

          {policies.length > 0 ? (
            <>
              <Overview policies={policies} onUpdate={handlePolicyUpdate} />
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setPolicies([]); setStatuses([]); setStep("upload"); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Last opp flere dokumenter
                </button>
                {compareMode ? (
                  <button
                    onClick={() => { setOfferPolicies([]); setOfferStatuses([]); setCompareError(null); setStep("compare-upload"); }}
                    className="px-6 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    Last opp mottatt tilbud →
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateQuoteRequest}
                    className="px-6 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    Generer tilbudsforespørsel →
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Ingen forsikringer ble ekstrahert.</p>
              <button
                onClick={() => { setStatuses([]); setStep("upload"); }}
                className="text-amber-700 hover:underline text-sm"
              >
                Prøv igjen
              </button>
            </div>
          )}
        </>
      )}

      {/* Steg 2 → 3: Genererer */}
      {step === "generating" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Genererer tilbudsforespørsel</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Rolf formulerer en kravspesifikasjon du kan sende til forsikringsselskaper
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-700 dark:text-gray-200">Formulerer forespørsel...</span>
          </div>
        </>
      )}

      {/* Steg 3: Rapport */}
      {step === "report" && quoteRequest && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Tilbudsforespørsel</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Steg 3 av 4 – Last ned og send til forsikringsselskaper selv
          </p>
          <Report
            quoteRequest={quoteRequest}
            onBack={() => setStep("overview")}
          />
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">Har du mottatt tilbud?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Last opp tilbudene du har fått, så sammenligner Rolf dem med avtalene du har i dag.
            </p>
            <button
              onClick={() => { setOfferPolicies([]); setOfferStatuses([]); setCompareError(null); setStep("compare-upload"); }}
              className="px-6 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
            >
              Sammenlign mottatte tilbud →
            </button>
          </div>
        </>
      )}

      {/* Steg 4: Last opp tilbud */}
      {step === "compare-upload" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Last opp mottatte tilbud</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {compareMode ? "Last opp tilbudene du har mottatt fra forsikringsselskaper" : "Steg 4 av 4 – Last opp tilbudene du har mottatt fra forsikringsselskaper"}
          </p>
          {compareError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {compareError}
            </div>
          )}
          <Upload onFiles={handleOfferFiles} />
        </>
      )}

      {/* Steg 4: Gjennomgang av mottatte tilbud */}
      {step === "offer-review" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Se gjennom mottatte tilbud</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Steg 4 av 5 – Kontroller at prisene er riktig ekstrahert før sammenligning
          </p>

          {compareError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {compareError}
            </div>
          )}

          {offerPolicies.some((p) => p.isBundledPremium) && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              Ett eller flere tilbud er pakketilbud der én pris dekker flere forsikringstyper. Prisen vises på alle poliser i pakken, men telles kun én gang i totalen.
            </div>
          )}

          <Overview policies={offerPolicies} onUpdate={handleOfferPolicyUpdate} />

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => { setOfferPolicies([]); setOfferStatuses([]); setCompareError(null); setStep("compare-upload"); }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Last opp på nytt
            </button>
            <button
              onClick={handleRunComparison}
              className="px-6 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
            >
              Bekreft og sammenlign →
            </button>
          </div>
        </>
      )}

      {/* Steg 4: Kjører sammenligning */}
      {step === "comparing" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Sammenligner tilbud</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Rolf analyserer forskjeller i pris og vilkår
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-700 dark:text-gray-200">Kjører sammenligning...</span>
          </div>
        </>
      )}

      {/* Steg 4: Analyserer tilbud */}
      {step === "compare-processing" && (
        <>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Analyserer og sammenligner tilbud</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Rolf leser tilbudene og sammenligner dem med avtalene du har i dag
          </p>
          <div className="space-y-3">
            {offerStatuses.map((s) => (
              <div
                key={s.fileName}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {s.done ? (
                  s.error ? (
                    <span className="text-red-500 dark:text-red-400 text-sm">✕</span>
                  ) : (
                    <span className="text-green-500 dark:text-green-400 text-sm">✓</span>
                  )
                ) : (
                  <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
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
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-50">Sammenligning av tilbud</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            Steg 4 av 4 – Se hvordan tilbudet måler seg mot avtalene du har i dag
          </p>
          <Comparison
            comparison={comparison}
            onBack={() => setStep("offer-review")}
            onRestart={() => {
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
    </main>
  );
}
