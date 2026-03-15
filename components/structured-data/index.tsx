// JSON-LD strukturert data for søkemotorer
export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://arvid.cloud/#website",
        "url": "https://arvid.cloud",
        "name": "Arvid",
        "description": "Forstå forsikringene dine og bytt på egne premisser. Ingen kommersielle bindinger til forsikringsbransjen.",
        "inLanguage": "nb-NO",
      },
      {
        "@type": "WebApplication",
        "@id": "https://arvid.cloud/#app",
        "name": "Arvid – Din nøytrale forsikringsassistent",
        "url": "https://arvid.cloud",
        "description": "Arvid hjelper norske forbrukere å forstå hva forsikringene deres faktisk dekker, og gjør det enkelt å innhente konkurransetilbud uten kommersielle bindinger.",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "NOK",
        },
        "inLanguage": "nb-NO",
        "isAccessibleForFree": true,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
