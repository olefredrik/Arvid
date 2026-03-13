"use client";

// Hovedflyt: opplasting → analyse → oversikt → tilbudsforespørsel
import { useState } from "react";
import Upload from "@/components/upload";
import Overview from "@/components/overview";
import Report, { type QuoteRequest } from "@/components/report";
import type { InsurancePolicy } from "@/lib/insurance/types";

type Step = "upload" | "processing" | "overview" | "generating" | "report";

type ProcessingStatus = {
  fileName: string;
  done: boolean;
  error?: string;
};

export default function AnalysisPage() {
  const [step, setStep] = useState<Step>("upload");
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

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

        results.push(data.policy as InsurancePolicy);
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

    setPolicies(results);
    setStep("overview");
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

  const errors = statuses.filter((s) => s.error);

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <a href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 inline-block">
        ← Tilbake
      </a>

      {/* Steg 1: Opplasting */}
      {step === "upload" && (
        <>
          <h1 className="text-2xl font-bold mb-1">Last opp forsikringsdokumenter</h1>
          <p className="text-gray-500 text-sm mb-8">
            Steg 1 av 3 – Last opp PDF-filene du har mottatt fra forsikringsselskapet
          </p>
          <Upload onFiles={handleFiles} />
        </>
      )}

      {/* Steg 1 → 2: Analyserer */}
      {step === "processing" && (
        <>
          <h1 className="text-2xl font-bold mb-1">Analyserer dokumenter</h1>
          <p className="text-gray-500 text-sm mb-8">
            Rolf leser og strukturerer innholdet i forsikringsavtalene dine
          </p>
          <div className="space-y-3">
            {statuses.map((s) => (
              <div
                key={s.fileName}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {s.done ? (
                  s.error ? (
                    <span className="text-red-500 text-sm">✕</span>
                  ) : (
                    <span className="text-green-500 text-sm">✓</span>
                  )
                ) : (
                  <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-sm text-gray-700 truncate">{s.fileName}</span>
                {s.error && (
                  <span className="text-xs text-red-500 ml-auto">{s.error}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Steg 2: Oversikt */}
      {step === "overview" && (
        <>
          <h1 className="text-2xl font-bold mb-1">Forsikringsoversikt</h1>
          <p className="text-gray-500 text-sm mb-8">
            Steg 2 av 3 – Se gjennom og bekreft at oversikten er riktig
          </p>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Kunne ikke generere tilbudsforespørsel: {quoteError}
            </div>
          )}

          {policies.length > 0 ? (
            <>
              <Overview policies={policies} />
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setPolicies([]); setStatuses([]); setStep("upload"); }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Last opp flere dokumenter
                </button>
                <button
                  onClick={handleGenerateQuoteRequest}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generer tilbudsforespørsel →
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Ingen forsikringer ble ekstrahert.</p>
              <button
                onClick={() => { setStatuses([]); setStep("upload"); }}
                className="text-blue-600 hover:underline text-sm"
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
          <h1 className="text-2xl font-bold mb-1">Genererer tilbudsforespørsel</h1>
          <p className="text-gray-500 text-sm mb-8">
            Rolf formulerer en kravspesifikasjon du kan sende til forsikringsselskaper
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-700">Formulerer forespørsel...</span>
          </div>
        </>
      )}

      {/* Steg 3: Rapport */}
      {step === "report" && quoteRequest && (
        <>
          <h1 className="text-2xl font-bold mb-1">Tilbudsforespørsel</h1>
          <p className="text-gray-500 text-sm mb-8">
            Steg 3 av 3 – Last ned og send til forsikringsselskaper selv
          </p>
          <Report
            quoteRequest={quoteRequest}
            onBack={() => setStep("overview")}
          />
        </>
      )}
    </main>
  );
}
