"use client";

// Visning og nedlasting av generert tilbudsforespørsel
export type QuoteRequest = {
  title: string;
  generatedAt: string;
  sections: { heading: string; content: string }[];
};

type Props = {
  quoteRequest: QuoteRequest;
  onBack: () => void;
};

export default function Report({ quoteRequest, onBack }: Props) {
  const handleDownload = () => {
    const date = new Date(quoteRequest.generatedAt).toLocaleDateString("nb-NO");
    const content = [
      `# ${quoteRequest.title}`,
      `Generert: ${date}`,
      "",
      ...quoteRequest.sections.flatMap((s) => [
        `## ${s.heading}`,
        "",
        s.content,
        "",
      ]),
    ].join("\n");

    // BOM (U+FEFF) sikrer at tekstprogrammer tolker filen som UTF-8
    const bom = "\uFEFF";
    const blob = new Blob([bom + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tilbudsforespørsel.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Instruksjonsmelding */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Slik bruker du dette dokumentet</p>
        <p>
          Last ned og send til forsikringsselskaper du vil innhente tilbud fra.
          Dokumentet beskriver hva du trenger – ikke hva du betaler i dag.
        </p>
      </div>

      {/* Forespørselen */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {quoteRequest.sections.map((section, i) => (
          <div key={i} className="px-6 py-5">
            <h3 className="font-semibold text-gray-900 mb-2">{section.heading}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Handlinger */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Tilbake til oversikt
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Last ned som tekstfil
        </button>
      </div>
    </div>
  );
}
