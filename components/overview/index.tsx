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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
