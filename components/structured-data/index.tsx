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
        "description": "Forstå forsikringsavtalene dine og finn bedre tilbud",
        "inLanguage": "nb-NO",
      },
      {
        "@type": "WebApplication",
        "@id": "https://arvid.cloud/#app",
        "name": "Arvid – Din nøytrale forsikringsassistent",
        "url": "https://arvid.cloud",
        "description": "Arvid hjelper norske forbrukere å forstå forsikringsavtalene sine, sammenstille dem i et nyttig format, og evaluere konkurransetilbud.",
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
