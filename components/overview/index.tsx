"use client";

// Forsikringsoversikt – tabell på desktop, kort-layout på mobil
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { InsurancePolicy, InsuranceType } from "@/lib/insurance/types";
import { INSURANCE_TYPE_LABELS } from "@/lib/insurance/types";
import { sumPolicies } from "@/lib/utils";

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
        aria-label="Rediger beløp"
        className="w-full border border-amber-500 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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
      aria-label="Rediger beløp"
      className="flex items-center gap-1.5 text-left group cursor-pointer"
    >
      <span className={isLowConfidence ? "text-amber-700 dark:text-amber-300" : ""}>
        {value != null ? `${value.toLocaleString("nb-NO")} kr` : "–"}
      </span>
      {isLowConfidence && value != null && (
        <span aria-label="Prisen er usikker – klikk for å korrigere" title="Prisen er usikker – klikk for å korrigere" className="text-amber-500 dark:text-amber-400 cursor-help">⚠</span>
      )}
      <span className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 text-xs ml-1" aria-hidden="true">✎</span>
    </button>
  );
}

export default function Oversikt({ policies, onUpdate }: Props) {
  const [editing, setEditing] = useState<EditingCell>(null);

  if (policies.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Ingen forsikringer analysert ennå.</p>;
  }

  // Bundlede priser telles kun én gang per unik selskap+pris-kombinasjon
  const totalPremium = sumPolicies(policies);
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

  const lowConfidencePolicies = policies.filter((p) => p.extractionConfidence === "low");

  return (
    <div>
      {/* Varsel ved lav konfidens */}
      {lowConfidencePolicies.length > 0 && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium mb-1">Vi er usikre på deler av analysen</p>
          <p className="text-amber-700 dark:text-amber-300">
            {lowConfidencePolicies.map((p) => INSURANCE_TYPE_LABELS[p.type]).join(", ")} har lav konfidens.
            Last opp forsikringsbeviset (ikke bare de generelle vilkårene) for et mer nøyaktig resultat.
            Du kan korrigere premie og egenandel ved å klikke på verdiene i tabellen.
          </p>
        </div>
      )}

      {/* Desktop: tabell */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">Type</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">Selskap</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">Dekningsnivå</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">Egenandel</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">Maks dekning</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">Årspremie</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.type} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">{INSURANCE_TYPE_LABELS[policy.type]}</td>
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                  <div>{policy.company}</div>
                  {policy.policyNumber && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{policy.policyNumber}</div>
                  )}
                </td>
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">{policy.coverageLevel}</td>
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                  {renderAmount(policy, "deductible")}
                </td>
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                  {policy.maxCoverage != null ? `${policy.maxCoverage.toLocaleString("nb-NO")} kr` : "–"}
                </td>
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                  <div>
                    {renderAmount(policy, "annualPremium", policy.extractionConfidence === "low")}
                    {policy.isBundledPremium && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">pakketilbud</p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {hasPremiumData && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                <td colSpan={5} className="p-3 border border-gray-200 dark:border-gray-700 text-right text-gray-600 dark:text-gray-300">
                  Totalt per år
                </td>
                <td className="p-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                  {totalPremium.toLocaleString("nb-NO")} kr
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {onUpdate && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2"><Lightbulb className="inline w-3.5 h-3.5 mr-1 text-gray-400 dark:text-gray-500" aria-hidden="true" /> Tips: Du kan klikke på egenandel eller premie for å korrigere tallene</p>
        )}
      </div>

      {/* Mobil: kort-layout */}
      <div className="md:hidden space-y-3">
        {policies.map((policy) => (
          <div key={policy.type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{INSURANCE_TYPE_LABELS[policy.type]}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {policy.company}
                {policy.policyNumber && <span className="text-gray-400 dark:text-gray-500"> · {policy.policyNumber}</span>}
              </p>
            </div>
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Dekningsnivå</span>
                <span className="text-gray-800 dark:text-gray-100 text-right">{policy.coverageLevel}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Egenandel</span>
                <span className="text-gray-800 dark:text-gray-100">
                  {renderAmount(policy, "deductible")}
                </span>
              </div>
              {policy.maxCoverage != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Maks dekning</span>
                  <span className="text-gray-800 dark:text-gray-100">{policy.maxCoverage.toLocaleString("nb-NO")} kr</span>
                </div>
              )}
              <div className="flex justify-between gap-4 pt-1 border-t border-gray-100 dark:border-gray-800 font-medium">
                <span className="text-gray-700 dark:text-gray-200">Årspremie</span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-gray-50">
                    {renderAmount(policy, "annualPremium", policy.extractionConfidence === "low")}
                  </span>
                  {policy.isBundledPremium && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">pakketilbud</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasPremiumData && (
          <div className="flex justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium">
            <span className="text-gray-600 dark:text-gray-300">Totalt per år</span>
            <span className="text-gray-900 dark:text-gray-50">{totalPremium.toLocaleString("nb-NO")} kr</span>
          </div>
        )}
        {onUpdate && (
          <p className="text-xs text-gray-400 dark:text-gray-500"><Lightbulb className="inline w-3.5 h-3.5 mr-1 text-gray-400 dark:text-gray-500" aria-hidden="true" /> Tips: Du kan klikke på egenandel eller premie for å korrigere tallene</p>
        )}
      </div>
    </div>
  );
}
