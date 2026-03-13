"use client";

// Forsikringsoversikt – tabell på desktop, kort-layout på mobil
import { useState } from "react";
import type { InsurancePolicy, InsuranceType } from "@/lib/insurance/types";
import { INSURANCE_TYPE_LABELS } from "@/lib/insurance/types";

type Props = {
  policies: InsurancePolicy[];
  onUpdate?: (type: InsuranceType, field: "annualPremium" | "deductible", value: number | null) => void;
};

type EditingCell = { type: InsuranceType; field: "annualPremium" | "deductible" } | null;

function EditableAmount({
  value,
  isEditing,
  isLowConfidence,
  onStartEdit,
  onCommit,
}: {
  value: number | null;
  isEditing: boolean;
  isLowConfidence: boolean;
  onStartEdit: () => void;
  onCommit: (newValue: number | null) => void;
}) {
  const [draft, setDraft] = useState("");

  if (isEditing) {
    return (
      <input
        type="text"
        inputMode="numeric"
        className="w-full border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        defaultValue={value ?? ""}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const parsed = parseInt(draft.replace(/\s/g, ""), 10);
            onCommit(isNaN(parsed) ? null : parsed);
          }
          if (e.key === "Escape") onCommit(value);
        }}
        onBlur={() => {
          const parsed = parseInt(draft.replace(/\s/g, ""), 10);
          onCommit(isNaN(parsed) ? null : parsed);
        }}
      />
    );
  }

  return (
    <button
      onClick={onStartEdit}
      title="Klikk for å redigere"
      className="flex items-center gap-1.5 text-left group"
    >
      <span className={isLowConfidence ? "text-amber-700" : ""}>
        {value != null ? `${value.toLocaleString("nb-NO")} kr` : "–"}
      </span>
      {isLowConfidence && value != null && (
        <span title="Prisen er usikker – klikk for å korrigere" className="text-amber-500 cursor-help">⚠</span>
      )}
      <span className="opacity-0 group-hover:opacity-100 text-gray-300 text-xs ml-1">✎</span>
    </button>
  );
}

export default function Oversikt({ policies, onUpdate }: Props) {
  const [editing, setEditing] = useState<EditingCell>(null);

  if (policies.length === 0) {
    return <p className="text-gray-500">Ingen forsikringer analysert ennå.</p>;
  }

  // Bundlede priser telles kun én gang per unik selskap+pris-kombinasjon
  const totalPremium = (() => {
    const seenBundles = new Set<string>();
    return policies.reduce((sum, p) => {
      if (p.annualPremium == null) return sum;
      if (p.isBundledPremium) {
        const key = `${p.company}:${p.annualPremium}`;
        if (seenBundles.has(key)) return sum;
        seenBundles.add(key);
      }
      return sum + p.annualPremium;
    }, 0);
  })();
  const hasPremiumData = policies.some((p) => p.annualPremium != null);

  const commit = (type: InsuranceType, field: "annualPremium" | "deductible", value: number | null) => {
    setEditing(null);
    onUpdate?.(type, field, value);
  };

  const renderAmount = (
    policy: InsurancePolicy,
    field: "annualPremium" | "deductible",
    isLowConfidence = false
  ) => {
    const value = policy[field];
    if (!onUpdate) {
      return value != null ? `${value.toLocaleString("nb-NO")} kr` : "–";
    }
    return (
      <EditableAmount
        value={value}
        isEditing={editing?.type === policy.type && editing.field === field}
        isLowConfidence={isLowConfidence}
        onStartEdit={() => setEditing({ type: policy.type, field })}
        onCommit={(v) => commit(policy.type, field, v)}
      />
    );
  };

  return (
    <div>
      {/* Desktop: tabell */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 border border-gray-200 font-medium">Type</th>
              <th className="p-3 border border-gray-200 font-medium">Selskap</th>
              <th className="p-3 border border-gray-200 font-medium">Dekningsnivå</th>
              <th className="p-3 border border-gray-200 font-medium">Egenandel</th>
              <th className="p-3 border border-gray-200 font-medium">Maks dekning</th>
              <th className="p-3 border border-gray-200 font-medium">Årspremie</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.type} className="hover:bg-gray-50">
                <td className="p-3 border border-gray-200">{INSURANCE_TYPE_LABELS[policy.type]}</td>
                <td className="p-3 border border-gray-200">{policy.company}</td>
                <td className="p-3 border border-gray-200">{policy.coverageLevel}</td>
                <td className="p-3 border border-gray-200">
                  {renderAmount(policy, "deductible")}
                </td>
                <td className="p-3 border border-gray-200">
                  {policy.maxCoverage != null ? `${policy.maxCoverage.toLocaleString("nb-NO")} kr` : "–"}
                </td>
                <td className="p-3 border border-gray-200">
                  <div>
                    {renderAmount(policy, "annualPremium", policy.extractionConfidence === "low")}
                    {policy.isBundledPremium && (
                      <p className="text-xs text-gray-400 mt-0.5">pakketilbud</p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {hasPremiumData && (
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td colSpan={5} className="p-3 border border-gray-200 text-right text-gray-600">
                  Totalt per år
                </td>
                <td className="p-3 border border-gray-200">
                  {totalPremium.toLocaleString("nb-NO")} kr
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {onUpdate && (
          <p className="text-xs text-gray-400 mt-2">Klikk på egenandel eller premie for å korrigere</p>
        )}
      </div>

      {/* Mobil: kort-layout */}
      <div className="md:hidden space-y-3">
        {policies.map((policy) => (
          <div key={policy.type} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <p className="font-medium text-sm text-gray-900">{INSURANCE_TYPE_LABELS[policy.type]}</p>
              <p className="text-xs text-gray-500">{policy.company}</p>
            </div>
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Dekningsnivå</span>
                <span className="text-gray-800 text-right">{policy.coverageLevel}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Egenandel</span>
                <span className="text-gray-800">
                  {renderAmount(policy, "deductible")}
                </span>
              </div>
              {policy.maxCoverage != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Maks dekning</span>
                  <span className="text-gray-800">{policy.maxCoverage.toLocaleString("nb-NO")} kr</span>
                </div>
              )}
              <div className="flex justify-between gap-4 pt-1 border-t border-gray-100 font-medium">
                <span className="text-gray-700">Årspremie</span>
                <div className="text-right">
                  <span className="text-gray-900">
                    {renderAmount(policy, "annualPremium", policy.extractionConfidence === "low")}
                  </span>
                  {policy.isBundledPremium && (
                    <p className="text-xs text-gray-400 font-normal">pakketilbud</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasPremiumData && (
          <div className="flex justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
            <span className="text-gray-600">Totalt per år</span>
            <span className="text-gray-900">{totalPremium.toLocaleString("nb-NO")} kr</span>
          </div>
        )}
        {onUpdate && (
          <p className="text-xs text-gray-400">Trykk på egenandel eller premie for å korrigere</p>
        )}
      </div>
    </div>
  );
}
