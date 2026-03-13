// Forsikringsoversikt som tabell
import type { InsurancePolicy } from "@/lib/insurance/types";
import { INSURANCE_TYPE_LABELS } from "@/lib/insurance/types";

type Props = {
  policies: InsurancePolicy[];
};

export default function Oversikt({ policies }: Props) {
  if (policies.length === 0) {
    return <p className="text-gray-500">Ingen forsikringer analysert ennå.</p>;
  }

  const totalPremium = policies.reduce(
    (sum, p) => (p.annualPremium != null ? sum + p.annualPremium : sum),
    0
  );
  const hasPremiumData = policies.some((p) => p.annualPremium != null);

  return (
    <div className="overflow-x-auto">
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
          {policies.map((policy, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-3 border border-gray-200">
                {INSURANCE_TYPE_LABELS[policy.type]}
              </td>
              <td className="p-3 border border-gray-200">{policy.company}</td>
              <td className="p-3 border border-gray-200">{policy.coverageLevel}</td>
              <td className="p-3 border border-gray-200">
                {policy.deductible != null
                  ? `${policy.deductible.toLocaleString("nb-NO")} kr`
                  : "–"}
              </td>
              <td className="p-3 border border-gray-200">
                {policy.maxCoverage != null
                  ? `${policy.maxCoverage.toLocaleString("nb-NO")} kr`
                  : "–"}
              </td>
              <td className="p-3 border border-gray-200">
                {policy.annualPremium != null
                  ? `${policy.annualPremium.toLocaleString("nb-NO")} kr`
                  : "–"}
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
    </div>
  );
}
