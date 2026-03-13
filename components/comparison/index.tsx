"use client";

// Sammenligning av nåværende forsikringer med mottatte tilbud
import { useState } from "react";
import type { ComparisonResult } from "@/lib/insurance/types";
import { INSURANCE_TYPE_LABELS } from "@/lib/insurance/types";

type Props = {
  comparison: ComparisonResult;
  onBack: () => void;
  onRestart: () => void;
};

// Fargekoding per vurdering
function VerdictBadge({ verdict }: { verdict: "Bytt" | "Behold" | "Vurder" }) {
  const styles = {
    Bytt: "bg-green-100 text-green-800",
    Behold: "bg-gray-100 text-gray-700",
    Vurder: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[verdict]}`}>
      {verdict}
    </span>
  );
}

export default function Comparison({ comparison, onBack, onRestart }: Props) {
  const hasPriceDiff = comparison.currentTotal != null && comparison.offerTotal != null;
  const totalDiff = hasPriceDiff ? comparison.offerTotal! - comparison.currentTotal! : null;
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpanded = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-8">

      {/* Prissammendrag */}
      {hasPriceDiff && (
        <div className={`p-5 rounded-lg border ${totalDiff! < 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Prissammenligning per år</p>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>Nåværende: <strong>{comparison.currentTotal!.toLocaleString("nb-NO")} kr</strong></span>
                <span>Tilbud: <strong>{comparison.offerTotal!.toLocaleString("nb-NO")} kr</strong></span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold ${totalDiff! < 0 ? "text-green-700" : "text-amber-700"}`}>
                {totalDiff! < 0 ? "−" : "+"}{Math.abs(totalDiff!).toLocaleString("nb-NO")} kr
              </p>
              <p className="text-xs text-gray-500">{totalDiff! < 0 ? "besparelse" : "dyrere"} per år</p>
            </div>
          </div>
        </div>
      )}

      {/* AI-anbefaling */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Rolfs vurdering</p>
        <p className="leading-relaxed">{comparison.recommendation}</p>
      </div>

      {/* Per-type sammenligning */}
      <div className="space-y-4">
        {comparison.comparisons.map((c, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900 text-sm">
                  {INSURANCE_TYPE_LABELS[c.type] ?? c.type}
                </h3>
                {c.offerDocumentCount > 1 && (
                  <p className="text-xs text-gray-400 mt-0.5">basert på {c.offerDocumentCount} dokumenter</p>
                )}
              </div>
              <VerdictBadge verdict={c.verdict} />
            </div>

            {/* Side-by-side tabell */}
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Nåværende</p>
                <p className="text-sm text-gray-700">{c.current.company}</p>
                <p className="text-sm text-gray-600">{c.current.coverageLevel}</p>
                {c.current.deductible != null && (
                  <p className="text-sm text-gray-500">Egenandel: {c.current.deductible.toLocaleString("nb-NO")} kr</p>
                )}
                {c.current.annualPremium != null && (
                  <p className="text-sm font-medium text-gray-700 mt-1">{c.current.annualPremium.toLocaleString("nb-NO")} kr/år</p>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tilbud</p>
                <p className="text-sm text-gray-700">{c.offer.company}</p>
                <p className="text-sm text-gray-600">{c.offer.coverageLevel}</p>
                {c.offer.deductible != null && (
                  <p className="text-sm text-gray-500">Egenandel: {c.offer.deductible.toLocaleString("nb-NO")} kr</p>
                )}
                {c.offer.annualPremium != null && (
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    {c.offer.annualPremium.toLocaleString("nb-NO")} kr/år
                    {c.premiumDiff != null && (
                      <span className={`ml-2 text-xs font-normal ${c.premiumDiff < 0 ? "text-green-600" : "text-amber-600"}`}>
                        ({c.premiumDiff < 0 ? "−" : "+"}{Math.abs(c.premiumDiff).toLocaleString("nb-NO")} kr)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Vurdering og avvik – kan ekspanderes */}
            {(c.assessment || c.coverageDifferences.length > 0) && (
              <>
                <button
                  onClick={() => toggleExpanded(i)}
                  className="w-full flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <span>{expanded.has(i) ? "Skjul detaljer" : "Vis detaljer"}</span>
                  <span className="text-gray-400">{expanded.has(i) ? "▲" : "▼"}</span>
                </button>
                {expanded.has(i) && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    {c.assessment && (
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{c.assessment}</p>
                    )}
                    {c.coverageDifferences.length > 0 && (
                      <ul className="space-y-1">
                        {c.coverageDifferences.map((diff, j) => (
                          <li key={j} className="text-xs text-gray-500 flex gap-2">
                            <span className="shrink-0">•</span>
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Forsikringstyper uten match */}
      {comparison.unmatchedCurrent.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-medium mb-1">Ikke dekket i tilbudet</p>
          <p>Tilbudet inneholder ikke disse forsikringstypene du har i dag: {comparison.unmatchedCurrent.map(p => INSURANCE_TYPE_LABELS[p.type]).join(", ")}.</p>
        </div>
      )}

      {comparison.unmatchedOffers.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-1">Ekstra i tilbudet</p>
          <p>Tilbudet inneholder forsikringstyper du ikke har i dag: {comparison.unmatchedOffers.map(p => INSURANCE_TYPE_LABELS[p.type]).join(", ")}.</p>
        </div>
      )}

      {/* Handlinger */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Tilbake til tilbudsgjennomgang
        </button>
        <button
          onClick={onRestart}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Start på nytt
        </button>
      </div>
    </div>
  );
}
